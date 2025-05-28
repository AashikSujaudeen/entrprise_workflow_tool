from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
import asyncio
from bson import ObjectId
import json

load_dotenv()

# JWT Configuration
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# FastAPI app
app = FastAPI(title="PegaBank Workflow API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = None
db = None

@app.on_event("startup")
async def startup_db_client():
    global client, db
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "pegabank_workflow")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Create initial admin user
    await create_initial_data()
    print(f"Connected to MongoDB at {mongo_url}")

@app.on_event("shutdown")
async def shutdown_db_client():
    global client
    if client:
        client.close()

# Models
class User(BaseModel):
    username: str
    email: str
    full_name: str
    role: str = "user"  # admin, manager, maker, checker, qc, resolver
    department: str = "operations"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str = "user"
    department: str = "operations"

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class WorkflowCase(BaseModel):
    id: Optional[str] = None
    title: str
    workflow_type: str
    current_stage: str = "Maker"
    status: str = "Active"
    priority: str = "Medium"
    amount: Optional[str] = None
    customer: str
    assignee: Optional[str] = None
    maker: Optional[str] = None
    checker: Optional[str] = None
    qc: Optional[str] = None
    resolver: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    due_date: Optional[datetime] = None
    history: List[Dict[str, Any]] = []
    attachments: List[str] = []
    comments: List[Dict[str, Any]] = []

class WorkflowTemplate(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    stages: List[str] = ["Maker", "Checker", "QC", "Resolve"]
    type: str = "banking"
    icon: str = "🏦"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    efficiency: float = 0.0
    avg_time: str = "0 hours"

class Notification(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: str
    message: str
    type: str = "info"  # info, warning, error, success
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    action_url: Optional[str] = None

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"username": username})
    if user is None:
        raise credentials_exception
    return user

async def create_initial_data():
    """Create initial admin user and sample data"""
    # Check if admin user exists
    admin_exists = await db.users.find_one({"username": "admin"})
    if not admin_exists:
        admin_user = {
            "username": "admin",
            "email": "admin@pegabank.com",
            "password": hash_password("admin123"),
            "full_name": "System Administrator",
            "role": "admin",
            "department": "IT",
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(admin_user)
        
        # Create sample users
        sample_users = [
            {"username": "maker1", "email": "maker1@pegabank.com", "password": hash_password("maker123"), "full_name": "John Maker", "role": "maker", "department": "operations"},
            {"username": "checker1", "email": "checker1@pegabank.com", "password": hash_password("checker123"), "full_name": "Sarah Checker", "role": "checker", "department": "operations"},
            {"username": "qc1", "email": "qc1@pegabank.com", "password": hash_password("qc123"), "full_name": "Mike QC", "role": "qc", "department": "quality"},
            {"username": "resolver1", "email": "resolver1@pegabank.com", "password": hash_password("resolver123"), "full_name": "Lisa Resolver", "role": "resolver", "department": "operations"},
        ]
        
        for user in sample_users:
            user["is_active"] = True
            user["created_at"] = datetime.utcnow()
            await db.users.insert_one(user)
    
    # Create workflow templates
    templates_exist = await db.workflow_templates.find_one()
    if not templates_exist:
        templates = [
            {"name": "Wire Transfer Processing", "description": "High-value wire transfer workflow", "type": "banking", "icon": "💳", "stages": ["Maker", "Checker", "QC", "Resolve"], "is_active": True, "created_at": datetime.utcnow()},
            {"name": "Loan Application Review", "description": "Personal and business loan processing", "type": "banking", "icon": "🏦", "stages": ["Maker", "Checker", "QC", "Resolve"], "is_active": True, "created_at": datetime.utcnow()},
            {"name": "Account Opening Process", "description": "New customer account setup", "type": "banking", "icon": "👥", "stages": ["Maker", "Checker", "QC", "Resolve"], "is_active": True, "created_at": datetime.utcnow()},
            {"name": "Compliance Verification", "description": "AML/KYC compliance workflow", "type": "banking", "icon": "🛡️", "stages": ["Maker", "Checker", "QC", "Resolve"], "is_active": True, "created_at": datetime.utcnow()},
        ]
        await db.workflow_templates.insert_many(templates)

# API Routes

@app.get("/")
async def root():
    return {"message": "PegaBank Workflow API is running"}

# Authentication Routes
@app.post("/api/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"username": user_credentials.username})
    if not user or not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    # Remove password from user data
    user.pop("password", None)
    user["_id"] = str(user["_id"])
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.post("/api/auth/register", response_model=Dict[str, str])
async def register(user: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"$or": [{"username": user.username}, {"email": user.email}]})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Create new user
    user_dict = user.dict()
    user_dict["password"] = hash_password(user_dict["password"])
    user_dict["is_active"] = True
    user_dict["created_at"] = datetime.utcnow()
    
    result = await db.users.insert_one(user_dict)
    return {"message": "User created successfully", "user_id": str(result.inserted_id)}

@app.get("/api/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    current_user["_id"] = str(current_user["_id"])
    current_user.pop("password", None)
    return current_user

# Workflow Cases Routes
@app.get("/api/cases")
async def get_cases(current_user: dict = Depends(get_current_user)):
    cases = []
    async for case in db.workflow_cases.find():
        case["_id"] = str(case["_id"])
        case["id"] = case["_id"]
        cases.append(case)
    return cases

@app.post("/api/cases")
async def create_case(case: WorkflowCase, current_user: dict = Depends(get_current_user)):
    case_dict = case.dict()
    case_dict["created_by"] = current_user["username"]
    case_dict["maker"] = current_user["username"]
    case_dict["history"] = [{
        "action": "Case Created",
        "user": current_user["username"],
        "timestamp": datetime.utcnow(),
        "stage": "Maker"
    }]
    
    result = await db.workflow_cases.insert_one(case_dict)
    
    # Create notification for checker
    notification = {
        "user_id": "checker1",  # In real system, get actual checker
        "title": "New Case Assigned",
        "message": f"New case {case.title} created and ready for checking",
        "type": "info",
        "created_at": datetime.utcnow(),
        "action_url": f"/cases/{str(result.inserted_id)}"
    }
    await db.notifications.insert_one(notification)
    
    return {"message": "Case created successfully", "case_id": str(result.inserted_id)}

@app.put("/api/cases/{case_id}/move-stage")
async def move_case_stage(case_id: str, current_user: dict = Depends(get_current_user)):
    case = await db.workflow_cases.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    stages = ["Maker", "Checker", "QC", "Resolve"]
    current_stage_index = stages.index(case["current_stage"])
    
    if current_stage_index < len(stages) - 1:
        next_stage = stages[current_stage_index + 1]
        
        update_data = {
            "current_stage": next_stage,
            "updated_at": datetime.utcnow(),
            f"{next_stage.lower()}": current_user["username"]
        }
        
        # Add to history
        history_entry = {
            "action": f"Moved to {next_stage}",
            "user": current_user["username"],
            "timestamp": datetime.utcnow(),
            "stage": next_stage
        }
        
        await db.workflow_cases.update_one(
            {"_id": ObjectId(case_id)},
            {
                "$set": update_data,
                "$push": {"history": history_entry}
            }
        )
        
        return {"message": f"Case moved to {next_stage} stage"}
    else:
        await db.workflow_cases.update_one(
            {"_id": ObjectId(case_id)},
            {"$set": {"status": "Completed", "updated_at": datetime.utcnow()}}
        )
        return {"message": "Case completed"}

# Workflow Templates Routes
@app.get("/api/workflows")
async def get_workflows(current_user: dict = Depends(get_current_user)):
    templates = []
    async for template in db.workflow_templates.find():
        template["_id"] = str(template["_id"])
        template["id"] = template["_id"]
        
        # Calculate cases count for this workflow
        cases_count = await db.workflow_cases.count_documents({"workflow_type": template["name"]})
        template["cases_open"] = cases_count
        
        templates.append(template)
    return templates

@app.post("/api/workflows")
async def create_workflow(template: WorkflowTemplate, current_user: dict = Depends(get_current_user)):
    template_dict = template.dict()
    template_dict["created_by"] = current_user["username"]
    
    result = await db.workflow_templates.insert_one(template_dict)
    return {"message": "Workflow template created", "template_id": str(result.inserted_id)}

# Notifications Routes
@app.get("/api/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = []
    async for notification in db.notifications.find({"user_id": current_user["username"]}).sort("created_at", -1):
        notification["_id"] = str(notification["_id"])
        notification["id"] = notification["_id"]
        notifications.append(notification)
    return notifications

@app.put("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"is_read": True}}
    )
    return {"message": "Notification marked as read"}

# Analytics Routes
@app.get("/api/analytics/dashboard")
async def get_dashboard_analytics(current_user: dict = Depends(get_current_user)):
    # Get various metrics
    total_cases = await db.workflow_cases.count_documents({})
    active_workflows = await db.workflow_templates.count_documents({"is_active": True})
    pending_cases = await db.workflow_cases.count_documents({"status": "Active"})
    
    # Stage distribution
    stage_distribution = {}
    async for case in db.workflow_cases.find({"status": "Active"}):
        stage = case.get("current_stage", "Unknown")
        stage_distribution[stage] = stage_distribution.get(stage, 0) + 1
    
    return {
        "total_cases": total_cases,
        "active_workflows": active_workflows,
        "pending_cases": pending_cases,
        "stage_distribution": stage_distribution,
        "compliance_score": 98.5,
        "efficiency_rate": 94.2
    }

# Users Management (Admin only)
@app.get("/api/users")
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = []
    async for user in db.users.find():
        user["_id"] = str(user["_id"])
        user.pop("password", None)
        users.append(user)
    return users

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)