"""
cloudinary_config.py — Cloudinary configuration for image storage
"""
import os
import cloudinary
import cloudinary.uploader
from cloudinary.uploader import upload
from cloudinary.api import delete_resources
from dotenv import load_dotenv
from typing import Optional, Dict, Any

load_dotenv()

class CloudinaryService:
    """Cloudinary service for image upload and management"""
    
    def __init__(self):
        """Initialize Cloudinary with environment variables"""
        self.cloud_name = os.getenv("CLOUD_NAME")
        self.api_key = os.getenv("API_KEY")
        self.api_secret = os.getenv("API_SECRET")
        
        if not all([self.cloud_name, self.api_key, self.api_secret]):
            raise ValueError("Missing Cloudinary configuration in environment variables")
        
        # Configure Cloudinary
        cloudinary.config(
            cloud_name=self.cloud_name,
            api_key=self.api_key,
            api_secret=self.api_secret
        )
    
    def upload_image(self, file_path: str, folder: str = "shg_ledgers") -> Dict[str, Any]:
        """
        Upload image to Cloudinary
        
        Args:
            file_path: Path to the image file
            folder: Cloudinary folder name
            
        Returns:
            Dictionary containing upload result with URL and metadata
        """
        try:
            # Upload with transformations for optimization
            result = upload(
                file_path,
                folder=folder,
                resource_type="image",
                format="webp",  # Convert to WebP for better compression
                quality="auto:good",
                fetch_format="auto",
                transformation=[
                    {"width": 1600, "height": 1600, "crop": "limit", "gravity": "auto"},
                    {"quality": "auto"}
                ]
            )
            
            return {
                "success": True,
                "url": result.get("secure_url"),
                "public_id": result.get("public_id"),
                "format": result.get("format"),
                "size": result.get("bytes"),
                "width": result.get("width"),
                "height": result.get("height"),
                "created_at": result.get("created_at")
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def upload_image_from_bytes(self, file_bytes: bytes, filename: str, folder: str = "shg_ledgers") -> Dict[str, Any]:
        """
        Upload image from bytes to Cloudinary
        
        Args:
            file_bytes: Image file as bytes
            filename: Original filename
            folder: Cloudinary folder name
            
        Returns:
            Dictionary containing upload result with URL and metadata
        """
        try:
            import tempfile
            import os
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as temp_file:
                temp_file.write(file_bytes)
                temp_file_path = temp_file.name
            
            try:
                result = self.upload_image(temp_file_path, folder)
                return result
            finally:
                # Clean up temporary file
                os.unlink(temp_file_path)
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def delete_image(self, public_id: str) -> Dict[str, Any]:
        """
        Delete image from Cloudinary
        
        Args:
            public_id: Cloudinary public ID of the image
            
        Returns:
            Dictionary containing deletion result
        """
        try:
            result = delete_resources([public_id], resource_type="image")
            return {
                "success": True,
                "deleted": result.get("deleted", {}),
                "message": "Image deleted successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_image_info(self, public_id: str) -> Optional[Dict[str, Any]]:
        """
        Get image information from Cloudinary
        
        Args:
            public_id: Cloudinary public ID of the image
            
        Returns:
            Dictionary containing image metadata or None if not found
        """
        try:
            import cloudinary.api
            result = cloudinary.api.resource(public_id, resource_type="image")
            return {
                "public_id": result.get("public_id"),
                "format": result.get("format"),
                "size": result.get("bytes"),
                "width": result.get("width"),
                "height": result.get("height"),
                "created_at": result.get("created_at"),
                "url": result.get("secure_url")
            }
        except Exception as e:
            print(f"Error getting image info: {e}")
            return None
    
    def generate_transformation_url(self, public_id: str, transformations: Dict[str, Any] = None) -> str:
        """
        Generate transformed image URL
        
        Args:
            public_id: Cloudinary public ID
            transformations: Dictionary of transformations
            
        Returns:
            Transformed image URL
        """
        try:
            import cloudinary.utils
            
            # Default transformations for SHG ledgers
            default_transformations = [
                {"quality": "auto:good"},
                {"fetch_format": "auto"}
            ]
            
            if transformations:
                default_transformations.extend(transformations)
            
            url, _ = cloudinary.utils.cloudinary_url(
                public_id,
                transformation=default_transformations
            )
            
            return url
            
        except Exception as e:
            print(f"Error generating transformation URL: {e}")
            # Return original URL as fallback
            return f"https://res.cloudinary.com/{self.cloud_name}/image/upload/{public_id}"

# Global Cloudinary service instance
cloudinary_service = None

def get_cloudinary_service() -> CloudinaryService:
    """Get or create Cloudinary service instance"""
    global cloudinary_service
    if cloudinary_service is None:
        cloudinary_service = CloudinaryService()
    return cloudinary_service

# Utility functions
def upload_ledger_image(file_path: str, user_id: str = None) -> Dict[str, Any]:
    """
    Upload SHG ledger image with user-specific folder
    
    Args:
        file_path: Path to the image file
        user_id: User ID for folder organization (optional)
        
    Returns:
        Upload result dictionary
    """
    folder = "shg_ledgers"
    if user_id:
        folder = f"shg_ledgers/user_{user_id}"
    
    service = get_cloudinary_service()
    return service.upload_image(file_path, folder)

def upload_ledger_image_from_bytes(file_bytes: bytes, filename: str, user_id: str = None) -> Dict[str, Any]:
    """
    Upload SHG ledger image from bytes with user-specific folder
    
    Args:
        file_bytes: Image file as bytes
        filename: Original filename
        user_id: User ID for folder organization (optional)
        
    Returns:
        Upload result dictionary
    """
    folder = "shg_ledgers"
    if user_id:
        folder = f"shg_ledgers/user_{user_id}"
    
    service = get_cloudinary_service()
    return service.upload_image_from_bytes(file_bytes, filename, folder)
