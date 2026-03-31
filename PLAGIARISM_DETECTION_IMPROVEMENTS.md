# 🔍 Plagiarism Detection Improvements

## Overview
Enhanced plagiarism detection system to properly detect suspicious content including URLs in project descriptions (like "google.com") and other plagiarism indicators.

---

## ✅ Improvements Made

### 1. **Automatic Plagiarism Check on Project Creation**
- **Status**: ✅ Implemented
- **Location**: `backend/routes/projects.js`
- **Behavior**: Automatically runs plagiarism check when a project is created
- **Async**: Runs in background, doesn't block project creation response

### 2. **URL Detection in Descriptions**
- **Status**: ✅ Implemented
- **Detection**: Detects URLs like "google.com", "facebook.com", etc. in project descriptions
- **Flagging**: URLs in descriptions are flagged as suspicious/plagiarized content
- **Common Domains**: Detects common websites (Google, Facebook, YouTube, etc.)
- **Scoring**: 
  - Common domains: 60+ similarity score (high suspicion)
  - Other URLs: 30+ similarity score (moderate suspicion)

### 3. **Suspicious Pattern Detection**
- **Status**: ✅ Implemented
- **Patterns Detected**:
  - URLs in description (major flag)
  - Very short descriptions (< 100 chars)
  - Generic phrases ("lorem ipsum", "coming soon", etc.)
  - Excessive word repetition
- **Scoring System**:
  - URLs: +30 to +60 points
  - Short description: +20 points
  - Generic phrases: +15 points
  - Word repetition: +10 points
- **Threshold**: 50+ points = flagged as plagiarized

### 4. **Enhanced AI Detection**
- **Status**: ✅ Improved
- **Gemini AI**: Enhanced prompts to specifically detect URLs
- **Instructions**: AI is explicitly told to flag URLs and common websites
- **Threshold**: Lowered from 70% to 60% for better detection
- **Flags**: AI returns specific flags for issues found

### 5. **Improved Basic Detection (Fallback)**
- **Status**: ✅ Enhanced
- **URL Detection**: Checks for URLs even in fallback mode
- **Common Domains**: Specifically checks for common websites
- **Scoring**: Adjusts similarity score based on URL detection
- **Threshold**: Lowered to 60% for better detection

### 6. **Flags Storage**
- **Status**: ✅ Added
- **Database**: Added `flags` array to `plagiarismCheck` in Project model
- **Storage**: Stores specific issues detected (e.g., "URLs detected", "Common website URLs found")
- **Display**: Flags are shown in project details and admin dashboard

### 7. **Frontend Display**
- **Status**: ✅ Enhanced
- **Project Details**: Shows plagiarism flags and issues
- **Admin Dashboard**: Displays plagiarism status with flags
- **Visual Indicators**: Red badges for plagiarized content

---

## 🔍 How It Works

### Detection Flow:

1. **Project Creation**:
   ```
   User creates project → Automatic plagiarism check runs
   ```

2. **Pattern Detection** (First Check):
   ```
   Check for suspicious patterns:
   - URLs in description? → Flag as plagiarized
   - Common websites mentioned? → High suspicion
   - Generic phrases? → Moderate suspicion
   ```

3. **AI/Similarity Check** (Second Check):
   ```
   Compare with existing projects:
   - AI analysis (if Gemini available)
   - Text similarity (fallback)
   - Find similar projects
   ```

4. **Result Storage**:
   ```
   Save to database:
   - isPlagiarized: true/false
   - similarityScore: 0-100
   - flags: ["URLs detected", ...]
   - similarProjects: [...]
   ```

---

## 📊 Detection Examples

### Example 1: URL in Description
**Input:**
```
Title: "My Project"
Description: "This is a great project. Check out google.com for more info."
```

**Detection:**
- ✅ URL detected: "google.com"
- ✅ Common domain detected
- **Result**: `isPlagiarized: true`, `similarityScore: 75`, `flags: ["Common website URLs detected: google.com"]`

### Example 2: Multiple URLs
**Input:**
```
Description: "Visit facebook.com and youtube.com to learn more."
```

**Detection:**
- ✅ Multiple URLs detected
- ✅ Common domains: facebook.com, youtube.com
- **Result**: `isPlagiarized: true`, `similarityScore: 80`, `flags: ["Common website URLs detected: facebook.com, youtube.com"]`

### Example 3: Generic Content
**Input:**
```
Description: "Lorem ipsum dolor sit amet. Coming soon. Under construction."
```

**Detection:**
- ✅ Generic phrases detected
- ✅ Short description
- **Result**: `isPlagiarized: true`, `similarityScore: 35`, `flags: ["Found generic phrases: coming soon, under construction", "Description is too short"]`

---

## 🎯 Detection Rules

### URLs Detection:
- **Pattern**: `(https?://)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(/[^\s]*)?`
- **Common Domains**: google.com, facebook.com, youtube.com, twitter.com, instagram.com, linkedin.com, github.com, stackoverflow.com, wikipedia.org
- **Scoring**:
  - Common domain: +60 points (high suspicion)
  - Other URL: +30 points (moderate suspicion)

### Similarity Thresholds:
- **AI Mode**: 60% similarity = plagiarized
- **Basic Mode**: 60% similarity = plagiarized
- **Pattern Detection**: 50+ points = plagiarized

### Flags Generated:
- `"Common website URLs detected: [domains]"`
- `"URLs detected in description: X URL(s)"`
- `"Description is too short (less than 100 characters)"`
- `"Found generic phrases: [phrases]"`
- `"Excessive word repetition detected"`

---

## 🔧 API Endpoints

### Automatic Check (on creation):
- **Route**: `POST /api/projects`
- **Behavior**: Automatically runs plagiarism check
- **Response**: Project created (plagiarism check runs async)

### Manual Check:
- **Route**: `POST /api/plagiarism/check`
- **Body**: `{ projectId, title, description }`
- **Response**: Plagiarism check results with flags

### Get Results:
- **Route**: `GET /api/plagiarism/project/:projectId`
- **Response**: Plagiarism check status, score, flags, similar projects

---

## 📱 Frontend Display

### Project Details Page:
- Shows plagiarism status badge
- Displays similarity score
- Lists detected flags
- Shows similar projects (if any)

### Admin Dashboard:
- Shows plagiarism status for all projects
- Displays flags in project list
- Can trigger manual plagiarism check

---

## ⚙️ Configuration

### Environment Variables:
```env
GEMINI_API_KEY=your-gemini-api-key  # For AI-powered detection
```

### Thresholds (in code):
- **URL Detection**: Automatic flagging
- **Similarity Threshold**: 60% (configurable)
- **Pattern Score Threshold**: 50 points

---

## 🚀 Usage

### Creating a Project:
```javascript
// Automatically checks for plagiarism
POST /api/projects
{
  "title": "My Project",
  "description": "This is my project. Check google.com",
  ...
}
// Response includes plagiarism check results
```

### Manual Check:
```javascript
POST /api/plagiarism/check
{
  "projectId": "...",
  "title": "...",
  "description": "..."
}
```

---

## ✅ Test Cases

### Test 1: URL Detection
- **Input**: Description with "google.com"
- **Expected**: `isPlagiarized: true`, flags include URL

### Test 2: Common Domain
- **Input**: Description with "facebook.com"
- **Expected**: High similarity score (75+), flagged

### Test 3: Multiple URLs
- **Input**: Description with multiple URLs
- **Expected**: All URLs detected, high score

### Test 4: Generic Content
- **Input**: "Lorem ipsum" or "Coming soon"
- **Expected**: Flagged as suspicious

---

## 📈 Performance

- **Async Processing**: Plagiarism check doesn't block project creation
- **Efficient**: Limits comparison to first 20 projects for AI mode
- **Fast**: Pattern detection runs first (fast), then similarity check

---

## 🔮 Future Enhancements

- [ ] Web scraping to verify if URLs are actually copied content
- [ ] Machine learning model for better detection
- [ ] Integration with external plagiarism APIs
- [ ] Real-time checking as user types
- [ ] Batch checking for multiple projects

---

**Status**: ✅ Complete - Enhanced plagiarism detection with URL detection and suspicious pattern recognition!

