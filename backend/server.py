from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
import secrets
import jwt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutSessionRequest, CheckoutStatusResponse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'stresser-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION = 24 * 7  # 7 days

# Stripe Config
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserRegister(BaseModel):
    username: str
    password: str
    telegram_id: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    telegram_id: str
    role: str
    plan: str
    plan_expires: Optional[str] = None
    api_key: Optional[str] = None
    created_at: str

class AttackRequest(BaseModel):
    target: str
    port: int = 80
    method: str
    duration: int
    concurrents: int

class AttackResponse(BaseModel):
    id: str
    user_id: str
    target: str
    port: int
    method: str
    duration: int
    concurrents: int
    status: str
    started_at: str
    ended_at: Optional[str] = None

class PlanResponse(BaseModel):
    id: str
    name: str
    price: float
    max_time: int
    max_concurrent: int
    methods: List[str]
    features: List[str]

class CheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str

# ==================== PLANS DATA ====================

PLANS = {
    "free": {
        "id": "free",
        "name": "Free",
        "price": 0.0,
        "max_time": 60,
        "max_concurrent": 1,
        "methods": ["HTTP-GET", "HTTP-POST"],
        "features": ["60s max attack", "1 concurrent", "Basic methods"]
    },
    "basic": {
        "id": "basic",
        "name": "Basic",
        "price": 19.99,
        "max_time": 300,
        "max_concurrent": 3,
        "methods": ["HTTP-GET", "HTTP-POST", "HTTP-HEAD", "SLOWLORIS"],
        "features": ["5min max attack", "3 concurrent", "4 methods", "Attack logs"]
    },
    "premium": {
        "id": "premium",
        "name": "Premium",
        "price": 49.99,
        "max_time": 600,
        "max_concurrent": 5,
        "methods": ["HTTP-GET", "HTTP-POST", "HTTP-HEAD", "SLOWLORIS", "TLS-VIP", "CF-BYPASS"],
        "features": ["10min max attack", "5 concurrent", "6 methods", "API Access", "Priority support"]
    },
    "enterprise": {
        "id": "enterprise",
        "name": "Enterprise",
        "price": 99.99,
        "max_time": 1200,
        "max_concurrent": 10,
        "methods": ["HTTP-GET", "HTTP-POST", "HTTP-HEAD", "SLOWLORIS", "TLS-VIP", "CF-BYPASS", "BROWSER-SIM", "RUDY"],
        "features": ["20min max attack", "10 concurrent", "All methods", "API Access", "24/7 Support", "Custom methods"]
    }
}

ATTACK_METHODS = [
    {"id": "HTTP-GET", "name": "HTTP GET Flood", "description": "Basic GET request flood"},
    {"id": "HTTP-POST", "name": "HTTP POST Flood", "description": "POST request flood with payload"},
    {"id": "HTTP-HEAD", "name": "HTTP HEAD", "description": "HEAD request flood"},
    {"id": "SLOWLORIS", "name": "Slowloris", "description": "Slow HTTP attack"},
    {"id": "TLS-VIP", "name": "TLS-VIP", "description": "TLS/SSL attack with certificate validation"},
    {"id": "CF-BYPASS", "name": "CF Bypass", "description": "Cloudflare bypass method"},
    {"id": "BROWSER-SIM", "name": "Browser Simulation", "description": "Full browser simulation attack"},
    {"id": "RUDY", "name": "R-U-Dead-Yet", "description": "Slow POST attack"}
]

# ==================== HELPERS ====================

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_api_key() -> str:
    return f"strs_{secrets.token_hex(32)}"

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_admin_user(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"username": data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "username": data.username,
        "password_hash": hash_password(data.password),
        "telegram_id": data.telegram_id,
        "role": "user",
        "plan": "free",
        "plan_expires": None,
        "api_key": generate_api_key(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    token = create_token(user_id, "user")
    return {
        "token": token,
        "user": {
            "id": user_id,
            "username": data.username,
            "telegram_id": data.telegram_id,
            "role": "user",
            "plan": "free",
            "api_key": user["api_key"]
        }
    }

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"username": data.username}, {"_id": 0})
    if not user or user["password_hash"] != hash_password(data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["role"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "telegram_id": user["telegram_id"],
            "role": user["role"],
            "plan": user["plan"],
            "plan_expires": user.get("plan_expires"),
            "api_key": user.get("api_key")
        }
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "username": user["username"],
        "telegram_id": user["telegram_id"],
        "role": user["role"],
        "plan": user["plan"],
        "plan_expires": user.get("plan_expires"),
        "api_key": user.get("api_key")
    }

@api_router.post("/auth/regenerate-key")
async def regenerate_api_key(user: dict = Depends(get_current_user)):
    new_key = generate_api_key()
    await db.users.update_one({"id": user["id"]}, {"$set": {"api_key": new_key}})
    return {"api_key": new_key}

# ==================== PLANS ROUTES ====================

@api_router.get("/plans")
async def get_plans():
    return list(PLANS.values())

@api_router.get("/methods")
async def get_methods():
    return ATTACK_METHODS

# ==================== ATTACK ROUTES ====================

@api_router.post("/attacks")
async def create_attack(data: AttackRequest, user: dict = Depends(get_current_user)):
    user_plan = PLANS.get(user["plan"], PLANS["free"])
    
    # Validate plan limits
    if data.duration > user_plan["max_time"]:
        raise HTTPException(status_code=400, detail=f"Max duration for your plan is {user_plan['max_time']}s")
    if data.concurrents > user_plan["max_concurrent"]:
        raise HTTPException(status_code=400, detail=f"Max concurrent for your plan is {user_plan['max_concurrent']}")
    if data.method not in user_plan["methods"]:
        raise HTTPException(status_code=400, detail=f"Method {data.method} not available in your plan")
    
    # Check concurrent attacks
    active_attacks = await db.attacks.count_documents({"user_id": user["id"], "status": "running"})
    if active_attacks >= user_plan["max_concurrent"]:
        raise HTTPException(status_code=400, detail="Maximum concurrent attacks reached")
    
    attack_id = str(uuid.uuid4())
    attack = {
        "id": attack_id,
        "user_id": user["id"],
        "target": data.target,
        "port": data.port,
        "method": data.method,
        "duration": data.duration,
        "concurrents": data.concurrents,
        "status": "running",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "ended_at": None
    }
    await db.attacks.insert_one(attack)
    
    return {"id": attack_id, "status": "running", "message": "Attack started"}

@api_router.post("/attacks/{attack_id}/stop")
async def stop_attack(attack_id: str, user: dict = Depends(get_current_user)):
    attack = await db.attacks.find_one({"id": attack_id, "user_id": user["id"]}, {"_id": 0})
    if not attack:
        raise HTTPException(status_code=404, detail="Attack not found")
    if attack["status"] != "running":
        raise HTTPException(status_code=400, detail="Attack is not running")
    
    await db.attacks.update_one(
        {"id": attack_id},
        {"$set": {"status": "stopped", "ended_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Attack stopped"}

@api_router.get("/attacks")
async def get_attacks(user: dict = Depends(get_current_user), limit: int = 50):
    attacks = await db.attacks.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("started_at", -1).limit(limit).to_list(limit)
    return attacks

@api_router.get("/attacks/running")
async def get_running_attacks(user: dict = Depends(get_current_user)):
    attacks = await db.attacks.find(
        {"user_id": user["id"], "status": "running"}, {"_id": 0}
    ).to_list(100)
    return attacks

# ==================== PAYMENT ROUTES ====================

@api_router.post("/checkout")
async def create_checkout(data: CheckoutRequest, request: Request, user: dict = Depends(get_current_user)):
    plan = PLANS.get(data.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")
    if plan["price"] == 0:
        raise HTTPException(status_code=400, detail="Cannot checkout free plan")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{data.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{data.origin_url}/plans"
    
    checkout_request = CheckoutSessionRequest(
        amount=plan["price"],
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["id"],
            "plan_id": data.plan_id,
            "plan_name": plan["name"]
        },
        payment_methods=["card", "crypto"]
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = {
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": user["id"],
        "plan_id": data.plan_id,
        "amount": plan["price"],
        "currency": "usd",
        "status": "pending",
        "payment_status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request, user: dict = Depends(get_current_user)):
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction status
        transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if transaction and transaction.get("payment_status") != "paid":
            if status.payment_status == "paid":
                # Update user plan
                plan_expires = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
                await db.users.update_one(
                    {"id": transaction["user_id"]},
                    {"$set": {"plan": transaction["plan_id"], "plan_expires": plan_expires}}
                )
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"status": "completed", "payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
            elif status.status == "expired":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"status": "expired", "payment_status": "expired", "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
    except Exception as e:
        logger.error(f"Error getting checkout status: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            if transaction and transaction.get("payment_status") != "paid":
                plan_expires = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
                await db.users.update_one(
                    {"id": transaction["user_id"]},
                    {"$set": {"plan": transaction["plan_id"], "plan_expires": plan_expires}}
                )
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"status": "completed", "payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/users")
async def admin_get_users(admin: dict = Depends(get_admin_user), limit: int = 100):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).limit(limit).to_list(limit)
    return users

@api_router.get("/admin/stats")
async def admin_get_stats(admin: dict = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    total_attacks = await db.attacks.count_documents({})
    running_attacks = await db.attacks.count_documents({"status": "running"})
    total_revenue = 0
    
    paid_transactions = await db.payment_transactions.find({"payment_status": "paid"}, {"_id": 0}).to_list(1000)
    for t in paid_transactions:
        total_revenue += t.get("amount", 0)
    
    plan_distribution = {}
    for plan_id in PLANS.keys():
        count = await db.users.count_documents({"plan": plan_id})
        plan_distribution[plan_id] = count
    
    return {
        "total_users": total_users,
        "total_attacks": total_attacks,
        "running_attacks": running_attacks,
        "total_revenue": total_revenue,
        "plan_distribution": plan_distribution
    }

@api_router.get("/admin/attacks")
async def admin_get_attacks(admin: dict = Depends(get_admin_user), limit: int = 100):
    attacks = await db.attacks.find({}, {"_id": 0}).sort("started_at", -1).limit(limit).to_list(limit)
    return attacks

@api_router.post("/admin/users/{user_id}/plan")
async def admin_update_user_plan(user_id: str, plan_id: str, admin: dict = Depends(get_admin_user)):
    if plan_id not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    plan_expires = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat() if plan_id != "free" else None
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"plan": plan_id, "plan_expires": plan_expires}}
    )
    return {"message": "Plan updated"}

@api_router.post("/admin/users/{user_id}/role")
async def admin_update_user_role(user_id: str, role: str, admin: dict = Depends(get_admin_user)):
    if role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    return {"message": "Role updated"}

# ==================== API KEY AUTH ====================

@api_router.post("/v1/attack")
async def api_attack(data: AttackRequest, x_api_key: str = Header(None)):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API key required")
    
    user = await db.users.find_one({"api_key": x_api_key}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    if user["plan"] not in ["premium", "enterprise"]:
        raise HTTPException(status_code=403, detail="API access requires Premium or Enterprise plan")
    
    # Use same logic as normal attack
    user_plan = PLANS.get(user["plan"], PLANS["free"])
    
    if data.duration > user_plan["max_time"]:
        raise HTTPException(status_code=400, detail=f"Max duration: {user_plan['max_time']}s")
    if data.concurrents > user_plan["max_concurrent"]:
        raise HTTPException(status_code=400, detail=f"Max concurrent: {user_plan['max_concurrent']}")
    if data.method not in user_plan["methods"]:
        raise HTTPException(status_code=400, detail=f"Method not available")
    
    attack_id = str(uuid.uuid4())
    attack = {
        "id": attack_id,
        "user_id": user["id"],
        "target": data.target,
        "port": data.port,
        "method": data.method,
        "duration": data.duration,
        "concurrents": data.concurrents,
        "status": "running",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "ended_at": None,
        "via_api": True
    }
    await db.attacks.insert_one(attack)
    
    return {"id": attack_id, "status": "running"}

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Layer 7 Stresser API", "version": "1.0.0"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
