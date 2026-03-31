# ENGIVERSE - Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

---

## 📦 Backend Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/engiverse
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
```

**For MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/engiverse?retryWrites=true&w=majority
```

**Generate Strong Secrets (Production):**
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. Start MongoDB
**Local MongoDB:**
```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### 4. Seed Database (Optional but Recommended)
```bash
npm run seed
```

This creates:
- 5 Students
- 3 Mentors
- 2 Investors
- 1 Admin
- 14 Projects
- Collaboration requests
- Bookmarks

**Test Accounts:**
- Student: `student1@engiverse.com` / `password123`
- Mentor: `mentor1@engiverse.com` / `password123`
- Investor: `investor1@engiverse.com` / `password123`
- Admin: `admin@engiverse.com` / `password123`

### 5. Start Backend Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Backend runs on: `http://localhost:5000`

---

## 🎨 Frontend Setup

### 1. Navigate to Frontend
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

**For Production:**
```env
VITE_API_URL=https://api.engiverse.com/api
```

### 4. Start Frontend Development Server
```bash
npm run dev
# or
npm start
```

Frontend runs on: `http://localhost:3000`

---

## 🏃 Running Both Servers

### Option 1: Two Terminals
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Option 2: Concurrent (if installed)
```bash
npm install -g concurrently
concurrently "npm run dev" "cd frontend && npm run dev"
```

---

## ✅ Verification Checklist

### Backend
- [ ] MongoDB is running
- [ ] `.env` file created with all variables
- [ ] `npm install` completed
- [ ] Server starts on port 5000
- [ ] API health check: `http://localhost:5000/api` returns JSON

### Frontend
- [ ] `frontend/.env` file created
- [ ] `npm install` completed in frontend directory
- [ ] Vite dev server starts on port 3000
- [ ] Can access `http://localhost:3000`

### Database
- [ ] MongoDB connection successful (check backend logs)
- [ ] Seed data loaded (optional): `npm run seed`

---

## 🧪 Testing the Application

### 1. Sign Up
- Go to `http://localhost:3000/signup`
- Create account with any role (Student, Mentor, Investor, Admin)
- Complete profile setup

### 2. Login
- Use seeded accounts or your new account
- Should redirect to appropriate dashboard

### 3. Test Features by Role

**Student:**
- Create a project
- Browse projects
- Request collaboration
- Add progress updates

**Mentor:**
- View assigned projects
- Add feedback
- Approve milestones

**Investor:**
- Browse projects
- Bookmark projects
- View traction metrics

**Admin:**
- View dashboard stats
- Manage users
- Flag abandoned projects

---

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
```
Error: MongoDB connection error
```
- Check if MongoDB is running
- Verify `MONGODB_URI` in `.env`
- For Atlas: Check network access and credentials

**Port Already in Use:**
```
Error: listen EADDRINUSE: address already in use :::5000
```
- Change `PORT` in `.env` or kill process using port 5000

**JWT Errors:**
- Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
- Use strong, unique secrets in production

### Frontend Issues

**API Connection Error:**
- Check `VITE_API_URL` in `frontend/.env`
- Ensure backend is running
- Check CORS settings in backend

**Vite Build Errors:**
- Clear cache: `rm -rf node_modules/.vite`
- Reinstall: `rm -rf node_modules && npm install`

**Module Not Found:**
- Run `npm install` in frontend directory
- Check all imports use correct extensions (.jsx)

---

## 📦 Production Build

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Use strong JWT secrets
3. Use production MongoDB (Atlas recommended)
4. Enable HTTPS
5. Configure CORS for production domain

### Frontend
```bash
cd frontend
npm run build
```

Output: `frontend/dist/` directory

Serve with:
- Nginx
- Apache
- Vercel
- Netlify
- Any static file server

---

## 🔒 Security Checklist

- [ ] Strong JWT secrets (32+ characters, random)
- [ ] MongoDB credentials secured
- [ ] CORS configured for production domain only
- [ ] Environment variables not committed to git
- [ ] HTTPS enabled in production
- [ ] Password validation enforced
- [ ] Rate limiting (consider adding)
- [ ] Input validation on all endpoints

---

## 📚 API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://api.engiverse.com/api`

### Authentication
All protected routes require JWT token in header:
```
Authorization: Bearer <token>
```

### Key Endpoints

**Auth:**
- `POST /api/auth/signup` - Sign up
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

**Projects:**
- `GET /api/projects` - List all projects (with filters)
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project (Student only)
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/progress` - Add progress update

**Collaborations:**
- `POST /api/collaborations/request` - Request collaboration
- `GET /api/collaborations/my-requests` - Get my requests
- `POST /api/collaborations/:id/accept` - Accept request
- `POST /api/collaborations/:id/reject` - Reject request

**Health Analysis:**
- `GET /api/health/project/:id` - Analyze project health

See `README.md` for complete API documentation.

---

## 🎯 Hackathon Tips

1. **Demo Preparation:**
   - Seed database with interesting projects
   - Prepare demo accounts for each role
   - Test all major flows before presentation

2. **Showcase Features:**
   - Role-based dashboards
   - Project collaboration flow
   - AI health analysis
   - Real-time progress tracking

3. **Performance:**
   - Use seed data for quick demos
   - Ensure fast page loads
   - Test on different screen sizes

4. **Documentation:**
   - Keep README updated
   - Document any custom features
   - Include screenshots if possible

---

## 📞 Support

For issues:
1. Check this setup guide
2. Review error messages in console
3. Verify all environment variables
4. Check MongoDB connection
5. Review API responses in browser DevTools

---

## 🎉 You're All Set!

Your ENGIVERSE platform is ready. Good luck with your hackathon! 🚀

