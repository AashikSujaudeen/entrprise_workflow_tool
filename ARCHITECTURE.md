# 🏗️ ENTERPRISE BANKING WORKFLOW TOOL - SYSTEM ARCHITECTURE

## 📐 **ARCHITECTURE OVERVIEW**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ENTERPRISE BANKING WORKFLOW PLATFORM                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 FRONTEND LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   DASHBOARD     │  │   WORKFLOWS     │  │     CASES       │  │   REPORTS   │ │
│  │                 │  │                 │  │                 │  │             │ │
│  │ • Analytics     │  │ • Workflow List │  │ • Case List     │  │ • Generated │ │
│  │ • Quick Actions │  │ • Create New    │  │ • Case Details  │  │ • Download  │ │
│  │ • Recent Cases  │  │ • M-C-Q-R Flow  │  │ • Status Track  │  │ • Analytics │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ WORKFLOW        │  │ AUTHENTICATION  │  │  NOTIFICATIONS  │  │   STATE     │ │
│  │ DESIGNER        │  │                 │  │                 │  │ MANAGEMENT  │ │
│  │                 │  │ • Login/Logout  │  │ • Real-time     │  │             │ │
│  │ • Drag & Drop   │  │ • Role-based    │  │ • Unread Count  │  │ • Mock API  │ │
│  │ • Element Props │  │ • JWT Tokens    │  │ • Polling       │  │ • Data Sync │ │
│  │ • Canvas Design │  │ • User Context  │  │ • Interactive   │  │ • Refresh   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              COMPONENT ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                            REACT FRONTEND (PORT 3000)                       │ │
│  ├─────────────────────────────────────────────────────────────────────────────┤ │
│  │  Authentication Context  │  State Management  │  Component Library        │ │
│  │  • AuthProvider         │  • useState Hooks  │  • Header                  │ │
│  │  • useAuth Hook         │  • useEffect       │  • Dashboard               │ │
│  │  • Login/Logout         │  • Data Refresh    │  • Workflows               │ │
│  │  • Role Management      │  • Mock API        │  • Cases                   │ │
│  │                         │                    │  • Designer                │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                        │                                         │
│                                        │ API Calls                               │
│                                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         FASTAPI BACKEND (PORT 8001)                         │ │
│  ├─────────────────────────────────────────────────────────────────────────────┤ │
│  │  Authentication APIs    │  Workflow APIs     │  Case Management APIs      │ │
│  │  • /api/auth/login     │  • /api/workflows  │  • /api/cases              │ │
│  │  • /api/auth/register  │  • POST/GET/PUT    │  • POST/GET/PUT/DELETE     │ │
│  │  • /api/auth/me        │  • Template CRUD   │  • Stage Progression       │ │
│  │  • JWT Verification    │                    │  • Case History            │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                        │                                         │
│                                        │ Database Operations                     │
│                                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                            MONGODB DATABASE                                  │ │
│  ├─────────────────────────────────────────────────────────────────────────────┤ │
│  │  Users Collection       │  Workflows Collection │  Cases Collection       │ │
│  │  • User Profiles        │  • Workflow Templates │  • Case Instances       │ │
│  │  • Roles & Permissions │  • Banking Processes  │  • Stage History        │ │
│  │  • Authentication Data │  • M-C-Q-R Stages     │  • Assignments          │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BANKING WORKFLOW FLOW                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐       │
│  │  START  │───▶│  MAKER  │───▶│ CHECKER │───▶│   QC    │───▶│ RESOLVE │       │
│  │         │    │         │    │         │    │         │    │         │       │
│  │ • Init  │    │ • Create│    │ • Review│    │ • Verify│    │ • Final │       │
│  │ • Setup │    │ • Input │    │ • Valid │    │ • Audit │    │ • Exec  │       │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘       │
│                      │              │              │              │            │
│                      ▼              ▼              ▼              ▼            │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         DECISION POINTS & ROUTING                           │ │
│  │                                                                              │ │
│  │  ✅ Approve ───────────────────────▶ Next Stage                             │ │
│  │  ❌ Reject ────────────────────────▶ Return to Maker                        │ │
│  │  ⏸️  Hold ─────────────────────────▶ Pending Queue                          │ │
│  │  🔄 Revise ────────────────────────▶ Back to Previous Stage                 │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                               DATA FLOW ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐             │
│  │   USER ACTION   │───▶│  FRONTEND       │───▶│   BACKEND       │             │
│  │                 │    │  COMPONENT      │    │   API           │             │
│  │ • Button Click  │    │                 │    │                 │             │
│  │ • Form Submit   │    │ • State Update  │    │ • Data Process  │             │
│  │ • Navigation    │    │ • UI Refresh    │    │ • DB Operation  │             │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘             │
│                              │                          │                       │
│                              ▼                          ▼                       │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐             │
│  │   UI UPDATE     │◀───│  STATE MGMT     │◀───│   DATABASE      │             │
│  │                 │    │                 │    │                 │             │
│  │ • List Refresh  │    │ • Data Sync     │    │ • CRUD Ops      │             │
│  │ • Status Change │    │ • Cache Update  │    │ • Persistence   │             │
│  │ • Real-time     │    │ • Event Emit    │    │ • Transactions  │             │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SECURITY ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                            AUTHENTICATION LAYER                             │ │
│  ├─────────────────────────────────────────────────────────────────────────────┤ │
│  │  JWT Tokens          │  Role-Based Access    │  Session Management        │ │
│  │  • Secure Headers    │  • Admin              │  • Token Refresh           │ │
│  │  • Token Validation  │  • Maker              │  • Logout Handling         │ │
│  │  • Expiry Handling   │  • Checker            │  • Local Storage           │ │
│  │                      │  • QC                 │                             │ │
│  │                      │  • Resolver           │                             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                               AUDIT TRAIL                                   │ │
│  ├─────────────────────────────────────────────────────────────────────────────┤ │
│  │  Case History        │  User Actions         │  System Events             │ │
│  │  • Stage Changes     │  • Login/Logout       │  • Workflow Creation        │ │
│  │  • Approvals/Rejects │  • Case Modifications │  • Report Generation        │ │
│  │  • Comments/Notes    │  • Role Changes       │  • Error Tracking           │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TECHNOLOGY STACK                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Frontend Technologies:                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │ • React 18 + Hooks                    • TailwindCSS + Custom Styles         │ │
│  │ • Context API for State Management    • Professional UI Components          │ │
│  │ • Custom Hooks (useAuth, useNotify)   • Responsive Design                   │ │
│  │ • JWT Authentication                  • Drag & Drop Interface               │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  Backend Technologies:                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │ • FastAPI (Python)                    • JWT Authentication                  │ │
│  │ • Pydantic Data Validation            • Password Hashing (bcrypt)           │ │
│  │ • AsyncIO for Performance             • CORS Middleware                     │ │
│  │ • RESTful API Design                  • Error Handling                      │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  Database & Infrastructure:                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │ • MongoDB (Document Database)         • Supervisor Process Management       │ │
│  │ • Motor (Async MongoDB Driver)        • Environment Configuration           │ │
│  │ • Docker Containerization             • Health Monitoring                   │ │
│  │ • Kubernetes Deployment               • Auto-restart Capabilities           │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘