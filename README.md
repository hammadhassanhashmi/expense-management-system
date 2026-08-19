# ExpenseIQ — Full-Stack Expense Management System

A production-ready personal finance tracker built with React, Node.js, and MySQL. Track income and expenses, set budgets, visualize spending trends, and export reports — all in a clean dark-themed UI.

---

## Features

- **Authentication** — JWT-based register/login with bcrypt password hashing
- **Transactions** — Create, read, update, and delete income and expense records with filtering by type, category, and keyword search
- **Categories** — Fully customizable categories with emoji icons and color coding, seeded with 8 defaults on registration
- **Budget Tracker** — Set monthly spending limits per category with real-time progress bars and over-budget alerts
- **Dashboard** — At-a-glance summary cards, 6-month area chart (income vs. expenses), donut chart by category, and recent transactions
- **Reports & Analytics** — Bar chart trends, category breakdown with percentages, and one-click CSV export
- **Dark UI** — Slate-based dark theme built entirely with Tailwind CSS v4

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Routing | React Router v7 |
| Charts | Recharts |
| HTTP Client | Axios |
| Notifications | React Hot Toast |
| Icons | Lucide React |
| Backend | Node.js, Express.js (ES Modules) |
| Database | MySQL 8 via mysql2/promise |
| Auth | JWT (jsonwebtoken) + bcryptjs |

---

## Project Structure

```
expense-management-system/
├── backend/
│   ├── db/
│   │   └── schema.sql          # Database schema (users, categories, expenses, budgets)
│   ├── middleware/
│   │   └── auth.js             # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js             # Register, login, /me
│   │   ├── expenses.js         # CRUD for transactions
│   │   ├── categories.js       # CRUD for categories
│   │   ├── budgets.js          # Budget upsert, fetch, delete
│   │   └── dashboard.js        # Aggregated summary + trend data
│   ├── server.js               # Express app entry point
│   ├── .env.example            # Environment variable template
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.js        # Axios instance with auth interceptors
    │   ├── context/
    │   │   └── AuthContext.jsx # Global auth state (React Context)
    │   ├── components/
    │   │   └── Layout/
    │   │       ├── Sidebar.jsx # Navigation sidebar with user info
    │   │       └── Layout.jsx  # Page wrapper
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Expenses.jsx
    │   │   ├── Categories.jsx
    │   │   ├── Budgets.jsx
    │   │   └── Reports.jsx
    │   ├── App.jsx             # Routes with PrivateRoute / PublicRoute guards
    │   ├── main.jsx
    │   └── index.css           # Tailwind v4 import + global styles
    ├── vite.config.js          # Vite + Tailwind plugin + API proxy
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+

### 1. Database Setup

```sql
CREATE DATABASE expense_management;
USE expense_management;
-- Then run backend/db/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in your DB credentials and a JWT secret in .env
npm install
npm run dev
```

The API will start at `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will open at `http://localhost:5173`. The Vite dev server proxies `/api` requests to the backend automatically.

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create account + seed categories | No |
| POST | `/api/auth/login` | Login, returns JWT | No |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/expenses` | List transactions (filterable) | Yes |
| POST | `/api/expenses` | Create transaction | Yes |
| PUT | `/api/expenses/:id` | Update transaction | Yes |
| DELETE | `/api/expenses/:id` | Delete transaction | Yes |
| GET | `/api/categories` | List user categories | Yes |
| POST | `/api/categories` | Create category | Yes |
| PUT | `/api/categories/:id` | Update category | Yes |
| DELETE | `/api/categories/:id` | Delete category | Yes |
| GET | `/api/budgets` | Get budgets for month/year | Yes |
| POST | `/api/budgets` | Upsert budget | Yes |
| DELETE | `/api/budgets/:id` | Remove budget | Yes |
| GET | `/api/dashboard/summary` | Aggregated stats + charts data | Yes |
| GET | `/api/health` | Health check | No |

---

## Environment Variables

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=expense_management
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

---

## Security Notes

- Passwords are hashed with bcrypt (12 salt rounds)
- All protected routes require a valid JWT Bearer token
- SQL queries use parameterized placeholders (no raw string interpolation)
- Each user's data is fully isolated — queries always filter by `user_id`
- CORS is restricted to the configured frontend URL

---

## License

MIT
=======
# expense-management-system
Full-stack Expense Management System built with React, Node.js, Express &amp; MySQL. Features JWT auth, income/expense tracking, budget management, analytics charts &amp; CSV export.
