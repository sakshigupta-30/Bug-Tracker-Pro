from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Issue, User

issues_bp = Blueprint("issues", __name__)


@issues_bp.route("/issues", methods=["POST"])
@jwt_required()
def create_issue():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or not data.get("title") or not data.get("project_id"):
        return jsonify({"error": "Title and project_id are required"}), 400

    priority = data.get("priority", "medium")
    if priority not in ("low", "medium", "high"):
        return jsonify({"error": "Priority must be low, medium, or high"}), 400

    issue = Issue(
        title=data["title"],
        description=data.get("description", ""),
        status="open",
        priority=priority,
        project_id=data["project_id"],
        assigned_to=data.get("assigned_to"),
        created_by=user_id,
    )
    db.session.add(issue)
    db.session.commit()

    return jsonify(issue.to_dict()), 201


@issues_bp.route("/issues", methods=["GET"])
@jwt_required()
def list_issues():
    query = Issue.query

    # Filters
    status = request.args.get("status")
    if status:
        query = query.filter(Issue.status == status)

    priority = request.args.get("priority")
    if priority:
        query = query.filter(Issue.priority == priority)

    project_id = request.args.get("project_id")
    if project_id:
        query = query.filter(Issue.project_id == int(project_id))

    assigned_to = request.args.get("assigned_to")
    if assigned_to:
        query = query.filter(Issue.assigned_to == int(assigned_to))

    search = request.args.get("search")
    if search:
        query = query.filter(
            db.or_(
                Issue.title.ilike(f"%{search}%"),
                Issue.description.ilike(f"%{search}%"),
            )
        )

    issues = query.order_by(Issue.updated_at.desc()).all()
    return jsonify([i.to_dict() for i in issues]), 200


@issues_bp.route("/issues/<int:issue_id>", methods=["GET"])
@jwt_required()
def get_issue(issue_id):
    issue = Issue.query.get_or_404(issue_id)
    return jsonify(issue.to_dict()), 200


@issues_bp.route("/issues/<int:issue_id>", methods=["PUT"])
@jwt_required()
def update_issue(issue_id):
    issue = Issue.query.get_or_404(issue_id)
    data = request.get_json()

    if data.get("title"):
        issue.title = data["title"]
    if data.get("description") is not None:
        issue.description = data["description"]
    if data.get("status"):
        if data["status"] not in ("open", "in_progress", "resolved"):
            return jsonify({"error": "Invalid status"}), 400
        issue.status = data["status"]
    if data.get("priority"):
        if data["priority"] not in ("low", "medium", "high"):
            return jsonify({"error": "Invalid priority"}), 400
        issue.priority = data["priority"]
    if data.get("assigned_to") is not None:
        issue.assigned_to = data["assigned_to"] if data["assigned_to"] else None

    db.session.commit()
    return jsonify(issue.to_dict()), 200


@issues_bp.route("/issues/<int:issue_id>", methods=["DELETE"])
@jwt_required()
def delete_issue(issue_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    issue = Issue.query.get_or_404(issue_id)

    if user.role != "admin" and issue.created_by != user_id:
        return jsonify({"error": "Only admin or issue creator can delete this issue"}), 403

    db.session.delete(issue)
    db.session.commit()
    return jsonify({"message": "Issue deleted successfully"}), 200


@issues_bp.route("/issues/<int:issue_id>/status", methods=["PATCH"])
@jwt_required()
def update_issue_status(issue_id):
    issue = Issue.query.get_or_404(issue_id)
    data = request.get_json()

    if not data or not data.get("status"):
        return jsonify({"error": "Status is required"}), 400

    if data["status"] not in ("open", "in_progress", "resolved"):
        return jsonify({"error": "Status must be open, in_progress, or resolved"}), 400

    issue.status = data["status"]
    db.session.commit()

    return jsonify(issue.to_dict()), 200


@issues_bp.route("/dashboard/stats", methods=["GET"])
@jwt_required()
def dashboard_stats():
    total = Issue.query.count()
    by_status = {
        "open": Issue.query.filter_by(status="open").count(),
        "in_progress": Issue.query.filter_by(status="in_progress").count(),
        "resolved": Issue.query.filter_by(status="resolved").count(),
    }
    by_priority = {
        "low": Issue.query.filter_by(priority="low").count(),
        "medium": Issue.query.filter_by(priority="medium").count(),
        "high": Issue.query.filter_by(priority="high").count(),
    }
    recent_issues = Issue.query.order_by(Issue.created_at.desc()).limit(5).all()

    return jsonify({
        "total_issues": total,
        "by_status": by_status,
        "by_priority": by_priority,
        "recent_issues": [i.to_dict() for i in recent_issues],
    }), 200
