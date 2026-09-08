import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads", "students")

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB