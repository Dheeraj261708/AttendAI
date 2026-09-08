import os
from flask import Blueprint, jsonify, request
from services.face_service import save_student_image
from services.verify_service import find_matching_student

face_bp = Blueprint("face", __name__)


@face_bp.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "AI Attendance Service Running"
    })


@face_bp.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "Running",
        "service": "AI Face Recognition"
    })


# -------------------------------
# Register Student Face
# -------------------------------
@face_bp.route("/register-face", methods=["POST"])
def register_face():

    if "image" not in request.files:
        return jsonify({
            "success": False,
            "message": "No image uploaded"
        }), 400

    image = request.files["image"]

    # Student ID comes from Node.js
    student_id = request.form.get("student_id")

    if not student_id:
        return jsonify({
            "success": False,
            "message": "Student ID is required"
        }), 400

    try:

        result = save_student_image(
            image,
            student_id
        )

        # Duplicate face
        if result.get("duplicate"):
            return jsonify(result), 409

        # Other registration failure
        if not result.get("success"):
            return jsonify(result), 400

        # Successful registration
        return jsonify(result), 200

    except Exception as error:

        print(
            "Face registration error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Face registration failed"
        }), 500


# -------------------------------
# Verify Student Face
# -------------------------------
# -------------------------------
# Verify Student Face
# -------------------------------
@face_bp.route("/verify-face", methods=["POST"])
def verify_face():

    images = request.files.getlist("image")

    if len(images) == 0:
        return jsonify({
            "success": False,
            "message": "No image uploaded"
        }), 400

    if len(images) > 1:
        return jsonify({
            "success": False,
            "message": "Upload only one image"
        }), 400

    image = images[0]

    upload_path = "temp_verify.jpg"
    image.save(upload_path)

    result = find_matching_student(upload_path)

    if os.path.exists(upload_path):
        os.remove(upload_path)

    if result is None:
        return jsonify({
            "success": False,
            "message": "No matching student found"
        }), 404

    return jsonify({
        "success": True,
        "student_id": result["student_id"],
        "distance": result["distance"]
    }), 200