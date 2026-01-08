from pymongo import MongoClient
import bcrypt
from fastapi import Response, HTTPException
import secrets

client = MongoClient("mongodb://localhost:27017/")
db = client["CrackEM"]
users = db["users"]
sessions = db["sessions"]

def getUser(email: str, password: str, response: Response):
    user = users.find_one({"email": email})

    if not user:
        return {"status": "error", "message": "User not found"}

    if not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return {"status": "error", "message": "Invalid password"}

    session_id = secrets.token_urlsafe(32)

    sessions.insert_one({
        "session_id": session_id,
        "user_id": user["_id"]
    })

    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60*60*24
    )

    return {
        "status": "success",
        "user": {
            "name": user["name"],
            "email": user["email"]
        }
    }

# print(getUser("Test User", "test@123", "password123"))