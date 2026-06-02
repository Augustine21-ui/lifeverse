# Lifeverse — Gamified Learning Platform

A full-stack learning platform for students with XP, badges, goals, milestones, communities, and a leaderboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, Recharts, React Router |
| Backend | Node.js, Express, PostgreSQL |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Fonts | Clash Display, Plus Jakarta Sans |

---

## Project Structure

```
lifeverse/
├── backend/
│   ├── src/
│   │   ├── config/       # db.js, migrate.js, seed.js
│   │   ├── controllers/  # auth, goals, community, dashboard
│   │   ├── middleware/   # auth.js (JWT)
│   │   ├── models/       # xp.js (XP/level/badge logic)
│   │   └── routes/       # index.js (all routes)
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/   # layout (AppLayout)
    │   ├── hooks/        # useAuth.jsx (AuthContext)
    │   ├── pages/        # All page components
    │   ├── services/     # api.js
    │   └── index.css     # Design tokens & utilities
    ├── tailwind.config.js
    └── package.json
```

---

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally

### 1. Clone & install

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Frontend
cd ../frontend
npm install
```

### 2. Database setup

```bash
cd backend
npm run db:migrate   # Creates all tables
npm run db:seed      # Seeds badges + official communities
```

### 3. Run dev servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open http://localhost:5173

---

## API Endpoints

### Auth
| Method | Path | Auth |
|--------|------|------|
| POST | /api/auth/register | — |
| POST | /api/auth/login | — |
| GET | /api/auth/me | ✓ |
| PATCH | /api/auth/profile | ✓ |

### Goals
| Method | Path | Auth |
|--------|------|------|
| GET | /api/goals | ✓ |
| POST | /api/goals | ✓ |
| PATCH | /api/goals/:id | ✓ |
| DELETE | /api/goals/:id | ✓ |
| PATCH | /api/milestones/:id/toggle | ✓ |

### Communities
| Method | Path | Auth |
|--------|------|------|
| GET | /api/communities | optional |
| POST | /api/communities/:id/join | ✓ |
| DELETE | /api/communities/:id/leave | ✓ |
| GET | /api/communities/:id/posts | optional |
| POST | /api/communities/:id/posts | ✓ |
| POST | /api/posts/:postId/like | ✓ |

### Dashboard
| Method | Path | Auth |
|--------|------|------|
| GET | /api/dashboard | ✓ |
| GET | /api/badges | ✓ |
| GET | /api/leaderboard | — |

---

## XP System

| Action | XP |
|--------|----|
| Create a goal | +10 |
| Complete a milestone | +25 |
| Complete a goal | +100 |
| Post in community | +15 |
| Earn a badge | +50–1000 |

**Level formula:** Level = floor(totalXP / 500) + 1

---

## Features

- **Auth** — Register/Login with JWT, streak tracking on login
- **Dashboard** — XP progress, weekly XP chart, badge preview, goal summary
- **Goals** — Create goals with milestones, track progress, earn XP on completion
- **Communities** — Join/leave subject communities, post, like posts
- **Badges** — 10 badges across goals, streaks, social, and level categories
- **Leaderboard** — Top 20 students ranked by XP with podium display