# Elevatr — Career & Project Management Platform

> A full-stack web application for managing careers, projects, resumes, and job applications — powered by AI.

Elevatr brings together project showcasing, job hunting, resume management, and AI-powered ATS analysis into a single unified platform built for students and early-career professionals.

---

## Features

### Core Modules

- **Authentication & Authorization** — Secure JWT-based auth using httpOnly cookies with role-based access (`student`, `recruiter`, `admin`).
- **Profile Management** — Rich user profiles with bio, skills (with proficiency levels), experience, education, social links, profile picture uploads, and public/private visibility toggle.
- **Resume Management** — Upload, manage, and set default PDF resumes. Download resumes directly from the platform.
- **Project Showcase** — Create, edit, and browse projects with tech stack tags, GitHub/live demo links, and view counts.
- **Job Board** — Post, search, filter, and manage job listings with salary ranges, skill requirements, experience levels, and application deadlines.
- **Job Applications** — Apply to jobs and track application status. Recruiters can view and manage applicants.
- **Social Features** — Follow/unfollow users, view member profiles, and discover community members.
- **Real-Time Notifications** — Socket.io powered instant notifications for follows, job applications, and status updates with bell icon badge.

### AI-Powered Features

- **ATS Resume Optimizer** — Paste a job description and get an AI-powered ATS compatibility analysis. Extracts actual text from your uploaded PDF resume and compares it against the job requirements. Returns a detailed score, matched/missing keywords, strengths, weaknesses, and actionable suggestions.
- **Interview Question Generator** — AI generates tailored technical, behavioral, and situational interview questions based on the job title and company.
- **Intelligent Fallback** — When the AI service is unavailable, the system falls back to keyword-based analysis ensuring features always work.

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| React Router v7 | Client-side routing |
| Tailwind CSS v4 | Utility-first styling |
| Axios | HTTP client |
| Socket.io Client | Real-time events |
| Vite 7 | Build tool & dev server |

### Backend

| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose | Database & ODM |
| JWT + httpOnly Cookies | Authentication |
| Socket.io | Real-time notifications |
| Groq SDK (Llama 3.3 70B) | AI-powered analysis |
| pdf-parse | PDF text extraction |
| Multer | File uploads |
| bcrypt | Password hashing |

---

## Project Structure

```
elevatr/
├── backend/
│   ├── config/            # Database connection
│   ├── controllers/       # Route handlers
│   │   ├── ai.controller.js        # AI interview questions (Groq)
│   │   ├── profile.controller.js   # Profile + ATS analysis (Groq)
│   │   ├── auth.controller.js      # Login/Register
│   │   ├── job.controller.js       # Job CRUD
│   │   ├── application.controller.js
│   │   ├── project.controller.js
│   │   ├── notification.controller.js
│   │   └── users.controller.js
│   ├── middlewares/       # Auth middleware (JWT verification)
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express route definitions
│   ├── uploads/           # User-uploaded files (resumes, pictures)
│   ├── server.js          # Entry point with Socket.io
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── (Auth)/        # Login & Register pages
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # AuthContext, NotificationContext
│   │   ├── pages/         # Route-level page components
│   │   ├── services/      # API service layer (Axios)
│   │   ├── App.jsx        # Root component with routing
│   │   └── main.jsx       # Entry point
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local instance or connection string)
- **Groq API Key** — Get one free at [console.groq.com](https://console.groq.com)

### 1. Clone the Repository

```bash
git clone https://github.com/Kanav4002/elevatr.git
cd elevatr
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
DB_URL=mongodb://localhost:27017/elevatr
JWT_SECRET=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key
PORT=4000
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (sets httpOnly cookie) |
| POST | `/api/auth/logout` | Logout (clears cookie) |
| GET | `/api/auth/me` | Get current user |

### Profile
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/profile/me` | Get own profile |
| GET | `/api/profile/user/:userId` | Get user profile (public) |
| PUT | `/api/profile/update` | Update profile |
| POST | `/api/profile/upload-picture` | Upload profile picture |
| POST | `/api/profile/upload-resume` | Upload resume (PDF) |
| POST | `/api/profile/analyze-resume` | AI ATS analysis |
| POST | `/api/profile/follow/:userId` | Follow/unfollow user |

### Jobs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/jobs` | List all jobs (with filters) |
| GET | `/api/jobs/:id` | Get job details |
| POST | `/api/jobs` | Create job listing |
| PUT | `/api/jobs/:id` | Update job |
| DELETE | `/api/jobs/:id` | Delete job |
| POST | `/api/jobs/:id/apply` | Apply to job |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | Browse projects |
| GET | `/api/projects/:id` | Get project details |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### AI
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/interview-questions` | Generate interview questions |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |

---

## AI Integration

Elevatr uses **Groq** with the **Llama 3.3 70B Versatile** model for AI features:

- **ATS Resume Analysis** — Reads the actual PDF resume text using `pdf-parse`, combines it with profile data, and sends it to Groq for comprehensive analysis against a job description. Returns score, keyword matching, strengths, weaknesses, and improvement suggestions.
- **Interview Questions** — Generates role-specific technical, behavioral, and situational questions tailored to the job title and company.
- **Fallback System** — If the AI service is unavailable, both features gracefully fall back to keyword-based logic so users are never blocked.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DB_URL` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for JWT signing |
| `GROQ_API_KEY` | Yes | Groq API key for AI features |
| `PORT` | No | Backend port (default: `4000`) |
| `CLIENT_URL` | No | Frontend URL for CORS (default: `http://localhost:5173`) |

---

## Author

**Kanav Kumar**
- GitHub: [@Kanav4002](https://github.com/Kanav4002)
- LinkedIn: [Kanav Kumar](https://linkedin.com/in/kanavkumar)

---

## License

This project is part of the **BE-III Academic Curriculum** at Chitkara University.
