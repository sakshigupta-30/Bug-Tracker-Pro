from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Project, User

projects_bp = Blueprint("projects", __name__)


@projects_bp.route("/projects", methods=["POST"])
@jwt_required()
def create_project():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or not data.get("name"):
        return jsonify({"error": "Project name is required"}), 400

    project = Project(
        name=data["name"],
        description=data.get("description", ""),
        created_by=user_id,
    )
    db.session.add(project)
    db.session.commit()

    return jsonify(project.to_dict()), 201


@projects_bp.route("/projects", methods=["GET"])
@jwt_required()
def list_projects():
    projects = Project.query.order_by(Project.created_at.desc()).all()
    return jsonify([p.to_dict() for p in projects]), 200


@projects_bp.route("/projects/<int:project_id>", methods=["GET"])
@jwt_required()
def get_project(project_id):
    project = Project.query.get_or_404(project_id)
    result = project.to_dict()
    # Include issue breakdown
    issues = project.issues
    result["issues_by_status"] = {
        "open": len([i for i in issues if i.status == "open"]),
        "in_progress": len([i for i in issues if i.status == "in_progress"]),
        "resolved": len([i for i in issues if i.status == "resolved"]),
    }
    result["issues_by_priority"] = {
        "low": len([i for i in issues if i.priority == "low"]),
        "medium": len([i for i in issues if i.priority == "medium"]),
        "high": len([i for i in issues if i.priority == "high"]),
    }
    return jsonify(result), 200


@projects_bp.route("/projects/<int:project_id>", methods=["DELETE"])
@jwt_required()
def delete_project(project_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    project = Project.query.get_or_404(project_id)

    # Only admin or creator can delete
    if user.role != "admin" and project.created_by != user_id:
        return jsonify({"error": "Only admin or project creator can delete this project"}), 403

    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Project deleted successfully"}), 200
