# Student Job Application Assistant - Supabase Serverless Architecture

## Overview

A comprehensive web application designed to help students manage their job applications efficiently. Built on **100% Supabase serverless architecture** with Supabase Edge Functions, Authentication, and PostgreSQL.

## Current Architecture (Serverless)

### Frontend
- **React 18** with TypeScript
- **Wouter** for routing
- **TanStack Query** for server state management
- **shadcn/ui** + **Tailwind CSS** for UI
- Vite for development and builds

### Backend (100% Serverless)
- **Supabase Edge Functions** (7 deployed functions):
  1. `job-scraper` - Scrapes government job portals with Gemini AI
  2. `ocr-extract` - Extracts data from documents via Gemini Vision API
  3. `job-tracker` - Tracks job applications (CRUD)
  4. `profile` - Manages user profiles (GET/POST/PATCH)
  5. `jobs-api` - Lists and searches jobs
  6. `documents-api` - Manages user documents
  7. `applications-api` - Manages user applications

### Authentication
- **Supabase Auth** with email/password signup and login
- JWT tokens stored in localStorage
- Row-level security (RLS) enabled on all database tables
- User data automatically isolated per user ID

### Database
- **Supabase PostgreSQL** with RLS policies
- Tables: jobs, applications, student_profiles, documents
- Automatic row-level security for data privacy

### External AI Services
- **Google Gemini 2.5 Flash** for job scraping and form auto-fill
- **Google Gemini Vision** for OCR document extraction

## Data Models

```
StudentProfile:
  - id (UUID)
  - user_id (UUID from Supabase Auth)
  - email, full_name, phone, DOB
  - address, education, skills, experience
  - photo_url
  - created_at, updated_at

Job:
  - id (UUID)
  - title, company, location
  - type, category, deadline
  - salary, description
  - created_at

Application:
  - id (UUID)
  - user_id (references auth)
  - job_id (references jobs)
  - status (pending/shortlisted/selected/rejected)
  - applied_at, updated_at

Document:
  - id (UUID)
  - user_id (references auth)
  - name, type, size
  - url (base64)
  - uploaded_at
```

## API Flow

```
User Interface (React)
        ↓
Query Client (TanStack React Query)
        ↓
Supabase Authentication (JWT Token)
        ↓
Supabase Edge Functions
        ↓
Supabase PostgreSQL + Gemini AI
```

## Features

✅ **User Authentication**
- Email/password signup and login via Supabase
- Session persistence in localStorage
- Automatic token refresh

✅ **Job Discovery**
- AI-powered scraping from 15+ government recruitment sites
- Automatic job updates every 5 minutes
- Job search and filtering by category, location, deadline

✅ **Document Management**
- Upload documents (PDFs, images)
- OCR extraction via Gemini Vision API
- Auto-fill profile from extracted data

✅ **Application Tracking**
- Track applications per job
- Status management (pending → shortlisted → result)
- Application history and statistics

✅ **Profile Management**
- Store personal information
- Upload photo and signature
- Education and work experience tracking

## File Structure

```
client/src/
├── pages/           # All pages (login, dashboard, jobs, etc)
├── components/      # Reusable UI components
├── hooks/          # Custom React hooks (useAuth, etc)
├── lib/            # Query client, utilities
└── index.css       # Tailwind + design system

server/
├── index-dev.ts    # Development server (serves frontend only)
├── app.ts          # Express app setup
└── vite.ts         # Vite middleware configuration

supabase/functions/ # All 7 edge functions deployed to Supabase
```

## Environment Variables

```
VITE_SUPABASE_URL=https://cvnalogvvfzapxmozdyh.supabase.co
VITE_SUPABASE_ANON_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=...
SESSION_SECRET=...
```

## Running Locally

```bash
npm run dev
```

- Starts Express development server on port 5000
- Vite handles frontend compilation with HMR
- All API calls route to Supabase edge functions
- No local database needed - everything persists to Supabase

## Deployment

The app is ready for production deployment:
1. Frontend builds to static files (Vite)
2. Express serves frontend HTML
3. All API calls go directly to Supabase
4. No database migrations needed - schema created via Supabase SQL editor

## User Preferences
- Simple, everyday language communication
- Corporate-style UI with larger buttons
- Login page as first experience for new users
