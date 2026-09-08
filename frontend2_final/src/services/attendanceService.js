import api from "./api";

export const startSession = async (payload) => {
  const response = await api.post("/session/start", payload);
  return response.data;
};

export const getActiveSession = async () => {
  const response = await api.get("/session/active");
  return response.data;
};

export const getAllSessions = async () => {
  const response = await api.get("/session");
  return response.data;
};

export const getSessionStats = async (sessionId) => {
  const response = await api.get(`/session/${sessionId}/stats`);
  return response.data;
};

export const getRecentAttendance = async (sessionId) => {
  const response = await api.get(`/session/${sessionId}/recent`);
  return response.data;
};

export const endSession = async (sessionId) => {
  const response = await api.put(`/session/end/${sessionId}`);
  return response.data;
};

// QR validation
export const validateQRCode = async (qrToken) => {
  const response = await api.post("/attendance-mark/validate", {
    qrToken,
  });

  return response.data;
};

// Mark attendance
export const markAttendance = async (formData) => {
  const response = await api.post(
    "/attendance-mark/mark",
    formData
  );

  return response.data;
};

export const verifyQR = async (token) => {
  const response = await api.get(`/session/verify/${token}`);
  return response.data;
};

export const markAttendanceWithImage = async (formData) => {
  const response = await api.post("/attendance/mark", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
// ============================================================
// Student Attendance
// ============================================================

export const getMyAttendanceSummary = async () => {
    const response = await api.get(
        "/student-attendance/summary"
    );

    return response.data;
};

export const getMyAttendanceHistory = async () => {
    const response = await api.get(
        "/student-attendance/history"
    );

    return response.data;
};