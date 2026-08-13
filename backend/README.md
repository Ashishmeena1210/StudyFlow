# StudyFlow Backend API & Database Documentation

Production-ready Express backend service and PostgreSQL database access layer for StudyFlow.

---

## 🔐 Authentication Engine

Authenticates requests via JWT Bearer Tokens in the `Authorization` header (`Bearer <token>`).

### Auth Endpoints

| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register new user account (`email`, `password`, `name`) | No |
| `POST` | `/api/v1/auth/login` | Authenticate user credentials & receive JWT token | No |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | **Yes** |

---

## 📚 Subject API (CRUD)

All Subject endpoints require JWT authentication. User ID is extracted directly from `req.user.id` (token payload).

| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/subjects` | Fetch all subjects belonging to the authenticated user | **Yes** |
| `POST` | `/api/v1/subjects` | Create a new subject for the authenticated user | **Yes** |
| `GET` | `/api/v1/subjects/:id` | Fetch single subject by ID (Ownership verified) | **Yes** |
| `PATCH` | `/api/v1/subjects/:id` | Update subject details (Ownership verified) | **Yes** |
| `DELETE` | `/api/v1/subjects/:id` | Delete subject (Cascades dependent data) | **Yes** |

---

## 🎯 Goal API (CRUD)

| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/goals` | Fetch goals (Supports `subjectId`, `status` query filters) | **Yes** |
| `POST` | `/api/v1/goals` | Create goal linked to subject owned by current user | **Yes** |
| `GET` | `/api/v1/goals/:id` | Fetch single goal by ID (Ownership verified) | **Yes** |
| `PATCH` | `/api/v1/goals/:id` | Update goal fields (Ownership verified) | **Yes** |
| `DELETE` | `/api/v1/goals/:id` | Delete goal cleanly (Linked tasks disassociate) | **Yes** |

---

## ⚡ Task API (CRUD)

| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/tasks` | Fetch tasks (Supports `subjectId`, `goalId`, `status`, `priority` filters) | **Yes** |
| `POST` | `/api/v1/tasks` | Create task (Atomically updates goal progress inside Prisma transaction) | **Yes** |
| `GET` | `/api/v1/tasks/:id` | Fetch single task by ID (Ownership verified) | **Yes** |
| `PATCH` | `/api/v1/tasks/:id` | Update task status/fields (Manages `completedAt`, updates goal progress) | **Yes** |
| `DELETE` | `/api/v1/tasks/:id` | Delete task (Recalculates goal progress) | **Yes** |

---

## ⏱️ Study Session API

| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/study-sessions/active` | Fetch active study session for page refresh restoration | **Yes** |
| `GET` | `/api/v1/study-sessions` | Fetch session history (Filters: `subjectId`, `goalId`, `taskId`, `status`) | **Yes** |
| `POST` | `/api/v1/study-sessions` | Start new active session (Rejects if active session exists: `409 Conflict`) | **Yes** |
| `POST` | `/api/v1/study-sessions/:id/complete` | Complete session (Calculates `actualDuration`, records reflection) | **Yes** |
| `POST` | `/api/v1/study-sessions/:id/cancel` | Cancel session (Sets `status = CANCELLED`, sets `endedAt`) | **Yes** |

---

## 📖 Resources System API

| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/resources` | Fetch saved resources (Filters: `subjectId`, `goalId`, `type`, `isSaved`, `isFavorite`) | **Yes** |
| `POST` | `/api/v1/resources` | Create resource (Validates HTTP/HTTPS URL, subject/goal/task ownership) | **Yes** |
| `GET` | `/api/v1/resources/:id` | Fetch single resource by ID (Ownership verified) | **Yes** |
| `PATCH` | `/api/v1/resources/:id` | Update resource fields | **Yes** |
| `DELETE` | `/api/v1/resources/:id` | Delete resource (Does NOT delete subject/goal/task) | **Yes** |
| `POST` | `/api/v1/resources/:id/save` | Toggle `isSaved` status | **Yes** |
| `POST` | `/api/v1/resources/:id/favorite` | Toggle `isFavorite` status | **Yes** |
| `PATCH` | `/api/v1/resources/:id/open` | Record `lastOpenedAt` timestamp | **Yes** |
| `GET` | `/api/v1/resources/search` | Temporary online resource discovery search (NOT saved until user clicks Save) | **Yes** |

---

## 🤖 AI Resource Assistant API

| Method | Route | Description | Auth Required | Rate Limited |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/ai/resources/suggest` | Generates AI-assisted structured study resource recommendations with relevance explanations | **Yes** | **Yes** (10 req/15m) |

---

## 📊 Analytics Engine API

| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/analytics/overview` | Returns real aggregated study analytics (Query params: `range=today\|7d\|30d\|90d\|all`, `subjectId=...`) | **Yes** |

---

## 🛡️ Security & IDOR Safeguards

1. **User Data Isolation**: Query filters enforce `userId = req.user.id`. Frontend payloads cannot override `userId`.
2. **Server-Side AI API Keys**: AI credentials (`AI_API_KEY`) remain strictly on the backend server.
3. **Real Database Aggregations**: Analytics calculations are derived strictly from PostgreSQL entities (`StudySession`, `Task`, `Goal`, `Subject`, `Resource`). No hardcoded mock values.

---

## 🧪 Testing Backend Suites
```bash
npm run test:db       # Database model & relationship test suite
npm run test:subject  # Subject API & Auth security test suite
npm run test:planner  # Goals, Tasks & Goal Progress security test suite
npm run test:session  # Study Sessions & Timer security test suite
npm run test:resource # Resources System & Discovery security test suite
npm run test:ai       # AI Resource Assistant & Rate Limiting test suite
npm run test:analytics# Analytics Engine database aggregation test suite
npm run build         # Strict TypeScript build verification
```
