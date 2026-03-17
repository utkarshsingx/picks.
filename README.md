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

Backend runs at `http://localhost:8000`.

**API documentation (Swagger):**
- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- OpenAPI schema: `http://localhost:8000/api/schema/`

Use the **Authorize** button in Swagger UI to add your JWT token for testing protected endpoints.

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

## Phase 3 Features

- **Casino games:** Dice, Mines, Plinko, Crash
- **Live sports:** Sportsbook with The Odds API (NFL, NBA, NHL, MLB, soccer, etc.)
- **Bet flow:** Debit wallet on bet, credit on win; BET/WIN transactions
- **Dice:** Over/under target, instant resolution
- **Mines:** 5x5 grid, reveal tiles, cash out anytime
- **Plinko:** Risk levels (low/medium/high), instant resolution
- **Crash:** Provably fair, real-time multiplier via WebSocket (Django Channels)
- **Bet history:** Paginated list of user bets
- **WebSocket:** `ws://host/ws/crash/{round_id}/?token=<jwt>` for live Crash multiplier

### Running Crash (requires round scheduler)

```bash
# Terminal 1: Start backend with daphne (WebSocket support)
cd backend && daphne -b 0.0.0.0 -p 8000 config.asgi:application

# Terminal 2: Run Crash round scheduler (broadcasts multiplier)
cd backend && python manage.py run_crash_rounds
```

For Redis in production, set `USE_REDIS=true` and `REDIS_URL`.

## Phase 2 Features

- Multi-currency wallets (BTC, ETH, USDT, USD)
- Atomic balance operations with transaction.atomic()
- Crypto deposits via NowPayments
- Fiat deposits via Stripe
- Withdrawal flow with configurable auto-approval limit
- Admin approval queue for large withdrawals
- Paginated transaction history
- Webhook handlers for payment confirmation

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
| `WITHDRAWAL_AUTO_APPROVE_LIMIT_USD` | Auto-approve withdrawals below this (default 500) |
| `WITHDRAWAL_MIN_AMOUNT_USD` | Minimum withdrawal (default 10) |
| `NOWPAYMENTS_API_KEY` | NowPayments API key (crypto) |
| `NOWPAYMENTS_IPN_SECRET` | NowPayments webhook secret |
| `STRIPE_SECRET_KEY` | Stripe secret key (fiat) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `BACKEND_URL` | Backend URL for webhooks (e.g. http://localhost:8000) |

### Frontend (`.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (e.g. http://localhost:8000/api) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for card form |
