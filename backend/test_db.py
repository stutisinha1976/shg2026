import os
from dotenv import load_dotenv
from database import get_db, init_db_indexes

load_dotenv()
try:
    print("MONGODB_URI:", os.getenv('MONGODB_URI'))
    db = get_db()
    print("DB Name:", db.name)
    print("Testing connection by fetching collections...")
    collections = db.list_collection_names()
    print("Collections:", collections)
    
    print("Calling init_db_indexes...")
    init_db_indexes()
    
    print("DB initialization completed successfully.")
except Exception as e:
    import traceback
    traceback.print_exc()
