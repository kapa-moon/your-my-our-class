# Hello You! - Minimalistic Next.js App

A clean, minimalistic Next.js application with Neon database integration, ready for Vercel deployment.

## Features

- **Minimalistic Design**: Clean landing page with "Hello you!" message
- **Next.js 15**: Modern React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Neon Database**: Serverless PostgreSQL database
- **Drizzle ORM**: Type-safe database operations
- **Vercel Ready**: Optimized for Vercel deployment

## Getting Started

### 1. Clone and Install

```bash
npm install
```

### 2. Set up Database

1. Create a [Neon](https://neon.tech) account and database
2. Create a `.env.local` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

Replace with your actual Neon database connection string.

### 3. Generate Database Schema

```bash
npm run db:generate
npm run db:migrate
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Scripts

- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add your `DATABASE_URL` environment variable in Vercel settings
4. Deploy!

The `vercel.json` configuration is already set up for optimal deployment.

## Project Structure

```
├── src/
│   ├── app/
│   │   └── page.tsx          # Main landing page
│   └── lib/
│       ├── db.ts             # Database connection
│       └── schema.ts         # Database schema
├── drizzle.config.ts         # Drizzle ORM configuration
├── vercel.json               # Vercel deployment configuration
└── package.json              # Dependencies and scripts
```

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Neon](https://neon.tech/) - PostgreSQL database
- [Drizzle ORM](https://orm.drizzle.team/) - Database ORM
- [Vercel](https://vercel.com/) - Deployment platform