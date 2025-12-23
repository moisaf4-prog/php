"""
FastAPI Proxy Server for PHP Backend
Routes all /api/* requests to PHP backend running on port 8002
"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import Response
from starlette.middleware.cors import CORSMiddleware
import httpx
import subprocess
import os
import signal
import sys
import atexit
import time

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PHP_SERVER_PORT = 8002
PHP_BACKEND_URL = f"http://localhost:{PHP_SERVER_PORT}"
php_process = None

def start_php_server():
    """Start PHP built-in server for the backend"""
    global php_process
    
    # Kill any existing PHP server on the port
    os.system(f"pkill -f 'php -S 0.0.0.0:{PHP_SERVER_PORT}'")
    time.sleep(0.5)
    
    # Start MariaDB if not running
    os.system("service mariadb start 2>/dev/null || true")
    
    # Start PHP server
    php_process = subprocess.Popen(
        ["php", "-S", f"0.0.0.0:{PHP_SERVER_PORT}", "api/index.php"],
        cwd="/app/backend-php",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    print(f"PHP server started on port {PHP_SERVER_PORT} with PID {php_process.pid}")
    return php_process

def stop_php_server():
    """Stop PHP server on exit"""
    global php_process
    if php_process:
        php_process.terminate()
        print("PHP server stopped")

# Register cleanup
atexit.register(stop_php_server)

@app.on_event("startup")
async def startup_event():
    """Start PHP server when FastAPI starts"""
    start_php_server()
    # Wait for PHP server to be ready
    time.sleep(1)

@app.on_event("shutdown")
async def shutdown_event():
    """Stop PHP server when FastAPI stops"""
    stop_php_server()

@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_to_php(request: Request, path: str):
    """Proxy all /api/* requests to PHP backend"""
    
    # Build target URL - PHP router expects path without /api prefix
    target_url = f"{PHP_BACKEND_URL}/{path}"
    
    # Get headers
    headers = dict(request.headers)
    # Remove host header to avoid conflicts
    headers.pop("host", None)
    
    # Get request body
    body = await request.body()
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body,
                params=request.query_params,
            )
            
            # Return response from PHP
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.headers.get("content-type", "application/json")
            )
    except httpx.ConnectError:
        # Try to restart PHP server
        start_php_server()
        time.sleep(1)
        raise HTTPException(status_code=503, detail="PHP backend temporarily unavailable, please retry")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")

@app.get("/")
async def root():
    return {"status": "ok", "message": "Layer7Top API Proxy", "backend": "PHP/MariaDB"}

@app.get("/health")
async def health():
    return {"status": "healthy", "php_port": PHP_SERVER_PORT}
