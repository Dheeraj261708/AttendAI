import os
import json

from werkzeug.utils import secure_filename
from deepface import DeepFace

from config.config import UPLOAD_FOLDER


EMBEDDING_FILE = os.path.join(
    "encodings",
    "embeddings.json"
)


def load_embeddings():
    """
    Load all registered face embeddings.
    """

    if not os.path.exists(EMBEDDING_FILE):
        return []

    try:
        with open(
            EMBEDDING_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            data = json.load(file)

            if isinstance(data, list):
                return data

    except (
        json.JSONDecodeError,
        OSError
    ) as error:

        print(
            "Could not load embeddings:",
            error
        )

    return []


def save_embeddings(embeddings):
    """
    Save all face embeddings.
    """

    os.makedirs(
        os.path.dirname(EMBEDDING_FILE),
        exist_ok=True
    )

    with open(
        EMBEDDING_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            embeddings,
            file,
            indent=4
        )


def save_student_image(file, student_id):
    """
    Save a student's face image and embedding.

    A face can only belong to one student.

    If the uploaded face already matches another
    registered student, registration is rejected.
    """

    # ----------------------------------------
    # 1. Create upload directory
    # ----------------------------------------

    os.makedirs(
        UPLOAD_FOLDER,
        exist_ok=True
    )

    # ----------------------------------------
    # 2. Validate filename
    # ----------------------------------------

    filename = secure_filename(
        file.filename
    )

    if not filename:
        return {
            "success": False,
            "message": "Invalid image filename"
        }

    filepath = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    # ----------------------------------------
    # 3. Save uploaded image temporarily
    # ----------------------------------------

    file.save(filepath)

    print(
        "Image saved:",
        filepath
    )

    # ----------------------------------------
    # 4. Generate face embedding
    # ----------------------------------------

    try:

        embedding_result = DeepFace.represent(
            img_path=filepath,
            model_name="ArcFace",
            enforce_detection=True
        )

    except Exception as error:

        # Remove invalid uploaded image
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
        except OSError:
            pass

        print(
            "Face detection failed:",
            error
        )

        return {
            "success": False,
            "message": (
                "No valid face detected "
                "in the uploaded image"
            )
        }

    if not embedding_result:

        try:
            if os.path.exists(filepath):
                os.remove(filepath)
        except OSError:
            pass

        return {
            "success": False,
            "message": "Face embedding could not be generated"
        }

    new_embedding = embedding_result[0][
        "embedding"
    ]

    print(
        "Embedding generated"
    )

    # ----------------------------------------
    # 5. Load existing registrations
    # ----------------------------------------

    all_embeddings = load_embeddings()

    print(
        "Existing registrations:",
        len(all_embeddings)
    )

    # ----------------------------------------
    # 6. Check duplicate face
    # ----------------------------------------

    for existing_student in all_embeddings:

        existing_student_id = str(
            existing_student.get("student_id", "")
        )

        # Don't compare a student against
        # their own existing registration.
        if existing_student_id == str(student_id):
            continue

        existing_image = existing_student.get(
            "image_path"
        )

        if not existing_image:
            continue

        if not os.path.exists(existing_image):

            print(
                "Existing image missing:",
                existing_image
            )

            continue

        try:

            verification = DeepFace.verify(
                img1_path=filepath,
                img2_path=existing_image,
                model_name="ArcFace",
                enforce_detection=True
            )

            print("--------------------------------")
            print(
                "Existing Student:",
                existing_student_id
            )
            print(
                "Verified:",
                verification.get("verified")
            )
            print(
                "Distance:",
                verification.get("distance")
            )
            print(
                "Threshold:",
                verification.get("threshold")
            )

            if verification.get("verified"):

                # Same face already registered
                try:
                    os.remove(filepath)
                except OSError:
                    pass

                print(
                    "DUPLICATE FACE DETECTED"
                )

                return {
                    "success": False,
                    "duplicate": True,
                    "message": (
                        "This face is already "
                        "registered to another student."
                    ),
                    "student_id": existing_student_id,
                    "distance": verification.get(
                        "distance"
                    )
                }

        except Exception as error:

            print(
                "Face comparison failed:",
                error
            )

            # Continue checking other students
            continue

    # ----------------------------------------
    # 7. Remove old registration for this student
    # ----------------------------------------

    all_embeddings = [
        student
        for student in all_embeddings
        if str(student.get("student_id")) != str(student_id)
    ]

    # ----------------------------------------
    # 8. Create new registration
    # ----------------------------------------

    embedding_data = {
        "student_id": str(student_id),
        "filename": filename,
        "image_path": filepath,
        "embedding": new_embedding
    }

    all_embeddings.append(
        embedding_data
    )

    # ----------------------------------------
    # 9. Save embeddings
    # ----------------------------------------

    save_embeddings(
        all_embeddings
    )

    print(
        "Embeddings saved successfully!"
    )

    return {
        "success": True,
        "student_id": str(student_id),
        "filename": filename,
        "filepath": filepath
    }