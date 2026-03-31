# 👨‍🏫 Mentor & Investment Features

## Overview
Complete implementation of mentor request system and investment request system with proper role restrictions.

---

## ✅ Features Implemented

### 1. **Mentor Request System**
- **Status**: ✅ Complete
- **Models**: `MentorRequest` model created
- **Functionality**:
  - Students can request mentors for their projects
  - Mentors can accept/reject mentor requests
  - Mentors can self-assign to projects
  - Only one mentor per project
  - Automatic rejection of other pending requests when one is accepted

### 2. **Investor Restrictions**
- **Status**: ✅ Complete
- **Restriction**: Investors CANNOT collaborate on projects
- **Error Message**: "Investors cannot collaborate on projects. They can only invest."
- **Location**: `backend/routes/collaborations.js`

### 3. **Investment Request System**
- **Status**: ✅ Complete
- **Models**: `InvestmentRequest` model created
- **Functionality**:
  - Investors can request investment (contact project owners)
  - Project owners can request investment from investors
  - Investment requests with messages and optional amounts
  - Accept/Reject investment requests
  - Status tracking (Pending, Accepted, Rejected, Negotiating)

### 4. **Automatic AI Verification**
- **Status**: ✅ Already Implemented
- **Location**: `backend/routes/projects.js`
- **Behavior**: Automatically runs AI verification when project is created
- **Async**: Runs in background, doesn't block project creation

---

## 📋 API Endpoints

### Mentor Requests

#### Student Requests Mentor:
```
POST /api/mentor/request/:projectId
Body: {
  "mentorId": "mentor_user_id",
  "message": "Optional message"
}
Authorization: Student only
```

#### Get Mentor Requests for Project:
```
GET /api/mentor/requests/:projectId
Authorization: Project owner only
```

#### Mentor Accepts Request:
```
POST /api/mentor/request/:requestId/accept
Authorization: Mentor only (must be the requested mentor)
```

#### Mentor Rejects Request:
```
POST /api/mentor/request/:requestId/reject
Authorization: Mentor only (must be the requested mentor)
```

#### Mentor Self-Assigns:
```
POST /api/mentor/assign/:projectId
Authorization: Mentor only
```

#### Get Mentor Dashboard (with requests):
```
GET /api/mentor/dashboard
Authorization: Mentor only
Response: {
  projects: [...],
  mentorRequests: [...],
  stats: {
    totalProjects: number,
    activeProjects: number,
    completedProjects: number,
    pendingRequests: number
  }
}
```

### Investment Requests

#### Investor Requests Investment:
```
POST /api/investor/request-investment/:projectId
Body: {
  "message": "Investment proposal message",
  "investmentAmount": 10000 (optional)
}
Authorization: Investor only
```

#### Project Owner Requests Investment:
```
POST /api/investor/request/:investorId
Body: {
  "projectId": "project_id",
  "message": "Investment request message",
  "investmentAmount": 10000 (optional)
}
Authorization: Student only
```

#### Get Investment Requests (Project Owner):
```
GET /api/investor/investment-requests?type=sent|received
Authorization: Student only
```

#### Get Investment Requests (Investor):
```
GET /api/investor/my-investment-requests
Authorization: Investor only
```

#### Accept/Reject Investment Request:
```
POST /api/investor/investment-request/:requestId/accept
POST /api/investor/investment-request/:requestId/reject
Body: {
  "message": "Optional response message"
}
Authorization: Project owner only
```

---

## 🔒 Role Restrictions

### Investors:
- ❌ **CANNOT** collaborate on projects
- ✅ **CAN** request investment (contact project owners)
- ✅ **CAN** receive investment requests from project owners
- ✅ **CAN** bookmark projects
- ✅ **CAN** browse projects

### Students:
- ✅ **CAN** request mentors for their projects
- ✅ **CAN** request investment from investors
- ✅ **CAN** accept/reject investment requests
- ✅ **CAN** collaborate on projects (as collaborators)

### Mentors:
- ✅ **CAN** accept/reject mentor requests
- ✅ **CAN** self-assign to projects
- ✅ **CAN** provide feedback
- ✅ **CAN** approve milestones

### Admins:
- ❌ **CANNOT** collaborate on projects
- ❌ **CANNOT** be mentors
- ❌ **CANNOT** be investors
- ✅ **CAN** view all data (god view)

---

## 📊 Database Models

### MentorRequest:
```javascript
{
  project: ObjectId (ref: Project),
  requester: ObjectId (ref: User) - Project owner,
  mentor: ObjectId (ref: User) - Requested mentor,
  message: String,
  status: 'Pending' | 'Accepted' | 'Rejected',
  respondedAt: Date,
  createdAt: Date
}
```

### InvestmentRequest:
```javascript
{
  project: ObjectId (ref: Project),
  requester: ObjectId (ref: User) - Project owner or investor,
  investor: ObjectId (ref: User) - Investor,
  message: String,
  investmentAmount: Number (optional),
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Negotiating',
  respondedAt: Date,
  createdAt: Date
}
```

---

## 🔄 Workflows

### Mentor Request Workflow:
1. **Student creates project** → Project created
2. **Student requests mentor** → `POST /api/mentor/request/:projectId`
3. **Mentor receives request** → Shows in mentor dashboard
4. **Mentor accepts/rejects** → `POST /api/mentor/request/:requestId/accept`
5. **Mentor assigned** → Project.mentor updated
6. **Other requests rejected** → Automatically rejected

### Investment Request Workflow (Investor → Owner):
1. **Investor browses projects** → Finds interesting project
2. **Investor requests investment** → `POST /api/investor/request-investment/:projectId`
3. **Project owner receives request** → Shows in investment requests
4. **Owner accepts/rejects** → `POST /api/investor/investment-request/:requestId/accept`

### Investment Request Workflow (Owner → Investor):
1. **Student creates project** → Project created
2. **Student finds investor** → Browses investors or knows investor
3. **Student requests investment** → `POST /api/investor/request/:investorId`
4. **Investor receives request** → Shows in my-investment-requests
5. **Investor can respond** → (Future: accept/reject from investor side)

---

## ✅ Automatic AI Verification

### On Project Creation:
- **Trigger**: Automatically runs when project is created
- **Location**: `backend/routes/projects.js` (line 155-159)
- **Process**:
  1. Project saved to database
  2. Plagiarism check runs (async)
  3. AI verification runs (async)
  4. Both don't block project creation response

### Verification Includes:
- Plagiarism detection
- Content quality analysis
- Resource validation (URLs, GitHub, etc.)
- Owner verification status
- Project health score
- AI confidence score

---

## 🎯 Use Cases

### Use Case 1: Student Needs Mentor
```
1. Student creates project
2. Student browses available mentors
3. Student requests specific mentor
4. Mentor receives notification
5. Mentor accepts → Assigned to project
```

### Use Case 2: Investor Wants to Invest
```
1. Investor browses projects
2. Investor finds interesting project
3. Investor requests investment with message
4. Project owner receives request
5. Owner accepts → Investment connection established
```

### Use Case 3: Student Seeks Investment
```
1. Student creates project
2. Student identifies potential investor
3. Student requests investment from investor
4. Investor receives request
5. Investor can respond (future enhancement)
```

### Use Case 4: Investor Tries to Collaborate
```
1. Investor tries to request collaboration
2. System blocks: "Investors cannot collaborate on projects"
3. System suggests: "Use investment request feature instead"
```

---

## 🔧 Validation & Security

### Mentor Requests:
- ✅ Only project owner can request mentor
- ✅ Only requested mentor can accept/reject
- ✅ Only one mentor per project
- ✅ Mentor must have 'Mentor' role

### Investment Requests:
- ✅ Only investors can request investment
- ✅ Only project owners can accept/reject
- ✅ Investor must have 'Investor' role
- ✅ Project owner must have 'Student' role

### Collaboration Requests:
- ✅ Investors blocked from collaboration
- ✅ Admins blocked from collaboration
- ✅ Only students can collaborate

---

## 📱 Frontend Integration Points

### For Students:
- Request mentor button on project details
- View mentor requests status
- Request investment from investors
- View investment requests received

### For Mentors:
- Mentor dashboard with pending requests
- Accept/reject mentor requests
- Self-assign to projects
- View assigned projects

### For Investors:
- Request investment button on project details
- View investment requests sent/received
- Cannot see collaboration request button
- Investment-focused interface

---

## 🚀 Future Enhancements

- [ ] Email notifications for mentor/investment requests
- [ ] Real-time notifications (WebSocket)
- [ ] Investment negotiation chat
- [ ] Mentor matching algorithm
- [ ] Investment amount tracking
- [ ] Investment history
- [ ] Mentor rating system

---

**Status**: ✅ Complete - All mentor and investment features implemented with proper role restrictions!

