# BMSCE.tech

A minimal, professional web application where anyone can create quick questions and collect student responses in real-time. Built for educational purposes to demonstrate modern full-stack web development practices.

**⚠️ Educational Project**: This application is created primarily for learning and demonstrating web development concepts. While functional, it may not meet all production-grade requirements.

## Features

### 📝 Create Questions

- **Open access**: Anyone can create questions without authentication
- **Two question types**: Yes/No buttons or Short Answer text input
- **Audience targeting**:
  - **All Students**: Open to everyone with manual name entry
  - **MCA 1st yr Sec B**: Limited to 58 registered students with USN lookup
- **Anonymous responses**: Optional setting for sensitive questions
- **Dual submission modes**: Students choose identified or anonymous submission
- **Instant shareable links**: Each question gets a unique URL
- **Clean form interface**: Built with shadcn/ui components

### 👨‍🎓 Student Response

- **Smart student selection**:
  - For MCA Sec B: Searchable dropdown with 58 students (name, USN, section)
  - For All Students: Manual name input field
- **Large Yes/No buttons**: Easy-to-tap with visual feedback (green/red)
- **Short answer input**: Clean text field with validation
- **Anonymous option**: Submit without identity (when enabled)
- **Loading states**: Custom spinner during submission
- **Duplicate prevention**: Buttons disabled while processing
- **Success confirmation**: Full-screen success message
- **Mobile optimized**: Responsive design for all devices

### 📊 Dashboard

- **Question list view**: All questions with type, audience, and anonymous status
- **Response statistics**:
  - Yes/No: Count of Yes and No responses
  - Short Answer: Total response count
- **Detailed response table**:
  - Student name, USN, answer, and timestamp
  - Anonymous responses marked clearly
  - Sortable and scrollable on all devices
- **CSV export**: Download all responses with full details
- **Open in new tab**: Share question links via external link button
- **Navigation**: Easy back/forth between list and detail views
- **Empty states**: Helpful messages for first-time users

## Tech Stack

### Frontend

- **Next.js 15** (App Router with Turbopack)
- **React 19** with React Compiler for optimization
- **TypeScript 5** for type safety
- **Tailwind CSS 4** with custom design tokens
- **shadcn/ui** (New York style) with Radix UI primitives
- **Lucide React** for icons
- **Sonner** for toast notifications

### Backend & Database

- **PostgreSQL** (Neon cloud hosting)
- **Prisma ORM 7.1.0** with PostgreSQL adapter
- **pg driver** for database connections
- **Next.js API Routes** for RESTful endpoints

### Deployment

- **Vercel** for hosting with automatic CI/CD
- **GitHub** for version control

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone https://github.com/sandeep5shetty/bmsce-tech.git
cd bmsce-tech
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env` file:

```env
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

4. Set up the database:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed with 58 MCA students (optional)
npx tsx prisma/seed.ts
```

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Usage

### Creating a Question

1. Navigate to the home page
2. Click "Create Question"
3. Fill in the question form:
   - Enter your question text
   - Select question type (Yes/No or Short Answer)
   - Choose audience:
     - **All Students**: Anyone can respond
     - **MCA 1st yr B Sec**: Only registered students
   - Toggle "Allow Anonymous Responses" if needed
4. Click "Create Question"
5. Copy the generated link from the dialog
6. Share the link via WhatsApp, email, or any platform

### Answering a Question

1. Open the shared question link (e.g., `/q/abc123`)
2. Read the question
3. For Yes/No: Click the appropriate button
4. For Short Answer: Type your response
5. Enter your name if required
6. Submit your response

### Viewing Responses

1. Click "Dashboard" in the navigation
2. See all your questions with response counts
3. Click on a question to view detailed responses
4. Export responses to CSV if needed
5. Copy question link to share again

## Project Structure

```
app/
├── page.tsx                      # Landing page
├── create/page.tsx               # Create question form
├── q/[id]/page.tsx               # Student answer page
├── dashboard/page.tsx            # Dashboard with responses
├── privacy/page.tsx              # Privacy & about page
├── layout.tsx                    # Root layout
├── globals.css                   # Global styles
└── api/
    ├── questions/
    │   ├── route.ts              # GET/POST questions
    │   └── [id]/route.ts         # GET question by ID
    ├── responses/route.ts        # POST responses
    └── students/route.ts         # GET students with search

components/
├── ui/                           # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── command.tsx               # Search dropdown
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── popover.tsx
│   ├── select.tsx
│   ├── spinner.tsx               # Loading spinner
│   ├── switch.tsx
│   ├── table.tsx
│   └── sonner.tsx
├── student-selector.tsx          # Student dropdown
└── footer.tsx                    # App footer

lib/
├── types.ts                      # TypeScript types
├── prisma.ts                     # Prisma client
└── utils.ts                      # Utilities

prisma/
├── schema.prisma                 # Database schema
├── seed.ts                       # Seed script
└── migrations/                   # Migration files
```

## Database Structure

This application uses **PostgreSQL** with **Prisma ORM** for data persistence.

### Models

**Student**

- `id` (String, PK) - Unique identifier
- `name` (String) - Full name
- `usn` (String, Unique) - University Serial Number
- `section` (String) - Class section
- `createdAt` (DateTime)

**Question**

- `id` (String, PK) - Unique identifier
- `question` (String) - Question text
- `type` (String) - "yes-no" or "short-answer"
- `audience` (String) - "all" or "cr-only"
- `isAnonymous` (Boolean) - Allow anonymous responses
- `createdAt` (DateTime)

**Response**

- `id` (String, PK) - Unique identifier
- `questionId` (String, FK) - References Question
- `answer` (String) - Response text
- `studentId` (String, FK, Optional) - References Student
- `name` (String, Optional) - Manual name entry
- `submittedAt` (DateTime)

### Current Data

- **58 MCA 1st year Section B students** pre-seeded
- All data persisted in PostgreSQL (Neon)
- Cascade deletion for questions/responses
- Indexes on frequently queried fields

## Design Features

- **Clean, minimal interface** with subtle gradients
- **Responsive layout** that works on mobile and desktop
- **Professional color scheme** with blue/purple accents
- **Smooth interactions** with hover effects and transitions
- **Toast notifications** for user feedback
- **Accessible components** from shadcn/ui
- **Type-safe** with TypeScript throughout

## Current Features ✅

- ✅ PostgreSQL database with Prisma ORM
- ✅ RESTful API with Next.js Route Handlers
- ✅ Student database (58 MCA students)
- ✅ Audience targeting (All / Sec B)
- ✅ Anonymous response option
- ✅ CSV export functionality
- ✅ Responsive design (mobile/desktop)
- ✅ Loading states and error handling
- ✅ Search functionality for students
- ✅ Real-time dashboard updates

## Potential Future Enhancements 🚀

- 🔐 User authentication and authorization
- 📊 Response analytics with charts
- 📅 Question scheduling and expiration
- 🔔 Real-time notifications (WebSockets)
- 📧 Email/SMS integrations
- 📝 Question templates library
- 📤 Bulk question import/export
- 👥 Multi-section management
- 📱 Progressive Web App (PWA)
- 🎨 Custom themes and branding

## Educational Purpose 📚

This project is developed primarily for educational purposes:

- 🎓 Demonstrate modern full-stack development (Next.js, React, TypeScript)
- 🗄️ Showcase database design with Prisma and PostgreSQL
- 🎨 Illustrate responsive UI/UX with shadcn/ui
- 🔌 Teach RESTful API development
- 📖 Serve as a learning resource for students
- 🛠️ Practice real-world application architecture

While functional for classroom use, the primary goal is education and skill development.

## Contributing 🤝

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

MIT

## Acknowledgments 🙏

- [Next.js](https://nextjs.org/) and [React](https://react.dev/)
- [shadcn/ui](https://ui.shadcn.com/) for components
- [Prisma](https://www.prisma.io/) for database ORM
- [Vercel](https://vercel.com/) for hosting
- [Lucide](https://lucide.dev/) for icons

## Contact 📧

**Developer**: Sandeep Shetty  
**Website**: [sandeepshetty.dev](https://sandeepshetty.dev)  
**GitHub**: [github.com/sandeep5shetty/bmsce-tech](https://github.com/sandeep5shetty/bmsce-tech)
