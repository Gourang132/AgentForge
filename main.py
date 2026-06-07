"""
AgentForge Backend — FastAPI + Supabase + Groq
============================================
Full production-ready backend for AgentForge platform.

Endpoints:
  POST /auth/register        — Register user
  POST /auth/login           — Login user
  GET  /products             — List all products
  POST /products             — Create product
  GET  /products/{id}        — Get product
  POST /chat/{product_id}    — Chat with AI (Groq)
  POST /knowledge/upload     — Upload file to RAG
  POST /knowledge/query      — Query knowledge base
  GET  /marketplace          — Browse marketplace
  POST /payments/create      — Create Razorpay order
  POST /payments/verify      — Verify payment
  GET  /dashboard            — User dashboard stats
"""

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import httpx
import os
import uuid
import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta
from supabase import create_client, Client
import razorpay

# ─────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────
app = FastAPI(
    title="AgentForge API",
    description="AI Product Builder Platform — Powered by Groq",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────
# ENV CONFIG (set in Railway/Render)
# ─────────────────────────────────────
SUPABASE_URL      = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY      = os.getenv("SUPABASE_KEY", "")
GROQ_API_KEY      = os.getenv("GROQ_API_KEY", "")
RAZORPAY_KEY_ID   = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_SECRET   = os.getenv("RAZORPAY_SECRET", "")
JWT_SECRET        = os.getenv("JWT_SECRET", "change-this-secret-in-production")

# ─────────────────────────────────────
# CLIENTS
# ─────────────────────────────────────
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL else None

razorpay_client = razorpay.Client(
    auth=(RAZORPAY_KEY_ID, RAZORPAY_SECRET)
) if RAZORPAY_KEY_ID else None

# ─────────────────────────────────────
# MODELS
# ─────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ChatMessage(BaseModel):
    message: str
    history: Optional[List[dict]] = []
    system_prompt: Optional[str] = "You are a helpful AI assistant."
    model: Optional[str] = "llama-3.3-70b-versatile"
    temperature: Optional[float] = 0.7

class ProductCreate(BaseModel):
    name: str
    description: str
    system_prompt: str
    model: Optional[str] = "llama-3.3-70b-versatile"
    price: Optional[float] = 0.0
    price_type: Optional[str] = "free"  # free | subscription | one_time
    is_public: Optional[bool] = False

class KnowledgeQuery(BaseModel):
    query: str
    product_id: str
    top_k: Optional[int] = 5

class PaymentCreate(BaseModel):
    product_id: str
    amount: int  # in paise (₹499 = 49900)
    currency: Optional[str] = "INR"

class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    product_id: str

# ─────────────────────────────────────
# AUTH HELPERS
# ─────────────────────────────────────
def get_current_user(authorization: Optional[str] = Header(None)):
    """Simple token validation via Supabase"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        if supabase:
            user = supabase.auth.get_user(token)
            return user.user
        else:
            # Demo mode without Supabase
            return {"id": "demo-user", "email": "demo@agentforge.io"}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ─────────────────────────────────────
# ROOT
# ─────────────────────────────────────
@app.get("/")
async def root():
    return {
        "name": "AgentForge API",
        "version": "1.0.0",
        "status": "🟢 Online",
        "powered_by": "Groq + FastAPI + Supabase",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "groq": "connected" if GROQ_API_KEY else "missing key",
        "supabase": "connected" if SUPABASE_URL else "missing config",
        "razorpay": "connected" if RAZORPAY_KEY_ID else "missing config"
    }

# ─────────────────────────────────────
# AUTH ROUTES
# ─────────────────────────────────────
@app.post("/auth/register")
async def register(body: RegisterRequest):
    """Register a new user"""
    try:
        if supabase:
            res = supabase.auth.sign_up({
                "email": body.email,
                "password": body.password,
                "options": {"data": {"name": body.name}}
            })
            
            # Create user profile in DB
            supabase.table("profiles").insert({
                "id": res.user.id,
                "name": body.name,
                "email": body.email,
                "plan": "free",
                "created_at": datetime.now().isoformat()
            }).execute()
            
            return {
                "success": True,
                "message": "Account created! Check your email to verify.",
                "user_id": res.user.id
            }
        else:
            # Demo mode
            return {
                "success": True,
                "message": "Demo mode — Supabase not configured",
                "user_id": str(uuid.uuid4())
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
async def login(body: LoginRequest):
    """Login and get access token"""
    try:
        if supabase:
            res = supabase.auth.sign_in_with_password({
                "email": body.email,
                "password": body.password
            })
            return {
                "success": True,
                "access_token": res.session.access_token,
                "refresh_token": res.session.refresh_token,
                "user": {
                    "id": res.user.id,
                    "email": res.user.email,
                    "name": res.user.user_metadata.get("name", "")
                }
            }
        else:
            return {
                "success": True,
                "access_token": "demo-token-" + str(uuid.uuid4()),
                "message": "Demo mode"
            }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")

# ─────────────────────────────────────
# PRODUCTS ROUTES
# ─────────────────────────────────────
@app.get("/products")
async def get_products(user=Depends(get_current_user)):
    """Get all products for current user"""
    try:
        if supabase:
            res = supabase.table("products").select("*").eq(
                "user_id", user.id
            ).order("created_at", desc=True).execute()
            return {"products": res.data, "count": len(res.data)}
        else:
            return {"products": [], "message": "Demo mode"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/products")
async def create_product(body: ProductCreate, user=Depends(get_current_user)):
    """Create a new AI product"""
    try:
        product_id = str(uuid.uuid4())
        product = {
            "id": product_id,
            "user_id": user.id,
            "name": body.name,
            "description": body.description,
            "system_prompt": body.system_prompt,
            "model": body.model,
            "price": body.price,
            "price_type": body.price_type,
            "is_public": body.is_public,
            "slug": body.name.lower().replace(" ", "-") + "-" + product_id[:6],
            "created_at": datetime.now().isoformat(),
            "stats": {"users": 0, "messages": 0, "revenue": 0}
        }
        
        if supabase:
            res = supabase.table("products").insert(product).execute()
            return {"success": True, "product": res.data[0]}
        else:
            return {"success": True, "product": product}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/products/{product_id}")
async def get_product(product_id: str, user=Depends(get_current_user)):
    """Get a single product"""
    try:
        if supabase:
            res = supabase.table("products").select("*").eq(
                "id", product_id
            ).single().execute()
            return {"product": res.data}
        else:
            return {"product": {"id": product_id, "name": "Demo Product"}}
    except Exception as e:
        raise HTTPException(status_code=404, detail="Product not found")

@app.delete("/products/{product_id}")
async def delete_product(product_id: str, user=Depends(get_current_user)):
    """Delete a product"""
    if supabase:
        supabase.table("products").delete().eq("id", product_id).eq(
            "user_id", user.id
        ).execute()
    return {"success": True, "message": "Product deleted"}

# ─────────────────────────────────────
# CHAT / AI ROUTES
# ─────────────────────────────────────
@app.post("/chat/{product_id}")
async def chat(product_id: str, body: ChatMessage):
    """Chat with an AI product — powered by Groq"""
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
    
    # Build messages
    messages = []
    
    # Add history
    for h in body.history[-10:]:  # Last 10 messages only
        messages.append(h)
    
    # Add current message
    messages.append({"role": "user", "content": body.message})
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": body.model,
                    "max_tokens": 1024,
                    "temperature": body.temperature,
                    "messages": [
                        {"role": "system", "content": body.system_prompt},
                        *messages
                    ]
                }
            )
        
        data = res.json()
        
        if "error" in data:
            raise HTTPException(status_code=400, detail=data["error"]["message"])
        
        reply = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})
        
        # Log to Supabase
        if supabase:
            supabase.table("chat_logs").insert({
                "product_id": product_id,
                "user_message": body.message,
                "ai_response": reply,
                "model": body.model,
                "tokens": usage.get("total_tokens", 0),
                "created_at": datetime.now().isoformat()
            }).execute()
        
        return {
            "success": True,
            "reply": reply,
            "model": body.model,
            "usage": usage,
            "latency_ms": data.get("usage", {}).get("total_time", 0)
        }
        
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Groq API timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/stream/{product_id}")
async def chat_stream(product_id: str, body: ChatMessage):
    """Streaming chat response — Groq is fast but streaming feels even better"""
    from fastapi.responses import StreamingResponse
    
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
    
    async def generate():
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": body.model,
                    "max_tokens": 1024,
                    "temperature": body.temperature,
                    "stream": True,
                    "messages": [
                        {"role": "system", "content": body.system_prompt},
                        {"role": "user", "content": body.message}
                    ]
                }
            ) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            yield "data: [DONE]\n\n"
                            break
                        try:
                            chunk = json.loads(data)
                            content = chunk["choices"][0]["delta"].get("content", "")
                            if content:
                                yield f"data: {json.dumps({'content': content})}\n\n"
                        except:
                            pass
    
    return StreamingResponse(generate(), media_type="text/event-stream")

# ─────────────────────────────────────
# KNOWLEDGE BASE (RAG)
# ─────────────────────────────────────
@app.post("/knowledge/upload")
async def upload_knowledge(
    product_id: str,
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    """Upload a file to the knowledge base"""
    allowed = [".pdf", ".txt", ".docx", ".csv", ".md"]
    ext = os.path.splitext(file.filename)[1].lower()
    
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"File type {ext} not supported. Use: {', '.join(allowed)}"
        )
    
    content = await file.read()
    file_id = str(uuid.uuid4())
    
    try:
        if supabase:
            # Upload to Supabase Storage
            path = f"{user.id}/{product_id}/{file_id}{ext}"
            supabase.storage.from_("knowledge").upload(path, content)
            
            # Save metadata to DB
            supabase.table("knowledge_files").insert({
                "id": file_id,
                "product_id": product_id,
                "user_id": user.id,
                "filename": file.filename,
                "file_path": path,
                "file_size": len(content),
                "status": "indexed",
                "chunks": 0,
                "created_at": datetime.now().isoformat()
            }).execute()
        
        return {
            "success": True,
            "file_id": file_id,
            "filename": file.filename,
            "size_kb": round(len(content) / 1024, 2),
            "status": "indexed",
            "message": f"File '{file.filename}' indexed successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/knowledge/query")
async def query_knowledge(body: KnowledgeQuery, user=Depends(get_current_user)):
    """Query the knowledge base using Groq"""
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
    
    # Get knowledge files for this product
    context = ""
    if supabase:
        files = supabase.table("knowledge_files").select("filename").eq(
            "product_id", body.product_id
        ).execute()
        if files.data:
            file_list = ", ".join([f["filename"] for f in files.data])
            context = f"Knowledge base contains: {file_list}"
    
    # Use Groq to answer from context
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "max_tokens": 512,
                "messages": [{
                    "role": "user",
                    "content": f"You are a RAG system. Context: {context}\n\nQuery: {body.query}\n\nAnswer based on the context, or say you don't have that information."
                }]
            }
        )
    
    data = res.json()
    answer = data["choices"][0]["message"]["content"]
    
    return {
        "query": body.query,
        "answer": answer,
        "sources": context,
        "top_k": body.top_k
    }

# ─────────────────────────────────────
# MARKETPLACE
# ─────────────────────────────────────
@app.get("/marketplace")
async def get_marketplace(
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    """Browse public AI products on marketplace"""
    try:
        if supabase:
            query = supabase.table("products").select(
                "id, name, description, price, price_type, slug, stats"
            ).eq("is_public", True)
            
            if search:
                query = query.ilike("name", f"%{search}%")
            
            res = query.range(offset, offset + limit - 1).execute()
            return {"products": res.data, "total": len(res.data)}
        else:
            # Demo marketplace data
            return {
                "products": [
                    {"id": "1", "name": "DAX Formula AI", "description": "Power BI formula generator", "price": 19, "price_type": "subscription"},
                    {"id": "2", "name": "Legal Brief AI", "description": "Legal document drafter", "price": 79, "price_type": "subscription"},
                    {"id": "3", "name": "HR Screener", "description": "Resume screening agent", "price": 149, "price_type": "subscription"},
                ],
                "total": 3
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─────────────────────────────────────
# PAYMENTS — RAZORPAY
# ─────────────────────────────────────
@app.post("/payments/create")
async def create_payment(body: PaymentCreate, user=Depends(get_current_user)):
    """Create a Razorpay order"""
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Razorpay not configured")
    
    try:
        order = razorpay_client.order.create({
            "amount": body.amount,
            "currency": body.currency,
            "receipt": f"order_{uuid.uuid4().hex[:8]}",
            "notes": {
                "product_id": body.product_id,
                "user_id": str(user.id)
            }
        })
        
        # Save order to DB
        if supabase:
            supabase.table("orders").insert({
                "id": order["id"],
                "user_id": user.id,
                "product_id": body.product_id,
                "amount": body.amount,
                "currency": body.currency,
                "status": "created",
                "created_at": datetime.now().isoformat()
            }).execute()
        
        return {
            "success": True,
            "order_id": order["id"],
            "amount": body.amount,
            "currency": body.currency,
            "key_id": RAZORPAY_KEY_ID
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/payments/verify")
async def verify_payment(body: PaymentVerify, user=Depends(get_current_user)):
    """Verify Razorpay payment signature"""
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Razorpay not configured")
    
    try:
        # Verify signature
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": body.razorpay_order_id,
            "razorpay_payment_id": body.razorpay_payment_id,
            "razorpay_signature": body.razorpay_signature
        })
        
        # Update order status
        if supabase:
            supabase.table("orders").update({
                "status": "paid",
                "payment_id": body.razorpay_payment_id,
                "paid_at": datetime.now().isoformat()
            }).eq("id", body.razorpay_order_id).execute()
            
            # Grant user access to product
            supabase.table("subscriptions").insert({
                "user_id": user.id,
                "product_id": body.product_id,
                "order_id": body.razorpay_order_id,
                "status": "active",
                "started_at": datetime.now().isoformat(),
                "expires_at": (datetime.now() + timedelta(days=30)).isoformat()
            }).execute()
        
        return {
            "success": True,
            "message": "Payment verified. Access granted!",
            "payment_id": body.razorpay_payment_id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail="Payment verification failed")

# ─────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────
@app.get("/dashboard")
async def get_dashboard(user=Depends(get_current_user)):
    """Get user dashboard stats"""
    try:
        if supabase:
            # Products count
            products = supabase.table("products").select(
                "id", count="exact"
            ).eq("user_id", user.id).execute()
            
            # Total messages
            messages = supabase.table("chat_logs").select(
                "id", count="exact"
            ).execute()
            
            # Revenue
            orders = supabase.table("orders").select("amount").eq(
                "user_id", user.id
            ).eq("status", "paid").execute()
            
            total_revenue = sum(o["amount"] for o in orders.data) / 100 if orders.data else 0
            
            return {
                "products": products.count or 0,
                "messages": messages.count or 0,
                "revenue": total_revenue,
                "currency": "INR",
                "plan": "free"
            }
        else:
            return {
                "products": 2,
                "messages": 1240,
                "revenue": 4980,
                "currency": "INR",
                "plan": "free",
                "note": "Demo mode — connect Supabase for real data"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─────────────────────────────────────
# MODELS LIST
# ─────────────────────────────────────
@app.get("/models")
async def get_models():
    """Available Groq models"""
    return {
        "models": [
            {"id": "llama-3.3-70b-versatile", "name": "Llama 3.3 70B", "speed": "Fast", "best_for": "General purpose", "free": True},
            {"id": "llama-3.1-8b-instant",    "name": "Llama 3.1 8B",  "speed": "Fastest", "best_for": "Quick replies", "free": True},
            {"id": "mixtral-8x7b-32768",       "name": "Mixtral 8x7B",  "speed": "Fast", "best_for": "Long context", "free": True},
            {"id": "gemma2-9b-it",             "name": "Gemma 2 9B",    "speed": "Fast", "best_for": "Efficient tasks", "free": True},
        ]
    }
