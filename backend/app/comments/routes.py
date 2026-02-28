from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Comment, Issue

comments_bp = Blueprint("comments", __name__)


@comments_bp.route("/issues/<int:issue_id>/comments", methods=["POST"])
@jwt_required()
def create_comment(issue_id):
    user_id = int(get_jwt_identity())
    Issue.query.get_or_404(issue_id)  # Ensure issue exists

    data = request.get_json()
    if not data or not data.get("comment_text"):
        return jsonify({"error": "Comment text is required"}), 400

    comment = Comment(
        issue_id=issue_id,
        user_id=user_id,
        comment_text=data["comment_text"],
    )
    db.session.add(comment)
    db.session.commit()

    return jsonify(comment.to_dict()), 201


@comments_bp.route("/issues/<int:issue_id>/comments", methods=["GET"])
@jwt_required()
def list_comments(issue_id):
    Issue.query.get_or_404(issue_id)
    comments = Comment.query.filter_by(issue_id=issue_id).order_by(Comment.created_at.asc()).all()
    return jsonify([c.to_dict() for c in comments]), 200
