from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
from app import db
from app.models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    if not data or not data.get("email") or not data.get("password") or not data.get("name"):
        return jsonify({"error": "Name, email, and password are required"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 409

    role = data.get("role", "developer")
    if role not in ("admin", "developer", "tester"):
        return jsonify({"error": "Role must be admin, developer, or tester"}), 400

    password_hash = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    user = User(
        name=data["name"],
        email=data["email"],
        password_hash=password_hash,
        role=role,
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User registered successfully", "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=data["email"]).first()

    if not user or not bcrypt.checkpw(data["password"].encode("utf-8"), user.password_hash.encode("utf-8")):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "access_token": access_token,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict()), 200


@auth_bp.route("/users", methods=["GET"])
@jwt_required()
def list_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users]), 200
