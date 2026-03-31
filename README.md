# ENGIVERSE - Engineering Project Collaboration Platform

A full-stack web application for engineering students, mentors, and investors to collaborate on innovative projects.

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication (access + refresh tokens)
- bcrypt for password hashing

### Frontend
- React.js with Vite
- Tailwind CSS
- React Router
- Context API
- Axios for API calls

## Features

### Authentication & Security
- User signup with role selection (Student, Mentor, Investor, Admin)
- Login/Logout functionality
- Forgot password flow
- JWT protected routes
- Role-based access control (RBAC)
- Password hashing with bcrypt

### Profile Management
- Complete profile setup after signup
- Edit profile information
- Skills management
- Profile completion percentage
- Public profile view

### Student Features
- Create, edit, and delete projects
- Publish projects
- Browse and search projects
- Request collaboration on projects
- Accept/reject collaboration requests
- Leave projects
- Add progress timeline updates
- View project health analysis

### Mentor Features
- Mentor dashboard
- View assigned projects
- Add feedback and comments
- Approve milestones
- Track project progress

### Investor Features
- Browse projects with filters
- View project traction metrics
- Bookmark projects
- Contact project owners

### Admin Features
- Admin dashboard with system metrics
- User management
- Project moderation
- Flag abandoned projects
- View system statistics

### AI Project Health Analysis
- Simulated AI analysis of project health
- Health score (0-100)
- Missing modules identification
- Suggested next steps

## Project Structure

```
engiverse/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── utils/           # Utility functions
│   └── scripts/         # Seed script
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React Context
│   │   └── utils/       # Utility functions
│   ├── index.html       # Vite entry HTML
│   └── vite.config.js   # Vite configuration
├── server.js            # Express server entry point
└── package.json         # Backend dependencies
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Install backend dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/engiverse
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
NODE_ENV=development
```

3. Start MongoDB (if running locally):
```bash
# On Windows
mongod

# On macOS/Linux
sudo systemctl start mongod
```

4. Seed the database (optional):
```bash
npm run seed
```

5. Start the backend server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install frontend dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the frontend development server:
```bash
npm run dev
# or
npm start
```

The frontend will run on `http://localhost:3000`

## Seed Data

The seed script creates the following test accounts:

- **Student 1**: student1@engiverse.com / password123
- **Student 2**: student2@engiverse.com / password123
- **Student 3**: student3@engiverse.com / password123
- **Student 4**: student4@engiverse.com / password123
- **Student 5**: student5@engiverse.com / password123
- **Mentor 1**: mentor1@engiverse.com / password123
- **Mentor 2**: mentor2@engiverse.com / password123
- **Mentor 3**: mentor3@engiverse.com / password123
- **Investor 1**: investor1@engiverse.com / password123
- **Investor 2**: investor2@engiverse.com / password123
- **Admin**: admin@engiverse.com / password123

It also creates 14 sample projects and collaboration requests.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User signup
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/refresh` - Refresh access token

### Profiles
- `GET /api/profiles/me` - Get own profile
- `PUT /api/profiles/me` - Update own profile
- `GET /api/profiles/:userId` - Get public profile

### Projects
- `GET /api/projects` - Get all projects (with filters)
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project (Student only)
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/publish` - Publish project
- `POST /api/projects/:id/progress` - Add progress update
- `POST /api/projects/:id/leave` - Leave project

### Collaborations
- `POST /api/collaborations/request` - Request collaboration
- `GET /api/collaborations/project/:projectId` - Get requests for project
- `GET /api/collaborations/my-requests` - Get my requests
- `POST /api/collaborations/:requestId/accept` - Accept request
- `POST /api/collaborations/:requestId/reject` - Reject request

### Mentor
- `GET /api/mentor/dashboard` - Mentor dashboard
- `POST /api/mentor/assign/:projectId` - Assign mentor
- `POST /api/mentor/:projectId/feedback` - Add feedback
- `POST /api/mentor/:projectId/approve-milestone` - Approve milestone
- `GET /api/mentor/:projectId/updates` - Get project updates

### Investor
- `GET /api/investor/projects` - Browse projects
- `GET /api/investor/projects/:id` - Get project details
- `POST /api/investor/bookmark/:projectId` - Bookmark project
- `DELETE /api/investor/bookmark/:projectId` - Remove bookmark
- `GET /api/investor/bookmarks` - Get bookmarks
- `POST /api/investor/contact/:projectId` - Contact owner

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:userId` - Get user details
- `PUT /api/admin/users/:userId/role` - Update user role
- `DELETE /api/admin/users/:userId` - Delete user
- `GET /api/admin/projects` - Get all projects
- `POST /api/admin/projects/:projectId/flag-abandoned` - Flag abandoned project
- `DELETE /api/admin/projects/:projectId` - Delete project

### Health Analysis
- `GET /api/health/project/:projectId` - Analyze project health

## Usage Guide

### For Students
1. Sign up with role "Student"
2. Complete your profile
3. Create projects or browse existing ones
4. Request collaboration on interesting projects
5. Manage your projects and collaborators
6. Add progress updates to your projects

### For Mentors
1. Sign up with role "Mentor"
2. Complete your profile
3. Browse projects and assign yourself as mentor
4. Provide feedback and approve milestones
5. Track project progress

### For Investors
1. Sign up with role "Investor"
2. Complete your profile
3. Browse projects with filters
4. Bookmark interesting projects
5. Contact project owners

### For Admins
1. Sign up with role "Admin"
2. Access admin dashboard
3. Manage users and projects
4. Monitor system metrics
5. Flag abandoned projects

## Production Deployment

### Backend
1. Set environment variables in production
2. Use a production MongoDB instance (MongoDB Atlas recommended)
3. Use strong JWT secrets
4. Enable HTTPS
5. Set up proper CORS configuration

### Frontend
1. Build the React app:
```bash
cd frontend
npm run build
```
2. Serve the `dist` folder using a static file server
3. Update API URL in production environment

## Development

### Running Both Servers
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Role-based access control prevents unauthorized access
- Input validation on both frontend and backend
- CORS configured for API security

## License

This project is created for educational purposes.

## Support

For issues or questions, please check the codebase or create an issue in the repository.
