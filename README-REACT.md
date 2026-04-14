# FYP Matching System - React Version

## Project Overview

A Final Year Project Matching System, migrated from plain HTML/CSS/JavaScript to React.

### Tech Stack

- Frontend: React 18 + Vite
- Backend: Node.js + Express
- Routing: React Router v6
- Authentication: Session-based
- Data: JSON mock data

## Quick Start

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Start the Application

#### Option A: Start both frontend and backend (Recommended)

```bash
npm run dev
```

This starts:
- Backend server: http://localhost:3000
- Frontend dev server: http://localhost:5173

#### Option B: Start separately

```bash
# Terminal 1 - Start backend
npm run server:dev

# Terminal 2 - Start frontend
npm run client
```

### 3. Access the Application

Open your browser: http://localhost:5173

## Test Accounts

### Admin
- Email: admin@hkmu.edu.hk
- Password: admin123
- Note: When Admin creates student/teacher accounts, the system uses default password Changeme123!. Users must change it after first login.

### Student
- Accounts created by Admin:
  - Username: s001@hkmu.edu.hk (or student ID)
  - Default password: Changeme123!
- Seed data accounts: password is student123

### Teacher
- Accounts created by Admin:
  - Username: t001@hkmu.edu.hk (or teacher ID)
  - Default password: Changeme123!
- Seed data accounts: password is teacher123

## Project Structure

```
FYP Matching System/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── PrivateRoute.jsx
│   │   │   └── Student/     # Student page sub-components
│   │   │       ├── Dashboard.jsx
│   │   │       ├── ProjectBrowse.jsx
│   │   │       ├── MyPreferences.jsx
│   │   │       ├── Results.jsx
│   │   │       ├── Profile.jsx
│   │   │       └── Sidebar.jsx
│   │   ├── pages/           # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Login.css
│   │   │   ├── Student.jsx
│   │   │   ├── Student.css
│   │   │   ├── Admin.jsx
│   │   │   └── Admin.css
│   │   ├── App.jsx          # Main app component
│   │   ├── main.jsx         # React entry point
│   │   └── index.css        # Global styles
│   ├── index.html
│   ├── vite.config.js       # Vite config (with backend proxy)
│   └── package.json
├── public/                   # Legacy static files
├── services/                 # Backend services
│   ├── studentService.js
│   └── mockData.js
├── data/
│   └── user.json
├── server.js                 # Express backend server
├── package.json
└── README-REACT.md
```

## Migration Changes

### Frontend Architecture
- Pure HTML → React components
- Inline JavaScript → React Hooks
- DOM manipulation → React state management
- Multiple HTML files → Single Page Application (SPA)

### Routing System
- Server routing → React Router
- Route protection (PrivateRoute component)

### API Communication
- Vite proxy configured to forward to backend
- All API calls remain unchanged

### Styles
- All CSS preserved
- Separated into component-level CSS files

## Features

### Login Page
- User login
- Role verification (admin/student/teacher)
- Session management
- Error handling

### Student Interface
- Dashboard
- Browse Projects (search & filter)
- My Preferences (preference management)
- Results (view results)
- Profile (personal info)
- Search and filter functionality

### Admin Interface
- Project Review
- Matching Control
- Final Assignment
- Deadline Management
- Create Student/Teacher Accounts (batch account creation)
  - Default password Changeme123!
  - Supports CSV template batch import
  - All users must change password after first login

## NPM Scripts

```bash
npm run dev          # Start both frontend and backend
npm run server       # Start backend only (production)
npm run server:dev   # Start backend only (dev mode)
npm run client       # Start frontend dev server only
npm run build        # Build frontend for production
npm start            # Start backend production server
```

## Development Notes

1. Frontend dev port: 5173
2. Backend API port: 3000
3. API proxy: Frontend requests automatically proxied to http://localhost:3000
4. Hot reload works for both frontend and backend

## FAQ

Q: Frontend can't connect to backend API?
A: Make sure backend is running on port 3000, Vite proxy is configured.

Q: Does Admin need to enter password when creating accounts?
A: No. System uses default password Changeme123!, all users must change password after first login.

Q: Page redirect fails after login?
A: Check if sessionStorage saved the login state correctly.

Q: CSS styles not applied?
A: Make sure CSS files are correctly imported in components.

## Support

Check:
1. All dependencies installed correctly
2. Ports 3000 and 5173 are available
3. Node.js version >= 16

---

Development Date: 2025-10-22
Version: 2.0.0 (React)
