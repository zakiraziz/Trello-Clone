# Trello Clone SaaS — Production-Ready Project Management Platform

A modern, responsive, and secure Kanban board software-as-a-service (SaaS) application built using React, TanStack Query (React Query v5), Axios, Express, PostgreSQL, and Socket.io.

---

## 🚀 Key Features

* **Kanban Boards**: Drag-and-drop interfaces for columns and cards using `@dnd-kit`.
* **Real-Time Synchronisation**: WebSockets keep the board updated instantly for all active members.
* **Profile & Settings**: Custom avatars, biography editing, dark/light/system theme toggles, and safe password change.
* **Security & Hardening**: Rate limiters, Joi validation, security headers (Helmet), cookie security, and parameterized DB queries.
* **Optimized Performance**: Code-splitting via React.lazy & Suspense, and optimistic query updates.
* **CI/CD Integration**: Automated typechecking, linting, and testing workflows via GitHub Actions.

---

## 🛠 Tech Stack

### Frontend
* **Core**: React 18, TypeScript, React Router Dom v6
* **State & Data Fetching**: TanStack React Query v5, Axios
* **Forms & Validation**: React Hook Form, Zod
* **Styling**: Tailwind CSS / Vanilla CSS, Lucide React (Icons)
* **Drag-and-Drop**: `@dnd-kit/core` & `@dnd-kit/sortable`
* **Notifications**: Sonner

### Backend
* **Runtime & Framework**: Node.js, Express
* **Database**: PostgreSQL (pg pool)
* **Real-time**: Socket.io
* **Validation**: Joi
* **Security**: Helmet, bcrypt, express-rate-limit, jsonwebtoken
* **Testing**: Jest

---

## ⚙️ Local Development Setup

### Database Configuration
1. Install and start PostgreSQL.
2. Create a new database named `trello_saas`.
3. Run the database schema initialization script:
   ```bash
   psql -U postgres -d trello_saas -f Database/schema.sql
   ```

### Backend Setup
1. Go to the `Backend` directory:
   ```bash
   cd Backend
   ```
2. Copy the `.env.example` to `.env` and fill in the details:
   ```env
   PORT=5000
   DATABASE_URL=postgres://username:password@localhost:5432/trello_saas
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   ```
3. Install dependencies and run in development mode:
   ```bash
   npm install
   npm run dev
   ```

### Frontend Setup
1. Go to the `Frontend` directory:
   ```bash
   cd Frontend
   ```
2. Create a `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. Install dependencies and run:
   ```bash
   npm install
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📂 Project Architecture

```
├── Backend/                 # Express REST API & Websocket Server
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── db/              # PostgreSQL connection pool
│   │   ├── middleware/      # Auth guards, validation schemas, rate limiting
│   │   ├── routes/          # REST Endpoint handlers (boards, cards, auth)
│   │   └── server.js        # Entry point & server listener
├── Database/
│   └── schema.sql           # Database table definitions
├── Frontend/                # Vite React Single Page Application
│   ├── src/
│   │   ├── api/             # Axios API Client configuration
│   │   ├── components/      # UI components (theme toggles, loader, etc.)
│   │   ├── features/        # Feature modules (boards, auth, settings, profile)
│   │   ├── hooks/           # TanStack Query React Hooks
│   │   └── App.tsx          # Router configuration and global provider wrappers
```

---

## 🧪 Running Tests

* **Backend Unit Tests**:
  ```bash
  cd Backend
  npm run test
  ```
* **Frontend Lint & Build**:
  ```bash
  cd Frontend
  npm run lint
  npm run build
  ```

---

## 🚀 Deployment Guide

### Frontend (Netlify)
1. Link your repository to Netlify.
2. Select the `Frontend` folder as base directory.
3. Use the build command: `npm run build`.
4. Use the publish directory: `dist`.
5. The `netlify.toml` file will automatically set up SPA fallback redirection.

### Backend (Render/Heroku/Docker)
1. Add environmental variables for `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`.
2. Set the start script to `node src/server.js`.
