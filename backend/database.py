"""
database.py — MongoDB connection and models for SHG APEX Platform
"""
import os
from datetime import datetime, timezone
from typing import Optional, Dict, List, Any
from pymongo import MongoClient
from pymongo.collection import Collection
from bson import ObjectId
import bcrypt
import jwt
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
client = None
db = None

def get_db():
    """Get database connection"""
    global client, db
    if client is None:
        mongodb_uri = os.getenv("MONGODB_URI")
        if not mongodb_uri:
            raise ValueError("MONGODB_URI not found in environment variables")
        client = MongoClient(mongodb_uri)
        db_name = mongodb_uri.split("/")[-1].split("?")[0]
        db = client[db_name]
    return db

def close_db():
    """Close database connection"""
    global client
    if client:
        client.close()
        client = None

# Collections
def get_users_collection() -> Collection:
    return get_db()["users"]

def get_chat_history_collection() -> Collection:
    return get_db()["chat_history"]

def get_analysis_results_collection() -> Collection:
    return get_db()["analysis_results"]

# Models
class User:
    """User model for authentication and profile management"""
    
    def __init__(self, email: str, password: str, name: str = None):
        self.email = email
        self.password_hash = self._hash_password(password)
        self.name = name or email.split("@")[0]
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)
        self.is_active = True
    
    def _hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for MongoDB storage"""
        return {
            "email": self.email,
            "password_hash": self.password_hash,
            "name": self.name,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "is_active": self.is_active
        }
    
    @staticmethod
    def from_dict(data: Dict) -> 'User':
        """Create User instance from dictionary"""
        user = User(data["email"], "")  # Password will be set separately
        user.password_hash = data["password_hash"]
        user.name = data.get("name", data["email"].split("@")[0])
        user.created_at = data["created_at"]
        user.updated_at = data["updated_at"]
        user.is_active = data.get("is_active", True)
        user._id = data["_id"]  # Store ObjectId
        return user

class ChatHistory:
    """Chat history model for storing user conversations"""
    
    def __init__(self, user_id: str, message: str, response: str, language: str = "english", context: Dict = None, session_id: str = None):
        self.user_id = user_id
        self.message = message
        self.response = response
        self.language = language
        self.context = context
        import uuid
        self.session_id = session_id if session_id else str(uuid.uuid4())
        self.timestamp = datetime.now(timezone.utc)
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for MongoDB storage"""
        return {
            "user_id": self.user_id,
            "message": self.message,
            "response": self.response,
            "language": self.language,
            "context": self.context,
            "session_id": self.session_id,
            "timestamp": self.timestamp
        }
    
    @staticmethod
    def from_dict(data: Dict) -> 'ChatHistory':
        """Create ChatHistory instance from dictionary"""
        chat = ChatHistory(
            data["user_id"],
            data["message"],
            data["response"],
            data.get("language", "english"),
            data.get("context", None),
            data.get("session_id", None)
        )
        chat.timestamp = data["timestamp"]
        chat._id = data["_id"]  # Store ObjectId
        return chat

class AnalysisResult:
    """Analysis result model for storing SHG ledger analysis"""
    
    def __init__(self, user_id: str, image_url: str, results: Dict, ocr_text: str = None):
        self.user_id = user_id
        self.image_url = image_url
        self.results = results
        self.ocr_text = ocr_text
        self.created_at = datetime.now(timezone.utc)
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for MongoDB storage"""
        return {
            "user_id": self.user_id,
            "image_url": self.image_url,
            "results": self.results,
            "ocr_text": self.ocr_text,
            "created_at": self.created_at
        }
    
    @staticmethod
    def from_dict(data: Dict) -> 'AnalysisResult':
        """Create AnalysisResult instance from dictionary"""
        analysis = AnalysisResult(
            data["user_id"],
            data["image_url"],
            data["results"],
            data.get("ocr_text")
        )
        analysis.created_at = data["created_at"]
        analysis._id = data["_id"]  # Store ObjectId
        return analysis

# Database operations
class UserOperations:
    """Database operations for users"""
    
    @staticmethod
    def create_user(user: User) -> str:
        """Create new user and return user ID"""
        collection = get_users_collection()
        result = collection.insert_one(user.to_dict())
        return str(result.inserted_id)
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[User]:
        """Get user by email"""
        collection = get_users_collection()
        user_data = collection.find_one({"email": email})
        if user_data:
            return User.from_dict(user_data)
        return None
    
    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[User]:
        """Get user by ID"""
        collection = get_users_collection()
        try:
            user_data = collection.find_one({"_id": ObjectId(user_id)})
            if user_data:
                return User.from_dict(user_data)
        except:
            pass
        return None
    
    @staticmethod
    def update_last_login(user_id: str):
        """Update user's last login timestamp"""
        collection = get_users_collection()
        collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"updated_at": datetime.now(timezone.utc)}}
        )

class ChatOperations:
    """Database operations for chat history"""
    
    @staticmethod
    def save_chat(chat: ChatHistory) -> str:
        """Save chat message and return chat ID"""
        collection = get_chat_history_collection()
        result = collection.insert_one(chat.to_dict())
        return str(result.inserted_id)
    
    @staticmethod
    def get_user_chat_history(user_id: str, limit: int = 50) -> List[ChatHistory]:
        """Get user's chat history"""
        collection = get_chat_history_collection()
        chats = collection.find(
            {"user_id": user_id}
        ).sort("timestamp", -1).limit(limit)
        return [ChatHistory.from_dict(chat) for chat in chats]
    
    @staticmethod
    def delete_user_chat_history(user_id: str):
        """Delete user's chat history"""
        collection = get_chat_history_collection()
        collection.delete_many({"user_id": user_id})
        
    @staticmethod
    def delete_chat_session(user_id: str, session_id: str):
        """Delete specific chat session for a user"""
        collection = get_chat_history_collection()
        collection.delete_many({"user_id": user_id, "session_id": session_id})

class AnalysisOperations:
    """Database operations for analysis results"""
    
    @staticmethod
    def save_analysis(analysis: AnalysisResult) -> str:
        """Save analysis result and return analysis ID"""
        collection = get_analysis_results_collection()
        result = collection.insert_one(analysis.to_dict())
        return str(result.inserted_id)
    
    @staticmethod
    def get_user_analyses(user_id: str, limit: int = 20) -> List[AnalysisResult]:
        """Get user's analysis results"""
        collection = get_analysis_results_collection()
        analyses = collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit)
        return [AnalysisResult.from_dict(analysis) for analysis in analyses]
    
    @staticmethod
    def get_analysis_by_id(analysis_id: str) -> Optional[AnalysisResult]:
        """Get analysis by ID"""
        collection = get_analysis_results_collection()
        try:
            analysis_data = collection.find_one({"_id": ObjectId(analysis_id)})
            if analysis_data:
                return AnalysisResult.from_dict(analysis_data)
        except:
            pass
        return None
    
    @staticmethod
    def delete_user_analyses(user_id: str):
        """Delete user's analysis results"""
        collection = get_analysis_results_collection()
        collection.delete_many({"user_id": user_id})

# JWT utilities
class JWTUtils:
    """JWT token utilities"""
    
    @staticmethod
    def generate_token(user_id: str, email: str) -> str:
        """Generate JWT token"""
        payload = {
            "user_id": user_id,
            "email": email,
            "exp": datetime.now(timezone.utc) + timedelta(days=7)
        }
        return jwt.encode(payload, os.getenv("JWT_SECRET"), algorithm="HS256")
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict]:
        """Verify JWT token and return payload"""
        try:
            payload = jwt.decode(token, os.getenv("JWT_SECRET"), algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

# Initialize database indexes
def init_db_indexes():
    """Initialize database indexes for better performance"""
    db = get_db()
    
    # Users collection indexes
    db.users.create_index("email", unique=True)
    db.users.create_index("created_at")
    
    # Chat history collection indexes
    db.chat_history.create_index([("user_id", 1), ("timestamp", -1)])
    db.chat_history.create_index("timestamp")
    
    # Analysis results collection indexes
    db.analysis_results.create_index([("user_id", 1), ("created_at", -1)])
    db.analysis_results.create_index("created_at")
    
    print("✓ Database indexes initialized")
