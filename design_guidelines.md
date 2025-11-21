# Design Guidelines: Student Job Application Assistant

## Design Approach

**System: Material Design with Linear-inspired refinement**
- Rationale: Information-dense productivity tool requiring clarity, hierarchy, and mobile-first responsiveness
- Key principles: Functional clarity, efficient workflows, trust-building professionalism
- Reference inspiration: Linear (clean dashboards), Notion (data organization), modern SaaS productivity tools

## Typography System

**Font Family:** Inter via Google Fonts (single family for consistency)

**Hierarchy:**
- Page Titles: text-3xl md:text-4xl, font-bold
- Section Headers: text-2xl md:text-3xl, font-semibold  
- Card Titles: text-lg font-semibold
- Body Text: text-base, font-normal
- Supporting Text: text-sm, font-normal
- Captions/Labels: text-xs, font-medium uppercase tracking-wide

## Layout System

**Spacing Units:** Consistent use of 4, 6, 8, 12, 16, 24 (p-4, gap-6, space-y-8, py-12, my-16, py-24)

**Containers:**
- Dashboard/App Shell: max-w-7xl mx-auto
- Form Containers: max-w-2xl
- Content Cards: Full width within grid constraints

**Grid Patterns:**
- Job Listings: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Dashboard Stats: grid-cols-2 md:grid-cols-4
- Application History: Single column table on mobile, full table on desktop

## Component Library

### Navigation
- Side navigation drawer (mobile: overlay, desktop: persistent left sidebar, w-64)
- Top bar with student profile avatar, notifications bell icon, app title
- Navigation items with icons from Heroicons (outline style)

### Dashboard Components
- **Stats Cards:** Rounded borders (rounded-lg), shadow-sm, padding p-6, icon + number + label layout
- **Quick Actions:** Large touch-friendly buttons (min-h-12), full width on mobile, grid on desktop
- **Timeline/Activity Feed:** Vertical timeline with dots, date labels, status badges

### Forms & Data Entry
- **Input Fields:** Generous padding (px-4 py-3), rounded-md borders, clear labels above inputs
- **File Upload Zones:** Dashed border, drag-drop area with icon, min-h-32, click-to-upload button
- **Signature Canvas:** Fixed aspect ratio (16:9), border, clear/undo controls below canvas
- **Photo Cropper:** Modal overlay with cropping UI, preset dimension buttons (passport, ID card sizes)

### Job Listing Cards
- Compact card design: rounded-lg, border, p-6
- Header: Company logo (if available) + job title
- Body: Snippet of description (2 lines, truncated)
- Footer: Deadline badge + application status + "Apply Now" button
- Hover state: subtle lift effect (shadow increase)

### Application Tracker
- **Table View (Desktop):** Clean table with sortable columns (Job Title, Company, Applied Date, Status, Deadline, Actions)
- **Card View (Mobile):** Stacked cards with same information, swipe interactions for actions
- **Status Badges:** Pill-shaped (rounded-full, px-3 py-1, text-xs font-medium)

### Document Management
- **Document List:** File name, type icon, size, upload date, preview/download actions
- **Preview Modal:** Full-screen overlay with document viewer, close button top-right

### Form Auto-Fill Interface
- **Suggestion Sidebar:** Slides in from right, shows matched profile data
- **Field Mapping:** Visual connection between profile field and form field (subtle lines or highlights)
- **Confirmation Actions:** Accept/reject buttons per suggestion

## Images

**No Large Hero Image** - This is a utility dashboard application

**Profile & Document Images:**
- Student profile photo: Circular crop, size w-24 h-24 on profile page, w-10 h-10 in nav
- Uploaded photos: Displayed in preview grid at uploaded dimensions with aspect ratio maintained
- Signature: Displayed as captured with transparent background if possible
- Document thumbnails: Small preview icons (w-12 h-12) with file type indicators

**Empty States:**
- Illustration-style graphics for "No jobs applied yet", "Upload your first document"
- Simple, friendly SVG illustrations (consider undraw.co style references)

## Animations

**Minimal, purposeful motion only:**
- Page transitions: Simple fade (200ms)
- Modal overlays: Slide up from bottom (300ms ease-out)
- Button interactions: Built-in states, no custom animation
- Loading states: Simple spinner or skeleton screens

## Critical UX Patterns

**Dashboard First:** Landing page after login is the dashboard overview
**Mobile Navigation:** Bottom tab bar alternative for key sections (Dashboard, Jobs, Applications, Profile)
**Form Progress:** Multi-step forms show clear progress indicators (step 1 of 4)
**Auto-save:** Visual indicator when form data auto-saves
**Deadline Urgency:** Visual hierarchy for approaching deadlines (within 7 days = prominent)