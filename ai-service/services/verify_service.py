import os
import json
from deepface import DeepFace


def load_embeddings():

    embedding_file = os.path.join("encodings", "embeddings.json")

    if not os.path.exists(embedding_file):
        return []

    with open(embedding_file, "r") as file:
        try:
            return json.load(file)
        except json.JSONDecodeError:
            return []


def find_matching_student(image_path):

    students = load_embeddings()

    if len(students) == 0:
        return None

    best_student = None
    best_distance = float("inf")

    for student in students:

        try:

            result = DeepFace.verify(
                img1_path=image_path,
                img2_path=student["image_path"],
                model_name="ArcFace",
                enforce_detection=True
            )

            print("--------------------------------")
            print("Student ID :", student["student_id"])
            print("Verified  :", result["verified"])
            print("Distance  :", result["distance"])
            print("Threshold :", result["threshold"])

            if result["verified"]:

                if result["distance"] < best_distance:
                    best_distance = result["distance"]
                    best_student = student

        except Exception as e:
            print(e)

    if best_student is None:
        return None

    return {
        "student_id": best_student["student_id"],
        "distance": best_distance
    }