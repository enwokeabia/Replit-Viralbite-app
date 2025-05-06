# Architecture Documentation

## Overview

ViralBite is a performance-based marketing platform connecting restaurants and influencers. The application allows restaurants to create marketing campaigns and influencers to submit content for these campaigns. The system tracks performance metrics such as views and calculates earnings based on engagement metrics.

The application uses a modern full-stack architecture with a React frontend, Express.js backend, and PostgreSQL database (via Neon Database's serverless offering).

## System Architecture

The system follows a client-server architecture with a clear separation between:

1. **Client**: React-based single-page application (SPA) with Tailwind CSS for styling
2. **Server**: Express.js REST API
3. **Database**: PostgreSQL with Drizzle ORM

### Architectural Diagram

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  React Frontend │ ───────▶│  Express Server │ ───────▶│ PostgreSQL DB   │
│  (Vite + React) │         │  (Node.js)      │         │ (Neon Database) │
│                 │ ◀─────── │                 │ ◀─────── │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

## Key Components

### Frontend Architecture

The frontend is built with the following key technologies:

- **React**: For UI components and state management
- **Vite**: As the build tool and development server
- **TanStack Query (React Query)**: For data fetching, caching, and state management
- **Tailwind CSS**: For styling components
- **Shadcn/ui**: Component library built on Radix UI
- **Wouter**: For client-side routing

The frontend follows a component-based architecture with:

- **Pages**: Representing different views (dashboard, campaigns, submissions, etc.)
- **Components**: Reusable UI elements (cards, modals, forms, etc.)
- **Hooks**: Custom logic for auth, toasts, etc.
- **Lib**: Utility functions and shared logic

### Backend Architecture

The backend is built with the following technologies:

- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **Drizzle ORM**: SQL toolkit and ORM
- **Zod**: Schema validation

The backend is organized around:

- **Routes**: API endpoints for CRUD operations
- **Auth**: Authentication middleware
- **Storage**: Database access layer
- **Schema**: Data models and validation

### Authentication System

The application uses a dual authentication system:

1. **Session-based authentication**: Using `express-session` with a PostgreSQL session store
2. **Token-based authentication**: Using custom tokens stored in localStorage

An "emergency login" mechanism is also implemented, allowing quick access with predefined tokens.

## Data Model

The database schema is defined using Drizzle ORM and includes these main entities:

1. **Users**: Represents all users (restaurants, influencers, admins)
2. **Campaigns**: Marketing campaigns created by restaurants
3. **Submissions**: Content submitted by influencers for campaigns
4. **Private Invitations**: Direct invitations from restaurants to specific influencers
5. **Performance Metrics**: Tracking metrics for campaign performance

### Key Relationships

- Restaurants create campaigns (one-to-many)
- Influencers submit content for campaigns (many-to-many)
- Restaurants can directly invite influencers (many-to-many)

## Data Flow

### Campaign Creation Flow

1. Restaurant creates a campaign with details (title, description, reward amount, etc.)
2. Campaign is stored in the database
3. Campaign becomes visible to influencers in the browse section

### Submission Flow

1. Influencer browses available campaigns
2. Influencer submits content (Instagram URL) for a campaign
3. Restaurant reviews the submission
4. Restaurant approves/rejects the submission
5. If approved, performance metrics are tracked (views, earnings)

### Private Invitation Flow

1. Restaurant creates a private invitation for a specific influencer
2. Influencer receives and accepts/rejects the invitation
3. If accepted, influencer submits content
4. Performance metrics are tracked

## External Dependencies

The application relies on several external services and libraries:

1. **Neon Database**: Serverless PostgreSQL database
2. **Radix UI**: Headless UI components
3. **TanStack Query**: Data fetching and state management
4. **Tailwind CSS**: Utility-first CSS framework
5. **Drizzle ORM**: Database ORM and migration tool
6. **Zod**: Schema validation

## Deployment Strategy

The application is configured for deployment on Replit with:

1. **Build Process**: Using Vite for frontend and esbuild for backend
2. **Environment Variables**: Configured for development and production
3. **Database Connection**: Using Neon Database's serverless PostgreSQL offering
4. **Autoscaling**: Set up via Replit's deployment configuration

### Deployment Configuration

- Frontend is built with Vite and served statically
- Backend runs as a Node.js process
- Database connection is established via environment variables
- Port 5000 is mapped to port 80 externally

## Development Workflow

The development workflow includes:

1. **Local Development**: Using `npm run dev` with hot reloading
2. **Type Checking**: With TypeScript
3. **Database Migrations**: Using Drizzle Kit
4. **Building**: Separate processes for frontend and backend

## Security Considerations

- Password hashing using scrypt with salt
- Session-based authentication with secure cookies
- Input validation using Zod schemas
- CSRF protection via token-based auth