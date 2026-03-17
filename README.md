# picks. – Betting Platform

Professional betting platform built with Next.js and Django.

## Tech Stack

- **Frontend:** Next.js 14+, TypeScript, Tailwind CSS, Zustand, shadcn-style components
- **Backend:** Django 5.x, Django REST Framework, JWT (Simple JWT), PostgreSQL
- **Auth:** Email/password, JWT, 2FA (TOTP)

## Project Structure

```
picks/
├── frontend/     # Next.js App Router
├── backend/      # Django REST API
└── README.md
```

## Requirements

- **Node.js** >= 20.9.0 (for Next.js 16)
- **Python** 3.10+
- **PostgreSQL** (optional; SQLite used if `DATABASE_URL` not set)

## Setup

### Backend

1. Create and activate a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

4. Run migrations (uses SQLite by default if `DATABASE_URL` is not set):
   ```bash
   python manage.py migrate
   ```

5. Start the server:
   ```bash
   python manage.py runserver
   ```

Backend runs at `http://localhost:8000`. API docs at `http://localhost:8000/api/docs/`.

### Frontend

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

Frontend runs at `http://localhost:3000`.

## Phase 1 Features

- Custom user model (email, KYC status, VIP level, 2FA)
- JWT authentication (login, register, token refresh)
- Email verification
- Two-Factor Authentication (TOTP)
- Swagger API documentation
- Dark-themed responsive UI

## Environment Variables

### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key |
| `DATABASE_URL` | PostgreSQL URL (or omit for SQLite) |
| `ALLOWED_HOSTS` | Comma-separated hosts |
| `CORS_ALLOWED_ORIGINS` | Frontend origin (e.g. http://localhost:3000) |
| `FRONTEND_URL` | Frontend URL for email links |
| `EMAIL_BACKEND` | Email backend (console for dev) |

### Frontend (`.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (e.g. http://localhost:8000/api) |
