# 🎓 StudyFlow - Full-Stack AI-Powered Study Management Platform

Production-ready study management application featuring subject tracking, interactive study planner, active study timer with timestamp synchronization, curated resource library, AI resource discovery assistant, and PostgreSQL analytics.

---

## 🌟 Architectural Features & Capabilities

- **🔐 Authentication & Ownership Engine**: Secure JWT authentication with strict per-user data isolation and IDOR protection.
- **📚 Subject Management**: Full CRUD for academic subjects with custom color tags.
- **🎯 Goals & Tasks Planner**: Multi-tier study planner with automatic Goal progress recalculation inside Prisma transactions.
- **⏱️ Study Sessions & Timer**: Active timer synchronization using backend timestamps to prevent timer drift and support page refresh state restoration. Single active session constraint (`409 Conflict`).
- **📖 Resources & Discovery**: Subject-based resource library with server-side HTTP/HTTPS URL validation and temporary online resource discovery.
- **🤖 AI Resource Assistant**: Server-side AI recommendation engine (`/api/v1/ai/resources/suggest`) with per-user rate limiting (10 req/15m) and explicit relevance explanations.
- **📊 Real Analytics Engine**: 100% database-derived analytics for study time, daily activity, task completion trends, goal progress, and resource stats.

---

## 🏗️ Technology Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Lucide Icons, React Router DOM.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM v6.19.3.
- **Database**: PostgreSQL database instance (`postgresql://postgres:password@localhost:5432/studyflow`).

---

## 🚀 Environment Setup & Local Development

### 1. Environment Variables Configuration

Copy `.env.example` to `.env` in `backend/`:

```bash
cd backend
cp .env.example .env
```

Ensure `.env` contains:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/studyflow?schema=public"
PORT=5000
NODE_ENV="development"
JWT_SECRET="super-secret-jwt-key-studyflow-dev-change-in-production"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="*"
AI_API_KEY="your-ai-api-key-here"
```

### 2. Database Migration

Run Prisma migrations against your PostgreSQL instance:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 3. Run Development Servers

- **Backend Dev Server**:
  ```bash
  cd backend
  npm run dev
  ```
  Runs on `http://localhost:5000/`. Database health check: `http://localhost:5000/health`.

- **Frontend Dev Server**:
  ```bash
  cd frontend
  npm run dev
  ```
  Runs on `http://localhost:5186/`.

---

## 🧪 Comprehensive Backend Test Suites

Run the automated backend test suites covering database relationships, API ownership security, timer accuracy, resource validation, AI rate limiting, analytics aggregation, and E2E security isolation:

```bash
cd backend

npm run test:db       # Database model & relationship test suite
npm run test:subject  # Subject API & Auth security test suite
npm run test:planner  # Goals, Tasks & Goal Progress security test suite
npm run test:session  # Study Sessions & Timer security test suite
npm run test:resource # Resources System & Discovery security test suite
npm run test:ai       # AI Resource Assistant & Rate Limiting test suite
npm run test:analytics# Analytics Engine database aggregation test suite
npm run test:e2e      # Full 19-Step E2E Workflow & Cross-User Security Test
```

---

## 📦 Production Build & Deployment Commands

### 1. Build Verification
```bash
# Build Express Backend
cd backend
npm run build

# Build Vite React Frontend
cd frontend
npm run build
```

### 2. Production Deployment Workflow
1. Provision production PostgreSQL database instance.
2. Set `DATABASE_URL`, `JWT_SECRET`, `AI_API_KEY`, and `CORS_ORIGIN` environment variables.
3. Deploy database schema using `npx prisma migrate deploy`. Never use `prisma db push` or reset commands in production.
4. Launch backend (`npm run start` in `backend/`).
5. Serve frontend production bundle (`dist/` directory in `frontend/`).
