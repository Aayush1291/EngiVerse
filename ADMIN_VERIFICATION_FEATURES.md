# 🔐 Admin & Verification Features

## Overview
Comprehensive admin system with full "god view" access, project verification, and enhanced profile verification to ensure only genuine people are on the platform.

---

## 🚫 Admin Signup Restriction

### Backend Protection:
- **Route**: `POST /api/auth/signup`
- **Restriction**: Admin role cannot be selected during signup
- **Error Message**: "Admin signup is not allowed. Please contact an existing admin."

### Frontend Update:
- Removed "Admin" option from signup form dropdown
- Added informational message: "Admin accounts can only be created by existing administrators"

### Admin Creation:
- **Route**: `POST /api/admin/users/create-admin` (Admin only)
- Only existing admins can create new admin accounts
- New admins are auto-verified (email and profile)

---

## ✅ Project Verification System

### Features:
- **Manual Verification**: Admins can verify/unverify projects
- **Auto-Verification**: System can auto-verify projects meeting criteria
- **Verification Checks**: Comprehensive scoring system
- **Verification Status**: Tracked in database

### Verification Criteria (Score ≥70 required):
- ✅ Plagiarism check passed (20 points)
- ✅ Has live URL (15 points)
- ✅ Has GitHub repository (15 points)
- ✅ Has documentation (10 points)
- ✅ Has demo video (10 points)
- ✅ Health score ≥70 (15 points)
- ✅ Owner profile verified (10 points)
- ✅ Owner email verified (5 points)
- ✅ Sufficient description (5 points)
- ✅ Tech stack specified (3 points)
- ✅ Progress updates (2 points)

### API Endpoints:
- `POST /api/admin/projects/:projectId/verify` - Verify/unverify project
- `GET /api/admin/projects/:projectId/verification` - Check verification status
- `POST /api/admin/projects/:projectId/auto-verify` - Auto-verify if criteria met
- `GET /api/admin/projects/unverified` - Get all unverified projects

### Database Schema:
```javascript
verification: {
  verified: Boolean,
  verifiedAt: Date,
  verifiedBy: ObjectId (ref: User),
  notes: String,
  checks: {
    plagiarismChecked: Boolean,
    plagiarismScore: Number,
    hasLiveUrl: Boolean,
    hasGithubRepo: Boolean,
    hasDocumentation: Boolean,
    hasDemoVideo: Boolean,
    healthScore: Number,
    ownerVerified: Boolean
  }
}
```

---

## 👤 Enhanced Profile Verification

### Features:
- **Multi-Factor Risk Analysis**: Comprehensive fake profile detection
- **Risk Scoring**: 0-100 risk score with detailed reasons
- **Admin Verification**: Admins can manually verify profiles
- **Auto-Detection**: System flags risky profiles automatically

### Risk Factors:
1. Email not verified (+30 points)
2. Low profile completion <50% (+20 points)
3. Suspicious email patterns (+25 points)
4. Very short name/bio (+10 each)
5. Missing LinkedIn for Mentors/Investors (+15)
6. Inactive account >7 days (+15)
7. Duplicate profiles (+20)
8. Invalid URLs (+10 each)
9. Excessive skills >50 (+15)

**Threshold**: Risk score ≥50 flagged as potentially fake

### API Endpoints:
- `POST /api/admin/users/:userId/verify-profile` - Verify/unverify user profile
- `GET /api/admin/users/:userId/profile-risk` - Check user risk score
- `GET /api/admin/users/unverified` - Get all unverified users

---

## 🎛️ Admin Dashboard - Full God View

### Overview Tab:
- **Total Statistics**: Users, projects, collaborations, bookmarks
- **Verification Stats**: Verified vs unverified counts
- **Issue Tracking**: Plagiarized projects, risky users
- **Quick Actions**: Direct links to review sections

### Projects Tab:
- View all projects
- See verification status
- See plagiarism status
- Quick actions: Manage, View, Delete

### Users Tab:
- View all users
- See verification status
- See email verification status
- Quick actions: Manage, Delete

### Verification Tab:
- List all unverified projects
- Quick verify buttons
- Review project details
- Add verification notes

### Plagiarism Tab:
- List all plagiarized projects
- Similarity scores
- Re-check plagiarism
- Delete plagiarized projects

### Risky Users Tab:
- List users with risk score ≥50
- Risk reasons displayed
- Flag or delete risky users
- Profile verification actions

---

## 🔧 Admin API Routes

### User Management:
- `GET /api/admin/users` - Get all users (with filters)
- `GET /api/admin/users/:userId` - Get user details
- `PUT /api/admin/users/:userId/role` - Update user role
- `DELETE /api/admin/users/:userId` - Delete user
- `POST /api/admin/users/create-admin` - Create admin user
- `GET /api/admin/users/unverified` - Get unverified users
- `POST /api/admin/users/:userId/verify-profile` - Verify user profile
- `GET /api/admin/users/:userId/profile-risk` - Check user risk

### Project Management:
- `GET /api/admin/projects` - Get all projects (with filters)
- `DELETE /api/admin/projects/:projectId` - Delete project
- `POST /api/admin/projects/:projectId/verify` - Verify project
- `GET /api/admin/projects/:projectId/verification` - Check verification
- `POST /api/admin/projects/:projectId/auto-verify` - Auto-verify
- `GET /api/admin/projects/unverified` - Get unverified projects
- `POST /api/admin/projects/:projectId/check-plagiarism` - Check plagiarism
- `GET /api/admin/projects/plagiarized` - Get plagiarized projects

### Dashboard & Statistics:
- `GET /api/admin/dashboard` - Full dashboard data (god view)
- `GET /api/admin/statistics` - Comprehensive statistics

---

## 📊 Dashboard Statistics

### User Statistics:
- Total users
- Verified users
- Email verified users
- Users by role

### Project Statistics:
- Total projects
- Verified projects
- Projects by status
- Projects by domain

### Collaboration Statistics:
- Total requests
- Pending requests
- Accepted requests

### Issue Tracking:
- Abandoned projects count
- Unverified projects count
- Plagiarized projects count
- Risky users count

---

## 🛡️ Security Features

### Admin Access Control:
- ✅ Only admins can access admin routes
- ✅ Admin signup completely blocked
- ✅ Only admins can create other admins
- ✅ All admin actions logged (via verifiedBy fields)

### Verification Security:
- ✅ Projects require verification before being trusted
- ✅ Users flagged if risk score too high
- ✅ Plagiarism automatically checked
- ✅ Fake profiles detected and flagged

---

## 🎯 Usage Workflow

### For Admins:

1. **Daily Review**:
   - Check dashboard overview
   - Review unverified projects
   - Check for plagiarized content
   - Review risky users

2. **Project Verification**:
   - Review project details
   - Check verification criteria
   - Add verification notes
   - Approve or reject

3. **User Management**:
   - Review user profiles
   - Check risk scores
   - Verify legitimate users
   - Flag or delete fake profiles

4. **Content Moderation**:
   - Check plagiarism reports
   - Review flagged projects
   - Delete plagiarized content
   - Maintain platform quality

---

## Benefits

1. **Quality Control**: Only verified, genuine projects and users
2. **Trust & Safety**: Fake profiles and plagiarized content detected
3. **Full Control**: Admins have complete system oversight
4. **Automated Detection**: System flags issues automatically
5. **Comprehensive View**: All system data accessible to admins

---

## 🔮 Future Enhancements

- Automated email notifications for admins
- Bulk verification actions
- Advanced analytics and reporting
- Audit logs for all admin actions
- Integration with external verification services
- Machine learning for better fake profile detection

---

**Status**: ✅ Complete - Full admin control and verification system implemented!

