# Project Structure

## Overview

```
FYP Matching System/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── PrivateRoute.jsx
│   │   │   └── Student/     # Student page components
│   │   ├── pages/           # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Student.jsx
│   │   │   └── Admin.jsx
│   │   ├── App.jsx          # Main app + routes
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── index.html
│   ├── vite.config.js       # Vite config
│   └── package.json
├── services/                 # Backend services
│   ├── studentService.js
│   └── mockData.js
├── data/
│   └── user.json
├── server.js                 # Express backend
├── package.json
├── config/
│   └── mongodb.js           # MongoDB config
├── README-REACT.md          # Main documentation
├── QUICK-START.md           # Quick start
└── PROJECT-STRUCTURE.md     # This file
```

## Core Files

### Frontend Entry
- `client/index.html` - HTML template
- `client/src/main.jsx` - React entry
- `client/src/App.jsx` - Route configuration

### Pages
- `pages/Login.jsx` - Login page
- `pages/Student.jsx` - Student interface
- `pages/Admin.jsx` - Admin interface

### Backend
- `server.js` - Express server, API endpoints
- `services/studentService.js` - Business logic
- `services/mockData.js` - Mock data

## Startup Flow

### Development Mode
```bash
npm run dev
```

Starts:
- Backend on port 3000
- Frontend on port 5173
- Vite proxies /api requests to backend

### Request Flow
```
Browser (5173)
    ↓
Vite dev server
    ↓ (proxy /api)
Express server (3000)
    ↓
Services layer
    ↓
Data
```

## Dependencies

### Root
- express - Backend server
- bcryptjs - Password hashing
- mongoose - MongoDB ODM (optional)

### Frontend
- react - UI library
- react-dom - DOM rendering
- react-router-dom - Client-side routing
- vite - Build tool

## Route Protection

Access to protected pages is controlled by PrivateRoute component, which checks sessionStorage for user role.

## Important Notes

- Frontend port: 5173
- Backend port: 3000
- All API calls use relative paths (proxied by Vite)
- Session-based authentication

---

Version: 2.0.0 (React)
Status: Production Ready
