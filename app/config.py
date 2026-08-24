import os


class Config:
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "clawmachine")
    MONGO_USER = os.environ.get("MONGO_USER", "")
    MONGO_PASSWORD = os.environ.get("MONGO_PASSWORD", "")
    DUSER = os.environ.get("DUSER", "")
    DPASSWORD = os.environ.get("DPASSWORD", "")
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")
    LOG_PROJECT_MONGO_ID = os.environ.get("LOG_PROJECT_MONGO_ID", "")
