from flask import Flask
from routes.face_routes import face_bp

app = Flask(__name__)

app.register_blueprint(face_bp, url_prefix="/api")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)