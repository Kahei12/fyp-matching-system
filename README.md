# FYP Matching System

A web-based system for managing Final Year Project (FYP) allocations at Hong Kong Metropolitan University (HKMU). The system facilitates the matching process between students and supervisors, supporting both student-initiated project proposals and teacher-proposed projects.

## System Overview

The system operates across three phases:

1. **Proposal Phase** - Students submit self-proposed project topics
2. **Matching Phase** - Students select and rank preferred projects from the teacher project catalog
3. **Clearing Phase** - Results are published and students view their assignments

## Technology Stack

- **Frontend**: React 18 with Vite
- **Backend**: Node.js with Express
- **Database**: MongoDB (MongoDB Atlas for production)
- **Authentication**: Session-based authentication
- **Routing**: React Router v6

## Project Structure

```
FYP Matching System/
|-- client/                      # React frontend application
|   |-- src/
|   |   |-- components/
|   |   |   |-- Admin/           # Admin portal components
|   |   |   |-- Student/         # Student portal components
|   |   |   |-- Teacher/         # Teacher portal components
|   |   |   |-- common/          # Shared components
|   |   |-- pages/               # Page-level components
|   |   |-- utils/               # Utility functions
|   |   |-- constants/           # Application constants
|   |-- package.json
|-- config/                      # Configuration files
|-- data/                        # Local data storage
|-- models/                      # MongoDB schemas
|-- scripts/                     # Utility scripts
|-- services/                    # Backend service layer
|-- server.js                    # Express server entry point
|-- package.json
```

## Installation

### Prerequisites

- Node.js 18 or higher
- MongoDB Atlas account (for production)

### Setup

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..

# Configure environment
# Create .env file with MongoDB connection string
cp .env.example .env
```

### Running the Application

```bash
# Start both frontend and backend
npm run dev

# Start backend only
npm run server:dev

# Start frontend only
npm run client
```

The application will be available at http://localhost:5173

## User Roles and Portals

### Student Portal

The student portal provides the following functionality:

- **Self-Proposal**: Submit original project topics for consideration
- **Project Browsing**: View available projects from the teacher catalog, with search and filter by major
- **Preference Management**: Select up to 10 preferred projects and arrange them in order of priority
- **Results View**: Check final project assignments after matching completes

Students can manage their preferences throughout the matching phase until the deadline expires. Preferences are locked after submission.

### Teacher Portal

The teacher portal supports the following features:

- **Student Proposal Review**: Review and approve or reject student-submitted project proposals
- **Project Management**: Create, edit, and delete own project proposals
- **Student Information**: View students assigned to supervised projects
- **Matching Results**: View the final matching outcomes

Teachers can manage their projects within the configured deadlines.

### Admin Portal

The admin portal provides administrative controls:

- **Matching Control**: Execute the matching algorithm and view statistics
- **Project Management**: Approve or reject all project proposals, view project catalog
- **Deadline Management**: Configure system-wide deadlines for each phase
- **Account Management**: Create student and teacher accounts individually or via batch import
- **Final Assignment**: Manually assign unassigned students and override automated results
- **Data Export**: Export matching results, student lists, and project data

## Matching Algorithm

The system implements a Gale-Shapley stable matching algorithm adapted for project allocation:

- Students rank projects in order of preference
- Projects have capacity limits (typically 2 students)
- When a project receives more applications than its capacity, the highest-GPA students are prioritized
- The algorithm iterates until all students are assigned or no more projects are available

Admin can trigger matching manually from the Matching Control panel.

## API Endpoints

### Authentication
- `POST /login` - User authentication
- `POST /api/change-password` - Change user password

### Student APIs
- `GET /api/student/:id` - Get student information
- `GET /api/student/projects` - Get available projects
- `GET /api/student/:id/preferences` - Get student preferences
- `POST /api/student/:id/preferences/set` - Set preferences
- `POST /api/student/:id/preferences/submit` - Submit preferences
- `POST /api/student/proposal` - Submit project proposal

### Teacher APIs
- `GET /api/teachers/:email` - Get teacher information
- `GET /api/teacher/projects` - Get teacher's projects
- `POST /api/teacher/projects` - Create project
- `PUT /api/teacher/projects/:projectId` - Update project
- `DELETE /api/teacher/projects/:projectId` - Delete project
- `GET /api/teacher/student-proposals` - Get student proposals to review
- `PUT /api/proposals/:proposalId/status` - Approve/reject proposal

### Admin APIs
- `GET /api/admin/deadlines` - Get system deadlines
- `PUT /api/admin/deadlines` - Update deadlines
- `GET /api/admin/all-projects` - Get all projects
- `GET /api/admin/students` - Get all students
- `POST /api/admin/students/create` - Create student account
- `POST /api/admin/students/batch-create` - Batch create students
- `POST /api/admin/teachers/batch-create` - Batch create teachers
- `POST /api/match/run` - Run matching algorithm
- `GET /api/match/results` - Get matching results
- `POST /api/admin/reset` - Reset system state
- `GET /api/export/*` - Data export endpoints

### Matching APIs
- `POST /api/match/run` - Execute matching algorithm
- `GET /api/match/results` - Retrieve matching results

## Data Models

### Student
- studentId, email, password, name
- major (ECE/CCS), year, gpa
- preferences array
- preferencesSubmitted flag
- assignedProject reference

### Project
- title, description, supervisor
- type (student/teacher)
- major requirement
- capacity
- status (active/approved/under review/rejected)

### Teacher
- teacherId, email, name
- major specialization
- assigned projects

### SystemSettings
- deadlines configuration
- matchingCompleted flag
- currentPhase

## Deployment

### Environment Variables

Create a `.env` file:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.xxxxxx.mongodb.net/fyp-matching
PORT=3000
```

### Build for Production

```bash
npm run build
```

The compiled frontend will be in `client/dist/`.

### Production Server

```bash
npm start
```

## Test Accounts

Default accounts created during database seeding:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hkmu.edu.hk | admin123 |
| Student | s001@hkmu.edu.hk | 00000000 |
| Teacher | t001@hkmu.edu.hk | 00000001 |

For accounts created via Admin panel, the default password is `Changeme123!` and users are required to change it upon first login.

## Features

- Role-based access control (Admin, Student, Teacher)
- Phase-based workflow with configurable deadlines
- Real-time deadline tracking and notifications
- Project popularity tracking
- Major-based filtering (ECE, CCS)
- GPA-based priority in matching
- CSV batch import for account creation
- Export functionality for reports
- Manual assignment override for edge cases

## Development Notes

- Frontend dev server runs on port 5173
- Backend API runs on port 3000
- Vite proxy forwards `/api` requests to the backend
- MongoDB connection is required for full functionality
- Local file fallback (`data/deadlines.json`) is available when database is unavailable
