# Supabase Integration Setup Guide

## Overview
Your Student Job Application Assistant app is now ready to connect to Supabase for:
- **Authentication** - User signup/login with email & password
- **Database** - Persistent storage for profiles, documents, jobs, and applications
- **Multi-user Support** - Each user's data is isolated and secure

## Setup Steps

### 1. Create a Supabase Project
1. Go to https://supabase.com and sign up
2. Create a new project
3. Copy your credentials:
   - **Project URL** (SUPABASE_URL)
   - **Anon Public Key** (SUPABASE_ANON_KEY)

### 2. Set Environment Variables
Add these to your Replit Secrets (or `.env` file locally):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Create Supabase Tables
The app will auto-create tables on startup. Tables created:
- `student_profiles` - User profile data
- `documents` - Uploaded documents (PDFs, images)
- `jobs` - Job listings from government portals
- `applications` - Application tracking

### 4. Use the API

#### Sign Up (Create Account)
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

Response:
```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "session": { "access_token": "token...", "refresh_token": "..." }
}
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

#### Use Access Token
For authenticated requests, add the token to Authorization header:
```bash
curl -X GET http://localhost:5000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. How It Works

**Without Supabase Credentials:**
- App runs in "Demo Mode" using in-memory storage
- Data persists only during server runtime
- Single user experience

**With Supabase Credentials:**
- User authentication via Supabase Auth
- All data stored in Supabase PostgreSQL database
- Multi-user support - each user sees only their data
- Data persists permanently

### 6. Features Now Available

✅ **User Authentication**
- Email/password signup & login
- Session tokens for API requests
- Secure password hashing (handled by Supabase)

✅ **Data Isolation**
- Each user's profile is private
- Documents stored per user
- Applications tracked per user

✅ **AI Features (Continue to Work)**
- OCR extraction from documents
- Job scraping (stored globally for all users)
- Profile auto-fill from documents

✅ **Background Job Scheduler**
- Scrapes government sites every 5 minutes
- Jobs cached and available to all users

### 7. Frontend Integration (Next Steps)

You'll need to update the React frontend to:
1. Show login/signup page
2. Store access token in localStorage
3. Send token in Authorization header for all API requests
4. Handle token refresh when expired

Example implementation:
```typescript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { session } = await response.json();
localStorage.setItem('accessToken', session.access_token);

// Use token in requests
const profile = await fetch('/api/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});
```

### 8. API Endpoints

**Auth**
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

**Profile (requires auth token)**
- `GET /api/profile` - Get user profile
- `POST /api/profile` - Create profile
- `PATCH /api/profile/:id` - Update profile

**Documents (requires auth token)**
- `GET /api/documents/:studentId` - List documents
- `POST /api/documents/upload` - Upload document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/extract-ocr` - Extract data from document

**Jobs (public)**
- `GET /api/jobs` - Search jobs
- `POST /api/jobs/scrape-official` - Manual scrape trigger
- `GET /api/cache/jobs` - Get cached jobs
- `GET /api/cache/logs` - View scraping logs

**Applications (requires auth token)**
- `GET /api/applications/:studentId` - List applications
- `POST /api/applications` - Create application

## Troubleshooting

**"Authentication not configured"**
- Supabase credentials not set
- Add SUPABASE_URL and SUPABASE_ANON_KEY to environment

**"Invalid or expired token"**
- Token expired or invalid
- User needs to login again

**"Profile not found"**
- User has no profile yet
- POST to `/api/profile` to create one

## Security Notes

✅ **Secure by Default**
- Passwords hashed via Supabase
- Row-level security can be enabled in Supabase
- All user data isolated

🔒 **Recommended Enhancements**
- Enable Row Level Security (RLS) in Supabase
- Add email verification
- Implement refresh token rotation
- Add rate limiting to auth endpoints

## Support

For Supabase documentation: https://supabase.com/docs
For API reference: https://supabase.com/docs/reference/javascript
