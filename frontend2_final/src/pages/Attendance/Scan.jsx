import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  XCircle,
  MapPin,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import QrScanner from "qr-scanner";

import AppLayout from "../../layouts/AppLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";

import {
  validateQRCode,
  markAttendance,
} from "../../services/attendanceService";

export default function Scan() {
  const videoRef = useRef(null);
  const faceVideoRef = useRef(null);
  const scannerRef = useRef(null);
  const processingRef = useRef(false);
  const faceStreamRef = useRef(null);
  const faceCanvasRef = useRef(null);

  const navigate = useNavigate();

  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [locationStatus, setLocationStatus] = useState("");

  const [faceCapture, setFaceCapture] = useState(false);
  const [faceReady, setFaceReady] = useState(false);
  const [pendingSession, setPendingSession] = useState(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setError("");
    setSuccess(false);
    setProcessing(false);
    processingRef.current = false;

    try {
      if (!window.isSecureContext) {
        setError(
          "Camera access requires localhost or HTTPS."
        );
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "Camera is not available in this browser."
        );
        return;
      }

      if (!videoRef.current) {
        return;
      }

      const scanner = new QrScanner(
        videoRef.current,
        async (result) => {
          if (processingRef.current) {
            return;
          }

          processingRef.current = true;

          const qrToken =
            typeof result === "string"
              ? result
              : result?.data;

          if (!qrToken) {
            processingRef.current = false;
            return;
          }

          await processQRCode(qrToken);
        },
        {
          preferredCamera: "environment",
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
        }
      );

      scannerRef.current = scanner;

      await scanner.start();

      setScanning(true);
    } catch (err) {
      console.error("Camera error:", err);

      setError(
        err?.message ||
        "Unable to start camera. Please allow camera permission."
      );

      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }

    // Explicitly release the QR camera
    if (videoRef.current) {
      const stream = videoRef.current.srcObject;

      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      videoRef.current.srcObject = null;
    }

    setScanning(false);
  };
  const startFaceCamera = async () => {
    setError("");
    setFaceReady(false);

    try {
      // Give the QR camera time to release its hardware
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (!window.isSecureContext) {
        throw new Error(
          "Camera access requires HTTPS."
        );
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera is not available in this browser."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

      faceStreamRef.current = stream;

      if (faceVideoRef.current) {
        faceVideoRef.current.srcObject = stream;
        await faceVideoRef.current.play();
        setFaceReady(true);
      }
    } catch (err) {
      console.error("Face camera error:", err);

      setError(
        err?.message ||
        "Unable to start face camera."
      );

      setFaceReady(false);
    }
  };

  const stopFaceCamera = () => {
    if (faceStreamRef.current) {
      faceStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      faceStreamRef.current = null;
    }

    setFaceReady(false);
  };
  const captureFace = async () => {
    if (!faceReady || !faceVideoRef.current) {
      setError("Camera is not ready.");
      return;
    }

    if (!pendingSession) {
      setError("Attendance session was not found.");
      return;
    }

    try {
      setProcessing(true);
      setError("");

      toast.loading(
        "Capturing and verifying your face...",
        {
          id: "qr-process",
        }
      );

      const video = faceVideoRef.current;
      const canvas = faceCanvasRef.current;

      if (!canvas) {
        throw new Error(
          "Face capture canvas is unavailable."
        );
      }

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const context = canvas.getContext("2d");

      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const blob = await new Promise((resolve) => {
        canvas.toBlob(
          resolve,
          "image/jpeg",
          0.9
        );
      });

      if (!blob) {
        throw new Error(
          "Unable to capture face image."
        );
      }

      // IMPORTANT:
      // Do NOT stop the camera here.
      // If face verification fails, the user
      // must be able to capture another photo.

      // Get current GPS location
      const location = await getLocation();

      if (
        !Number.isFinite(location.latitude) ||
        !Number.isFinite(location.longitude)
      ) {
        throw new Error(
          "Valid GPS location is required to mark attendance."
        );
      }

      toast.loading(
        "Verifying location, face and marking attendance...",
        {
          id: "qr-process",
        }
      );

      const formData = new FormData();

formData.append(
  "image",
  blob,
  "attendance-face.jpg"
);

// CRITICAL: send the QR token
formData.append(
  "qrToken",
  pendingSession.qrToken
);

formData.append(
  "sessionId",
  pendingSession._id
);

      formData.append(
        "latitude",
        String(location.latitude)
      );

      formData.append(
        "longitude",
        String(location.longitude)
      );

      const result =
        await markAttendance(formData);

      if (!result?.success) {
        throw new Error(
          result?.message ||
          "Unable to mark attendance."
        );
      }

      // Attendance succeeded.
      // Now it is safe to stop the camera.
      stopFaceCamera();

      setFaceCapture(false);
      setPendingSession(null);
      setSuccess(true);

      toast.success(
        "Attendance marked successfully!",
        {
          id: "qr-process",
        }
      );
    } catch (err) {
      console.error(
        "Face attendance error:",
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to verify face.";

      setError(message);

      toast.error(message, {
        id: "qr-process",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error(
            "Location services are not supported on this device."
          )
        );
        return;
      }

      setLocationStatus("Getting your location...");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
          ) {
            reject(
              new Error(
                "Unable to obtain a valid GPS location."
              )
            );
            return;
          }

          setLocationStatus("Location captured.");

          resolve({
            latitude,
            longitude,
            accuracy: position.coords.accuracy,
          });
        },

        (error) => {
          console.warn("Location error:", error);

          let message =
            "Unable to get your location.";

          if (error.code === 1) {
            message =
              "Location permission was denied. Please allow location access to mark attendance.";
          } else if (error.code === 2) {
            message =
              "Your location could not be determined. Please enable GPS/location services.";
          } else if (error.code === 3) {
            message =
              "Location request timed out. Please try again.";
          }

          setLocationStatus(message);

          reject(new Error(message));
        },

        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  };
  const processQRCode = async (qrToken) => {
    setProcessing(true);
    setError("");

    try {
      stopScanner();

      toast.loading("Validating QR code...", {
        id: "qr-process",
      });

      // --------------------------------
      // 1. Validate QR
      // --------------------------------

      const validation = await validateQRCode(qrToken);

      if (!validation?.success || !validation?.session) {
        throw new Error(
          validation?.message ||
          "Invalid or expired QR code."
        );
      }

      const session = validation.session;

      // --------------------------------
      // 2. Get logged-in student
      // --------------------------------

      const savedStudent = JSON.parse(
        sessionStorage.getItem("student") || "null"
      );

      const studentId =
        savedStudent?._id ||
        savedStudent?.id;

      if (!studentId) {
        throw new Error(
          "Student information was not found. Please login again."
        );
      }

      // --------------------------------
      // 3. Start face verification
      // --------------------------------

      setPendingSession({
  ...session,
  qrToken,
});
      setFaceCapture(true);

      toast.success(
        "QR verified. Please capture your face.",
        {
          id: "qr-process",
        }
      );

      setTimeout(() => {
        startFaceCamera();
      }, 100);

      // --------------------------------
      // Success
      // --------------------------------



    } catch (err) {
      console.error("QR attendance error:", err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to process QR code.";

      setError(message);

      toast.error(message, {
        id: "qr-process",
      });

      processingRef.current = false;
    } finally {
      setProcessing(false);
    }
  };

  const scanAgain = () => {
    setError("");
    setSuccess(false);
    setLocationStatus("");
    processingRef.current = false;

    startScanner();
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">

        {/* Header */}

        <div className="mb-8">
          <p className="mb-1 text-sm font-semibold text-blue-600">
            Attendance check-in
          </p>

          <h1 className="text-3xl font-bold text-slate-900">
            QR Scanner
          </h1>

          <p className="mt-2 text-slate-500">
            Scan the classroom QR code to mark your
            attendance.
          </p>
        </div>

        {/* Scanner */}

        <Card className="overflow-hidden">
          {/* ============================= */}
          {/* FACE VERIFICATION SCREEN */}
          {/* ============================= */}

          {faceCapture && !success && (
            <div className="p-6">

              {/* Face Verification Header */}
              <div className="border-b border-slate-100 px-0 py-5">

                <div className="flex items-center gap-3">

                  <div className="rounded-xl bg-blue-50 p-3">
                    <Camera className="h-6 w-6 text-blue-600" />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Face Verification
                    </h2>

                    <p className="text-sm text-slate-500">
                      Look directly at the camera and capture your face.
                    </p>
                  </div>

                </div>

              </div>

              {/* Face Camera */}
              <div className="mt-6">

                <div className="relative mx-auto aspect-video max-w-2xl overflow-hidden rounded-2xl bg-slate-950">

                  <video
                    ref={faceVideoRef}
                    className="h-full w-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />

                  {/* Camera Loading */}
                  {!faceReady && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">

                      <div className="rounded-2xl bg-white px-6 py-5 text-center">

                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

                        <p className="mt-3 font-semibold text-slate-900">
                          Starting camera...
                        </p>

                      </div>

                    </div>
                  )}

                </div>

                {/* Hidden Canvas */}
                <canvas
                  ref={faceCanvasRef}
                  className="hidden"
                />

                {/* Face Error */}
                {/* Face / Attendance Error */}
                {error && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">

                    <XCircle className="mt-0.5 h-5 w-5 shrink-0" />

                    <div>

                      <p className="font-semibold">
                        {error.toLowerCase().includes("attendance already marked")
                          ? "Attendance already marked"
                          : "Face verification failed"}
                      </p>

                      <p className="mt-1 text-sm">
                        {error.toLowerCase().includes("attendance already marked")
                          ? "Your attendance has already been recorded for today."
                          : error}
                      </p>

                    </div>

                  </div>
                )}

                {/* Face Buttons */}
                <div className="mt-6 flex justify-center gap-3">

                  <Button
                    onClick={captureFace}
                    disabled={!faceReady || processing}
                  >

                    <Camera className="mr-2 h-4 w-4" />

                    Capture Face

                  </Button>

                  <Button
                    variant="secondary"
                    disabled={processing}
                    onClick={() => {

                      stopFaceCamera();

                      setFaceCapture(false);

                      setPendingSession(null);

                      setProcessing(false);

                      processingRef.current = false;

                    }}
                  >

                    Cancel

                  </Button>

                </div>

              </div>

            </div>
          )}

          {!success && !faceCapture && (
            <>
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-3">
                    <Camera className="h-6 w-6 text-blue-600" />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Scan attendance QR
                    </h2>

                    <p className="text-sm text-slate-500">
                      Point your camera at the QR code
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">

                {/* Camera */}

                <div className="relative mx-auto aspect-video max-w-2xl overflow-hidden rounded-2xl bg-slate-950">

                  <video
                    ref={videoRef}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                  />


                  {!scanning && !processing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">

                      <div className="mb-4 rounded-full bg-white/10 p-5">
                        <Camera className="h-10 w-10 text-white" />
                      </div>

                      <h3 className="text-lg font-bold text-white">
                        Camera is ready
                      </h3>

                      <p className="mt-2 max-w-sm text-sm text-slate-300">
                        Start the camera and point it
                        toward the classroom QR code.
                      </p>

                    </div>
                  )}

                  {processing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">

                      <div className="rounded-2xl bg-white px-6 py-5 text-center shadow-xl">

                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

                        <p className="mt-3 font-semibold text-slate-900">
                          Processing attendance...
                        </p>

                      </div>

                    </div>
                  )}

                </div>

                {/* Location */}

                {locationStatus && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">

                    <MapPin className="h-4 w-4 text-blue-600" />

                    {locationStatus}

                  </div>
                )}

                {/* Error */}

                {error && (
                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">

                    <XCircle className="mt-0.5 h-5 w-5 shrink-0" />

                    <div>
                      <p className="font-semibold">
                        Attendance failed
                      </p>

                      <p className="mt-1 text-sm">
                        {error}
                      </p>
                    </div>

                  </div>
                )}

                {/* Buttons */}

                <div className="mt-6 flex flex-wrap gap-3">

                  {!scanning && !success && !processing && (
                    <Button onClick={startScanner}>
                      <Camera className="mr-2 h-4 w-4" />
                      Start camera
                    </Button>
                  )}

                  {scanning && !processing && (
                    <Button
                      variant="secondary"
                      onClick={stopScanner}
                    >
                      Stop camera
                    </Button>
                  )}

                  {error && !processing && (
                    <Button onClick={scanAgain}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Try again
                    </Button>
                  )}

                </div>

              </div>
            </>
          )}

          {/* Success */}

          {success && (
            <div className="px-6 py-14 text-center">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">

                <CheckCircle2 className="h-10 w-10 text-emerald-600" />

              </div>

              <h2 className="mt-6 text-2xl font-bold text-slate-900">
                Attendance marked!
              </h2>

              <p className="mx-auto mt-2 max-w-md text-slate-500">
                Your attendance has been successfully
                recorded for this session.
              </p>

              <div className="mt-8 flex justify-center gap-3">

                <Button
                  variant="secondary"
                  onClick={scanAgain}
                >
                  Scan another QR
                </Button>

                <Button
                  onClick={() => navigate("/dashboard")}
                >
                  Back to dashboard
                </Button>

              </div>

            </div>
          )}

        </Card>

      </div>
    </AppLayout>
  );
}


