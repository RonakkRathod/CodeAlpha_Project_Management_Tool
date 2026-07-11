# ProBoard — Project Management Tool

A collaborative project management tool for teams. Create boards, assign tasks, and communicate effectively.

## Tech Stack

- **Frontend:** React 18 (Vite), React Router, Axios
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Auth:** JWT (JSON Web Tokens) + bcrypt

## Prerequisites

- Node.js 18+
- MongoDB running locally (default: `mongodb://localhost:27017`)

## Getting Started

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Server runs on `http://localhost:5000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:5173`

## Features

- **Authentication** — Register, login, JWT-based auth
- **Projects** — Create, edit, delete group projects
- **Kanban Board** — To Do, In Progress, Review, Done columns
- **Tasks** — Create tasks with title, description, priority, assignee, due date
- **Members** — Add/remove project members by email
- **Comments** — Comment threads on individual tasks
- **Responsive** — Works on desktop and mobile

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET/POST | `/api/projects` | List/Create projects |
| GET/PUT/DELETE | `/api/projects/:id` | Project CRUD |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |
| GET | `/api/tasks/project/:projectId` | List tasks |
| POST | `/api/tasks` | Create task |
| GET/PUT/DELETE | `/api/tasks/:id` | Task CRUD |
| GET | `/api/comments/task/:taskId` | List comments |
| POST | `/api/comments` | Add comment |
| DELETE | `/api/comments/:id` | Delete comment |
