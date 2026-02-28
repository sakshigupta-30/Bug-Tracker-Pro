from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app():
    app = Flask(__name__)
    app.config.from_object("app.config.Config")

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Import models so they are registered with SQLAlchemy
    from app import models  # noqa: F401

    # Register blueprints
    from app.auth.routes import auth_bp
    from app.projects.routes import projects_bp
    from app.issues.routes import issues_bp
    from app.comments.routes import comments_bp
    from app.ai.routes import ai_bp

    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(projects_bp, url_prefix="/api")
    app.register_blueprint(issues_bp, url_prefix="/api")
    app.register_blueprint(comments_bp, url_prefix="/api")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")

    # Create tables on first run
    with app.app_context():
        db.create_all()

    return app
