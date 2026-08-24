from flask import Blueprint, jsonify
from flask_swagger_ui import get_swaggerui_blueprint

from app.docs.openapi_spec import OPENAPI_SPEC

docs_bp = Blueprint("docs", __name__)


@docs_bp.get("/openapi.json")
def openapi_json():
    return jsonify(OPENAPI_SPEC)


swagger_ui_bp = get_swaggerui_blueprint(
    "/docs",
    "/openapi.json",
    config={"app_name": "Polenguinho Decrypt Server API"},
)
