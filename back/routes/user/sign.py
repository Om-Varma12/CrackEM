from fastapi import APIRouter, Response

from back.db.signin import getUser
from back.db.signup import insertUser
from back.schema.user import SignupRequest, SigninRequest

router = APIRouter(
    prefix="/user",
    tags=["user"]
)

@router.post("/signup")
async def signup_user(data: SignupRequest):
    result = insertUser(data.username, data.email, data.password)

    if result.get("status") == "success":
        return {"status": "success", "message": result.get("message", "Sign-up successful")}
    else:
        return {"status": "error", "message": result.get("message", "User with this email already exists")}


@router.post("/signin")
async def signin_user(data: SigninRequest, response: Response):
    result = getUser(data.email, data.password, response)

    if result.get("status") == "success":
        return {
            "status": "success",
            "message": "Sign-in successful",
            "user": result.get("user")
        }
    else:
        return {
            "status": "error",
            "message": result.get("message", "Invalid credentials")
        }