## Campus Peer-to-Peer Marketplace

Full-stack sample project that enables MITE students to trade items inside the campus network. Built with vanilla HTML/CSS/JS on the frontend and a Node.js + Express + MySQL backend.

### Tech Stack
- Frontend: HTML5, CSS3, Vanilla JavaScript (Fetch/AJAX)
- Backend: Node.js, Express, bcrypt, JSON Web Tokens, Multer
- Database: MySQL 8 (schema + seed data included)

### Project Structure
```
├── backend/         # Express API + business logic
├── frontend/        # Static site (HTML/CSS/JS)
└── database/        # schema.sql with tables + seed data
```

### Database Setup
1. Install MySQL and create a user with privileges.
2. Run `database/schema.sql` in your MySQL client to create the database, tables, and seed data (includes one admin + sample listings).

### Backend Setup
```bash
cd backend
npm install
npm run dev           # or npm start
```

Key environment variables (`backend/env.example`):
```
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=campus_marketplace
JWT_SECRET=change_this_secret
UPLOAD_DIR=uploads
```

### Frontend Setup
The frontend is static and can be opened directly via `frontend/index.html` or served through any static server (e.g., `npx serve frontend`).

### Feature Highlights
- **Authentication:** Campus email validation (`@mite.ac.in`) for students, secure admin login from `admins` table.
- **Users:** Post listings (with optional image upload), browse marketplace, manage their own items, and file reports.
- **Admin:** Dashboard covering user management, item moderation, and report resolution.
- **Security:** Password hashing (bcrypt) and JWT-based auth for protected routes. File uploads stored under `backend/uploads`.

### Primary API Routes
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Student signup (campus email only) |
| POST | `/api/auth/login` | Student login |
| POST | `/api/auth/admin/login` | Admin login |
| GET | `/api/items` | Public marketplace feed |
| GET/POST/PUT/DELETE | `/api/items/*` | Authenticated CRUD for listings |
| POST | `/api/reports` | Students flag problematic posts |
| GET/PUT | `/api/admin/reports/:id` | Admin resolves reports |
| GET/PUT/DELETE | `/api/admin/users/:id` | Admin user management |

### Testing
`npm start` launches the API on `http://localhost:4000`. Hitting `/api/health` verifies server + DB connectivity (returns `{ db: "connected" }` when credentials are valid). Frontend uses Fetch calls to the same base URL.

### Next Steps
- Wire the frontend to a lightweight static hosting service or serve it via Express.
- Add email notifications for successful trades.
- Integrate a CDN or S3 bucket for durable image storage.

Enjoy maintaining a safe, campus-only trading space!
