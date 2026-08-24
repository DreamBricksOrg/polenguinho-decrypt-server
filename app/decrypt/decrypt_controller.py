from flask import Blueprint, jsonify, redirect, render_template, request, session, url_for

SESSION_KEY = "decrypt_authenticated"


def create_decrypt_blueprint(config, log_repository):
    decrypt_bp = Blueprint("decrypt", __name__)

    @decrypt_bp.route("/decrypt", methods=["GET", "POST"])
    def decrypt_page():
        error = None

        if request.method == "POST":
            username = request.form.get("username", "")
            password = request.form.get("password", "")
            if username == config["DUSER"] and password == config["DPASSWORD"]:
                session[SESSION_KEY] = True
            else:
                error = "Usuário ou senha inválidos."

        authenticated = session.get(SESSION_KEY, False)
        return render_template("decrypt.html", authenticated=authenticated, error=error)

    @decrypt_bp.get("/decrypt/data")
    def decrypt_data():
        if not session.get(SESSION_KEY, False):
            return jsonify({"error": "not authenticated"}), 401
        return jsonify(log_repository.list_pickups()), 200

    @decrypt_bp.get("/decrypt/logout")
    def decrypt_logout():
        session.pop(SESSION_KEY, None)
        return redirect(url_for("decrypt.decrypt_page"))

    return decrypt_bp
