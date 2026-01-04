# AI Visibility Tracker - Frontend

A minimal, modern Next.js frontend for tracking brand visibility across AI platforms.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Utility-first styling
- **Motion** - Animations (Framer Motion fork for React 19)
- **Zustand** - State management
- **React Query** - Server state management
- **Axios** - API client
- **React Hook Form + Zod** - Form handling and validation

## Features

- 🔐 User authentication (login/signup)
- 📊 Project onboarding flow
- 📈 Dashboard with comprehensive metrics
- 🎯 Multi-brand tracking
- 🚀 Real-time data updates
- 🎨 Minimal, clean UI design

## Getting Started

1. **Install dependencies:**

\`\`\`bash
npm install
\`\`\`

2. **Set up environment variables:**

Create a `.env.local` file:

\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:8000
\`\`\`

3. **Run the development server:**

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
frontend/
├── app/                    # Next.js app router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── onboarding/        # Project creation flow
│   └── layout.tsx         # Root layout
├── components/            # React components
├── lib/                   # Utility functions
│   ├── api.ts            # Axios instance
│   └── utils.ts          # Helper functions
├── services/              # API service layer
│   └── api.ts            # Typed API calls
├── store/                 # Zustand stores
│   └── auth.ts           # Auth state
├── types/                 # TypeScript types
│   └── index.ts          # Shared types
└── public/               # Static assets
\`\`\`

## API Integration

The frontend integrates with the following backend endpoints:

- **Auth:**
  - `POST /auth/register` - User registration
  - `POST /auth/login` - User login
  - `GET /auth/me` - Get current user

- **Projects:**
  - `GET /projects` - List projects
  - `POST /projects` - Create project
  - `GET /projects/{id}` - Get project details
  - `PUT /projects/{id}` - Update project
  - `DELETE /projects/{id}` - Delete project

- **Dashboard:**
  - `GET /dashboard/{projectId}` - Get dashboard metrics

- **Analysis:**
  - `GET /analysis/{projectId}/status` - Get analysis status
  - `POST /analysis/{projectId}/retry` - Retry analysis

## Tailwind CSS v4

This project uses Tailwind CSS v4 with CSS-first configuration. Theme variables are defined in `app/globals.css`:

\`\`\`css
@theme inline {
  --color-primary-500: oklch(0.84 0.18 117.33);
  --color-background: oklch(0.15 0.01 264);
  /* ... more theme variables */
}
\`\`\`

## Icons

Using hover.com icon library. Add icons via:

\`\`\`bash
npx shadcn@latest add https://itshover.com/r/[icon-name].json
\`\`\`

## Building for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Docker

Build and run with Docker:

\`\`\`bash
docker build -t ai-visibility-frontend .
docker run -p 3000:3000 ai-visibility-frontend
\`\`\`
