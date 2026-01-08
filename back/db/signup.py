from pymongo import MongoClient
from datetime import datetime
import bcrypt

client = MongoClient("mongodb://localhost:27017/")
db = client["CrackEM"]
users = db["users"]

def insertUser(name: str, email: str, password):
    user = users.find_one({"email": email})
    if user:
        return {
            "status": "error",
            "message": "User with this email already exists."
        }
    else:
        hashedPassword = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        users.insert_one({
            "name": name,
            "email": email,
            "password": hashedPassword,
            "joinDate": datetime.utcnow().isoformat()
        })
        
        return {
            "status": "success",
            "message": "User registered successfully."
        }
        
# print(insertUser("Test User", "test@123", "password123"))