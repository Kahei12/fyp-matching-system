# Quick Start Guide

## Get Started

### 1. Start the Application

```bash
npm run dev
```

This starts:
- Backend server at http://localhost:3000
- Frontend dev server at http://localhost:5173

### 2. Open in Browser

Go to: http://localhost:5173

### 3. Test Login

Use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hkmu.edu.hk | admin123 |
| Student | student@hkmu.edu.hk | student123 |
| Teacher | teacher@hkmu.edu.hk | teacher123 |

---

## Test Features

### Student
1. Login
2. View dashboard
3. Browse projects
4. Use search and filter
5. Add up to 5 preferences
6. Manage preference order
7. Submit preferences
8. View profile

### Admin
1. Login
2. Review projects (approve/reject)
3. View matching statistics
4. Run matching algorithm
5. Manage unassigned students
6. Set deadlines

---

## Development Tips

### Start Separately

```bash
# Backend only
npm run server:dev

# Frontend only
npm run client
```

### Stop Server
Press Ctrl+C

### After Code Changes
- Frontend changes refresh automatically
- Backend changes restart automatically

---

## Important Files

```
client/src/
├── pages/
│   ├── Login.jsx
│   ├── Student.jsx
│   └── Admin.jsx
├── components/
│   ├── PrivateRoute.jsx
│   └── Student/
└── App.jsx
```

---

## Checklist

- React project structure
- All pages converted to React
- Routing configured
- API proxy set up
- All features working
- All styles preserved
- Startup scripts ready

---

Your app is now running on React.

For details, see README-REACT.md
