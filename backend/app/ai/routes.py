"""
AI-powered features for BugTrack Pro.
These endpoints require a Google Gemini API key set in the GEMINI_API_KEY environment variable.
If no key is configured, the endpoints return graceful fallback responses.
"""
import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from app.models import Issue

ai_bp = Blueprint("ai", __name__)


def _get_gemini_client():
    """Return a Gemini client if API key is configured, else None."""
    api_key = os.getenv("GEMINI_API_KEY") or current_app.config.get("GEMINI_API_KEY")
    if not api_key:
        api_key = os.getenv("GEMINI_API_KEY2") or current_app.config.get("GEMINI_API_KEY2")
    try:
        from google import genai
        return genai.Client(api_key=api_key)
    except Exception:
        return None



@ai_bp.route("/suggest-priority", methods=["POST"])
@jwt_required()
def suggest_priority():
    """Suggest a priority (low/medium/high) for a bug based on title + description."""
    data = request.get_json()
    title = data.get("title", "")
    description = data.get("description", "")

    if not title:
        return jsonify({"error": "Title is required"}), 400

    client = _get_gemini_client()
    if not client:
        return jsonify({
            "priority": "medium",
            "reason": "AI service not configured. Set GEMINI_API_KEY to enable smart priority detection. Defaulting to medium.",
            "ai_powered": False,
        }), 200

    try:
        prompt = (
            "You are a bug triage assistant. Given a bug title and description, "
            "suggest a priority level: low, medium, or high. "
            "Respond with ONLY a JSON object: {\"priority\": \"...\", \"reason\": \"...\"}\n\n"
            f"Title: {title}\nDescription: {description}"
        )
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        import json
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]
            
        result = json.loads(text.strip())
        result["ai_powered"] = True
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "priority": "medium",
            "reason": f"AI analysis failed: {str(e)}. Defaulting to medium.",
            "ai_powered": False,
        }), 200


@ai_bp.route("/check-duplicate", methods=["POST"])
@jwt_required()
def check_duplicate():
    """Check if a new issue might be a duplicate of existing issues."""
    data = request.get_json()
    title = data.get("title", "")
    description = data.get("description", "")
    project_id = data.get("project_id")

    if not title:
        return jsonify({"error": "Title is required"}), 400

    # Fetch existing issues for comparison
    query = Issue.query
    if project_id:
        query = query.filter(Issue.project_id == project_id)
    existing_issues = query.all()

    if not existing_issues:
        return jsonify({"duplicates": [], "ai_powered": False}), 200

    client = _get_gemini_client()
    if not client:
        # Fallback: simple keyword matching
        matches = []
        title_words = set(title.lower().split())
        for issue in existing_issues:
            issue_words = set(issue.title.lower().split())
            overlap = title_words & issue_words
            if len(overlap) >= 2:
                matches.append({
                    "id": issue.id,
                    "title": issue.title,
                    "status": issue.status,
                    "similarity": "keyword_match",
                })
        return jsonify({
            "duplicates": matches[:5],
            "ai_powered": False,
            "message": "Using keyword matching. Set GEMINI_API_KEY for AI-powered duplicate detection.",
        }), 200

    try:
        issues_text = "\n".join(
            [f"ID:{i.id} | {i.title} | {i.description or ''}" for i in existing_issues[:30]]
        )
        prompt = (
            "You are a duplicate bug detector. Given a new bug and a list of existing bugs, "
            "identify potential duplicates. Respond with ONLY a JSON object: "
            "{\"duplicates\": [{\"id\": ..., \"reason\": \"...\"}]}\n\n"
            f"New bug:\nTitle: {title}\nDescription: {description}\n\n"
            f"Existing bugs:\n{issues_text}"
        )
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        import json
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]
            
        result = json.loads(text.strip())
        result["ai_powered"] = True
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "duplicates": [],
            "ai_powered": False,
            "message": f"AI analysis failed: {str(e)}",
        }), 200


@ai_bp.route("/summarize", methods=["POST"])
@jwt_required()
def summarize():
    """Generate a smart summary of a long issue description."""
    data = request.get_json()
    description = data.get("description", "")

    if not description:
        return jsonify({"error": "Description is required"}), 400

    client = _get_gemini_client()
    if not client:
        # Fallback: truncate to first 200 chars
        summary = description[:200] + ("..." if len(description) > 200 else "")
        return jsonify({
            "summary": summary,
            "ai_powered": False,
            "message": "AI service not configured. Set GEMINI_API_KEY to enable smart summaries.",
        }), 200

    try:
        prompt = f"Summarize the following bug description in 1-2 concise sentences.\n\n{description}"
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        return jsonify({
            "summary": response.text.strip(),
            "ai_powered": True,
        }), 200
    except Exception as e:
        return jsonify({
            "summary": description[:200] + ("..." if len(description) > 200 else ""),
            "ai_powered": False,
            "message": f"AI analysis failed: {str(e)}",
        }), 200
