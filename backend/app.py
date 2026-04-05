"""
app.py — Flask API server for SHG APEX Ledger Analyzer with Auth and Database
Routes: /api/auth/*, /api/analyze, /api/generate-pdf, /api/chat, /api/history
"""
import os
import uuid
from pathlib import Path
from functools import wraps

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175"])

UPLOAD_FOLDER = Path(__file__).parent / "uploads"
UPLOAD_FOLDER.mkdir(exist_ok=True)

# Initialize database and services
try:
    from database import init_db_indexes, UserOperations, ChatOperations, AnalysisOperations
    from auth import authenticate_user, register_user, token_required, optional_token, get_current_user
    from cloudinary_config import get_cloudinary_service
    from analyzer import get_platform
    
    # Initialize database
    init_db_indexes()
    
    # Initialize services
    gemini_key = os.getenv("GEMINI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")
    platform = get_platform(gemini_key, groq_key)
    cloudinary_service = get_cloudinary_service()
    
    print("✓ Database and services initialized successfully")
    
except Exception as e:
    print(f"⚠ Initialization error: {e}")
    platform = None
    cloudinary_service = None


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "platform": "SHG APEX v3.1",
        "features": {
            "gemini": platform.gemini_model is not None if platform else False,
            "groq": platform.groq_client is not None if platform else False,
            "database": True,
            "cloudinary": cloudinary_service is not None,
            "authentication": True
        }
    })


# Authentication Routes
@app.route("/api/auth/register", methods=["POST"])
def register():
    """Register new user"""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    name = data.get("name", "").strip()
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    
    result = register_user(email, password, name)
    if result["success"]:
        return jsonify(result), 201
    else:
        return jsonify({"error": result["message"]}), 400


@app.route("/api/auth/login", methods=["POST"])
def login():
    """Login user"""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    
    result = authenticate_user(email, password)
    if result["success"]:
        return jsonify(result), 200
    else:
        return jsonify({"error": result["message"]}), 401


@app.route("/api/auth/profile", methods=["GET"])
@token_required
def get_profile():
    """Get user profile"""
    user = request.current_user
    return jsonify({
        "success": True,
        "user": {
            "id": user["user_id"],
            "email": user["email"],
            "name": user["name"]
        }
    })


@app.route("/api/auth/profile", methods=["PUT"])
@token_required
def update_profile():
    """Update user profile"""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    user = request.current_user
    name = data.get("name", "").strip()
    
    if not name:
        return jsonify({"error": "Name is required"}), 400
    
    from auth import update_user_profile
    result = update_user_profile(user["user_id"], name)
    
    if result["success"]:
        return jsonify(result), 200
    else:
        return jsonify({"error": result["message"]}), 400


@app.route("/api/auth/change-password", methods=["POST"])
@token_required
def change_password():
    """Change user password"""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    user = request.current_user
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")
    
    if not current_password or not new_password:
        return jsonify({"error": "Current password and new password are required"}), 400
    
    from auth import change_password
    result = change_password(user["user_id"], current_password, new_password)
    
    if result["success"]:
        return jsonify(result), 200
    else:
        return jsonify({"error": result["message"]}), 400


@app.route("/api/auth/delete-account", methods=["DELETE"])
@token_required
def delete_account():
    """Delete user account"""
    data = request.get_json()
    user = request.current_user
    password = data.get("password", "") if data else ""
    
    if not password:
        return jsonify({"error": "Password is required to delete account"}), 400
    
    from auth import delete_user_account
    result = delete_user_account(user["user_id"], password)
    
    if result["success"]:
        return jsonify(result), 200
    else:
        return jsonify({"error": result["message"]}), 400


@app.route("/api/auth/logout", methods=["POST"])
@token_required
def logout():
    """Logout user (client-side token removal)"""
    return jsonify({
        "success": True,
        "message": "Logout successful. Please remove token from client storage."
    }), 200


@app.route("/api/auth/request-reset", methods=["POST"])
def request_password_reset():
    """Request password reset"""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    email = data.get("email", "").strip().lower()
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
    
    from auth import request_password_reset
    result = request_password_reset(email)
    
    if result["success"]:
        return jsonify(result), 200
    else:
        return jsonify({"error": result["message"]}), 400


@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    """Reset password with token"""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    email = data.get("email", "").strip().lower()
    token = data.get("token", "")
    new_password = data.get("new_password", "")
    
    if not email or not token or not new_password:
        return jsonify({"error": "Email, token, and new password are required"}), 400
    
    from auth import reset_password
    result = reset_password(email, token, new_password)
    
    if result["success"]:
        return jsonify(result), 200
    else:
        return jsonify({"error": result["message"]}), 400


@app.route("/api/analyze", methods=["POST"])
@optional_token
def analyze():
    """Upload a ledger image and get full APEX analysis."""
    if not platform:
        return jsonify({"error": "Analysis service not available"}), 503

    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    allowed = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed:
        return jsonify({"error": f"Invalid file type: {ext}. Allowed: {', '.join(allowed)}"}), 400

    # Get user if authenticated
    user_id = None
    if hasattr(request, 'current_user') and request.current_user.get("success"):
        user_id = request.current_user["user_id"]

    try:
        # Read file bytes
        file_bytes = file.read()
        
        # Upload to Cloudinary
        if cloudinary_service and user_id:
            upload_result = cloudinary_service.upload_image_from_bytes(
                file_bytes, file.filename, f"shg_ledgers/user_{user_id}"
            )
            if upload_result["success"]:
                image_url = upload_result["url"]
            else:
                # Fallback to local storage
                filename = f"{uuid.uuid4().hex}{ext}"
                filepath = UPLOAD_FOLDER / filename
                with open(filepath, "wb") as f:
                    f.write(file_bytes)
                image_url = str(filepath)
        else:
            # Local storage for guest users
            filename = f"{uuid.uuid4().hex}{ext}"
            filepath = UPLOAD_FOLDER / filename
            with open(filepath, "wb") as f:
                f.write(file_bytes)
            image_url = str(filepath)

        # Perform analysis
        from analyzer import analyze_ledger
        results = analyze_ledger(str(filepath) if 'filepath' in locals() else file.filename)
        
        # Save to database if user is authenticated
        if user_id and image_url:
            from database import AnalysisResult, AnalysisOperations
            analysis = AnalysisResult(user_id, image_url, results)
            # Save AnalysisResult
            analysis_id = AnalysisOperations.save_analysis(analysis)
            results["analysis_id"] = analysis_id
            
            # Auto-create ChatHistory so the uploaded ledger populates the chat sidebar natively!
            from database import ChatHistory, ChatOperations
            
            # The frontend can pass a session_id if they are uploading an image within an existing chat thread
            session_id = request.form.get("session_id") or str(uuid.uuid4())
            results["session_id"] = session_id

            chat_msg = "Uploaded a ledger for analysis"
            chat_resp = f"Ledger analysis complete! Found {results.get('total_members', 0)} members and {results.get('total_transactions', 0)} transactions. You can ask me follow-up questions about this active ledger."
            chat_history = ChatHistory(user_id, chat_msg, chat_resp, context=results, session_id=session_id)
            ChatOperations.save_chat(chat_history)

        return jsonify({"success": True, "results": results, "session_id": session_id if 'session_id' in locals() else None})
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        # Cleanup local file if it exists
        if 'filepath' in locals():
            try:
                filepath.unlink()
            except Exception:
                pass


@app.route("/api/generate-pdf", methods=["POST"])
def generate_pdf_route():
    """Generate a PDF report from APEX analysis results."""
    data = request.get_json()
    if not data or "results" not in data:
        return jsonify({"error": "No results data provided"}), 400

    try:
        from pdf_generator import generate_pdf
        pdf_buffer = generate_pdf(data["results"])
        return send_file(
            pdf_buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name="SHG_APEX_Report.pdf",
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/chat", methods=["POST"])
@optional_token
def chat():
    """APEX Finance chatbot with knowledge base and history."""
    if not platform:
        return jsonify({"error": "Chat service not available"}), 503

    data = request.get_json()
    if not data or "message" not in data:
        return jsonify({"error": "No message provided"}), 400

    message = data["message"]
    language = data.get("language", "english")
    session_id = data.get("session_id", None)
    
    # Get user if authenticated
    user_id = None
    if hasattr(request, 'current_user') and request.current_user.get("success"):
        user_id = request.current_user["user_id"]

    try:
        from analyzer import chat_finance
        from database import ChatHistory, ChatOperations
        
        # Get context from backend history if part of a session
        context = None
        if user_id and session_id:
            # Fetch the context established by the ledger upload in this specific session
            history = ChatOperations.get_user_chat_history(user_id, limit=100)
            for c in reversed(history): # traverse from oldest to newest
                if getattr(c, 'session_id', None) == session_id and getattr(c, 'context', None):
                    context = c.context
                    break
        if "context" in data and data["context"]:
            context = data["context"]
        elif user_id and not session_id:
             from database import AnalysisOperations
             recent_analyses = AnalysisOperations.get_user_analyses(user_id, limit=1)
             if recent_analyses:
                 context = recent_analyses[0].results

        reply = chat_finance(message, context, language)
        
        # Save chat history if user is authenticated
        if user_id:
            if not session_id:
                session_id = str(uuid.uuid4())
            chat = ChatHistory(user_id, message, reply, language, context=context, session_id=session_id)
            ChatOperations.save_chat(chat)

        return jsonify({"success": True, "reply": reply, "session_id": session_id})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/history/chat", methods=["GET"])
@token_required
def get_chat_history():
    """Get user's chat sessions."""
    user = request.current_user
    limit = request.args.get("limit", 50, type=int)
    
    try:
        from database import ChatOperations
        chats = ChatOperations.get_user_chat_history(user["user_id"], limit * 10) # Grab many since we aggregate
        
        # Group into sessions identifying the first message representing the whole thread
        sessions = {}
        for chat in chats:
            sid = str(getattr(chat, 'session_id', ''))
            if not sid:
                continue
            if sid not in sessions:
                sessions[sid] = chat
        
        chat_list = []
        for sid, chat in list(sessions.items())[:limit]:
            chat_list.append({
                "id": str(chat._id) if hasattr(chat, '_id') else None,
                "session_id": sid,
                "message": chat.message,
                "response": chat.response,
                "language": chat.language,
                "context": chat.context,
                "timestamp": chat.timestamp.isoformat()
            })
        
        return jsonify({
            "success": True,
            "chats": chat_list
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/history/session/<session_id>", methods=["GET"])
@token_required
def get_chat_session(session_id):
    """Get all messages for a particular chat session chronologically."""
    user = request.current_user
    
    try:
        from database import ChatOperations
        chats = ChatOperations.get_user_chat_history(user["user_id"], limit=200) # Fetch all recent
        
        session_msgs = []
        for chat in reversed(chats): # Return chronological (oldest to newest)
            if str(getattr(chat, 'session_id', '')) == session_id:
                session_msgs.append({
                    "id": str(chat._id) if hasattr(chat, '_id') else None,
                    "session_id": session_id,
                    "message": chat.message,
                    "response": chat.response,
                    "language": chat.language,
                    "context": chat.context,
                    "timestamp": chat.timestamp.isoformat()
                })
        
        return jsonify({
            "success": True,
            "session_id": session_id,
            "messages": session_msgs
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/history/session/<session_id>", methods=["DELETE"])
@token_required
def delete_chat_session(session_id):
    """Delete a particular chat session."""
    user = request.current_user
    print(f"DEBUG: DELETE session {session_id} for user {user['user_id']}")
    try:
        from database import ChatOperations
        ChatOperations.delete_chat_session(user["user_id"], session_id)
        return jsonify({"success": True})
    except Exception as e:
        print(f"DEBUG: DELETE FAILED: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/history/analyses", methods=["GET"])
@token_required
def get_analysis_history():
    """Get user's analysis history."""
    user = request.current_user
    limit = request.args.get("limit", 20, type=int)
    
    try:
        from database import AnalysisOperations
        analyses = AnalysisOperations.get_user_analyses(user["user_id"], limit)
        
        analysis_list = []
        for analysis in analyses:
            analysis_list.append({
                "id": str(analysis._id) if hasattr(analysis, '_id') else None,
                "image_url": analysis.image_url,
                "created_at": analysis.created_at.isoformat(),
                "total_members": analysis.results.get("total_members", 0),
                "total_transactions": analysis.results.get("total_transactions", 0),
                "fraud_detected": analysis.results.get("fraud_analysis", "").lower() != "no fraud detected"
            })
        
        return jsonify({
            "success": True,
            "analyses": analysis_list
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/history/analysis/<analysis_id>", methods=["GET"])
@token_required
def get_analysis_detail(analysis_id):
    """Get detailed analysis result."""
    user = request.current_user
    
    try:
        from database import AnalysisOperations
        analysis = AnalysisOperations.get_analysis_by_id(analysis_id)
        
        if not analysis:
            return jsonify({"error": "Analysis not found"}), 404
        
        # Check if analysis belongs to current user
        if analysis.user_id != user["user_id"]:
            return jsonify({"error": "Access denied"}), 403
        
        return jsonify({
            "success": True,
            "analysis": {
                "id": str(analysis._id) if hasattr(analysis, '_id') else None,
                "image_url": analysis.image_url,
                "results": analysis.results,
                "ocr_text": analysis.ocr_text,
                "created_at": analysis.created_at.isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
