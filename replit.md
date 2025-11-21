# Student Job Application Assistant

## Overview

A comprehensive web application designed to help students manage their job applications efficiently. The platform provides tools for profile management, document storage, digital signature creation, photo management, job discovery, and application tracking. Built with a focus on Indian government job recruitment portals (Central Government, PSUs, Banking, Defence, and State PSCs), the application aims to streamline the entire job application process for students.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Libraries**
- **React 18** with TypeScript for type-safe component development
- **Wouter** for client-side routing (lightweight alternative to React Router)
- **TanStack Query (React Query)** for server state management, data fetching, and caching
- **Vite** as the build tool and development server

**UI Component System**
- **shadcn/ui** components built on Radix UI primitives for accessible, composable UI elements
- **Tailwind CSS** for utility-first styling with custom design tokens
- **Material Design principles** with Linear-inspired refinement for clean, professional interfaces
- **Inter font** from Google Fonts for typography consistency
- Custom CSS variables system supporting light/dark themes

**State Management Pattern**
- Server state managed via React Query with aggressive caching (staleTime: Infinity)
- Local component state using React hooks
- Form state managed through React Hook Form with Zod validation
- No global client state management (Redux/Zustand) - relies on React Query cache

**Design System**
- Mobile-first responsive design with specific breakpoints (768px for mobile/desktop split)
- Consistent spacing units (4, 6, 8, 12, 16, 24)
- Grid-based layouts for cards and listings
- Sidebar navigation (persistent on desktop, overlay on mobile)
- Bottom navigation bar for mobile devices

### Backend Architecture

**Server Framework**
- **Express.js** with TypeScript for REST API endpoints
- Separate entry points for development (index-dev.ts with Vite middleware) and production (index-prod.ts with static file serving)
- Session-based approach indicated by session middleware setup

**API Design Pattern**
- RESTful endpoints organized by resource type:
  - `/api/profile` - Student profile CRUD operations
  - `/api/documents` - Document upload and management
  - `/api/signature` - Digital signature storage
  - `/api/jobs` - Job listings and search
  - `/api/applications` - Application tracking
- File uploads handled via Multer with memory storage (10MB limit)
- Files converted to base64 data URLs for storage

**Storage Strategy**
- **In-memory storage** (MemStorage class) currently implemented as development/prototype storage
- Interface-based storage abstraction (IStorage) allows for future database implementation
- Schema definitions in shared folder using Zod for validation
- Drizzle ORM configured for PostgreSQL migration path (Neon database provider)

### Data Storage Solutions

**Current Implementation**
- In-memory Maps for all entities (profiles, documents, signatures, jobs, applications)
- UUID-based primary keys using Node's crypto module
- Data persists only during server runtime

**Planned Database Migration**
- **PostgreSQL** via Neon serverless driver (@neondatabase/serverless)
- **Drizzle ORM** for type-safe database queries
- Migration files configured to output to ./migrations directory
- Schema definitions ready in shared/schema.ts with Zod validation

**Data Models**
- **StudentProfile**: Personal information, education, skills, experience, photo
- **Document**: File metadata with base64 URL storage
- **Signature**: Digital signature image storage
- **Job**: Job listings with search/filter capabilities
- **Application**: Application tracking with status workflow (pending → shortlisted → rejected/selected)

### Authentication & Authorization

**Current State**
- No authentication implemented (profile endpoints auto-create default profile)
- Session middleware configured (connect-pg-simple) but not actively used
- Single-user assumption (getDefaultProfile pattern)

**Future Considerations**
- Session store ready for PostgreSQL integration
- User authentication would require adding user ID context to all operations
- Profile-to-user relationship mapping needed

### External Dependencies

**Third-Party Services**

1. **OpenAI API**
   - Configured with API key from environment
   - Intended for AI-powered features (likely form auto-fill and job matching)
   - Not currently implemented in codebase

2. **Image Processing**
   - **Sharp** library for server-side image manipulation
   - Used for photo resizing and optimization (passport size, ID card, resume formats)

3. **Neon Database**
   - Serverless PostgreSQL provider
   - Connection via DATABASE_URL environment variable
   - Production-ready database solution

**Job Data Sources**
- Planned integration with 40+ official Indian government recruitment websites
- Categories: Central Government, PSUs, Banking, Defence, State PSCs
- Web scraping functionality mentioned but not implemented
- Examples: UPSC, SSC, Railway Recruitment Boards, IBPS, State PSC portals

**Development Tools**
- Replit-specific plugins for development environment
- Runtime error overlay for debugging
- Cartographer and dev banner for Replit integration

**UI Dependencies**
- Comprehensive Radix UI component primitives (30+ packages)
- Lucide React for iconography
- date-fns for date manipulation
- cmdk for command palette functionality

### Build & Deployment

**Development Mode**
- Vite dev server with HMR
- TypeScript checking with noEmit
- Express server with Vite middleware integration

**Production Build**
- Client: Vite build outputs to dist/public
- Server: esbuild bundles server code to dist/index.js (ESM format)
- Static file serving from dist/public
- Single production command: `node dist/index.js`

**Configuration Management**
- Environment variables for DATABASE_URL and OPENAI_API_KEY
- TypeScript path aliases for clean imports (@/, @shared/, @assets/)
- PostCSS with Tailwind and Autoprefixer