from dotenv import load_dotenv

load_dotenv()

from flask import Flask

from app.config import Config
from app.db.mongo import get_database, get_mongo_client
from app.decrypt.decrypt_controller import create_decrypt_blueprint
from app.decrypt.log_repository import LogRepository
from app.docs.docs_controller import docs_bp, swagger_ui_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    mongo_client = get_mongo_client(
        app.config["MONGO_URI"],
        username=app.config["MONGO_USER"],
        password=app.config["MONGO_PASSWORD"],
    )
    database = get_database(mongo_client, app.config["MONGO_DB_NAME"])
    log_repository = LogRepository(database, project_id=app.config["LOG_PROJECT_MONGO_ID"])

    decrypt_bp = create_decrypt_blueprint(app.config, log_repository)
    app.register_blueprint(docs_bp)
    app.register_blueprint(swagger_ui_bp)
    app.register_blueprint(decrypt_bp)

    return app
