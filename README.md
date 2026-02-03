# Strength Training Web Application

A comprehensive Next.js web application for tracking strength training using hierarchical periodization: Macrocycles → Mesocycles → Microcycles → Workouts.

## Features

- **Hierarchical Periodization**: Organize training into macrocycles (10-24 weeks), mesocycles (4-6 weeks), and microcycles (1 week)
- **Workout Planning**: Create detailed workouts with exercises, target sets, reps, and RPE
- **Real-Time Logging**: Log sets with weight, reps, and RPE during workouts
- **Progress Tracking**: Visualize strength gains and volume progression with interactive charts
- **Exercise Library**: 30+ pre-loaded common exercises, plus create custom exercises
- **Multi-User Support**: Secure authentication with user profiles

## Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v4
- **Charts**: Recharts
- **Validation**: Zod

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or hosted)
- Git (for version control)

## Getting Started

### 1. Clone and Install

```bash
cd strength-training-app
npm install
```

### 2. Configure Environment Variables

Create or update `.env.local` with your database connection:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/strength_training_db?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Node Environment
NODE_ENV="development"
```

**Generate a secure NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or create and run migrations (for production)
npm run db:migrate

# Seed exercise library
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Schema

The application uses a hierarchical structure:

- **Users & Profiles**: User authentication and preferences
- **Exercises**: Library of exercises (public + user-created)
- **Macrocycles**: Long-term training cycles (10-24 weeks)
- **Mesocycles**: Training phases within macrocycles (4-6 weeks)
- **Microcycles**: Weekly training plans
- **Workouts**: Individual workout sessions
- **WorkoutExercises**: Planned exercises with target sets/reps
- **WorkoutLogs**: Completed workout records
- **ExerciseLogs**: Actual sets logged during workouts

## Project Structure

```
strength-training-app/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── dashboard/       # Main dashboard
│   │   ├── macrocycles/     # Macrocycle management
│   │   ├── mesocycles/      # Mesocycle management
│   │   ├── microcycles/     # Microcycle management
│   │   ├── exercises/       # Exercise library
│   │   ├── workouts/        # Workout logging
│   │   └── progress/        # Progress tracking
│   ├── api/                 # API routes
│   │   ├── auth/            # NextAuth endpoints
│   │   ├── macrocycles/     # Macrocycle CRUD
│   │   ├── mesocycles/      # Mesocycle CRUD
│   │   ├── microcycles/     # Microcycle CRUD
│   │   ├── workouts/        # Workout CRUD
│   │   ├── exercises/       # Exercise CRUD
│   │   └── workout-logs/    # Workout logging
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── components/
│   ├── ui/                  # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   └── select.tsx
│   └── navigation.tsx
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   └── prisma.ts           # Prisma client
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Exercise library seed
├── types/
│   └── next-auth.d.ts      # TypeScript definitions
├── .env.local              # Environment variables
├── package.json
└── README.md
```

## Usage Guide

### 1. Create a Macrocycle

1. Navigate to **Macrocycles** from the dashboard
2. Click **Create Macrocycle**
3. Fill in name, dates (10-24 weeks), and goals
4. Save

### 2. Add Mesocycles

1. Open your macrocycle
2. Click **Add Mesocycle**
3. Define 4-6 week training phases
4. Set focus (e.g., Hypertrophy, Strength, Power)

### 3. Create Microcycles

1. Open a mesocycle
2. Click **Add Microcycle**
3. Create weekly training plans
4. Number them sequentially (Week 1, 2, 3...)

### 4. Plan Workouts

1. Open a microcycle
2. Click **Create Workout**
3. Name the workout (e.g., "Upper Body Push")
4. Add exercises from the library
5. Set target sets, reps, and RPE for each exercise
6. Optionally set day of week and estimated duration

### 5. Log a Workout

1. From a microcycle, click **Start Workout** on any workout
2. Log each set with:
   - Weight (kg)
   - Reps completed
   - RPE (Rate of Perceived Exertion, 1-10)
   - Optional notes
3. Rate your overall workout (1-5 stars)
4. Add general notes
5. Click **Complete Workout**

### 6. Track Progress

1. Navigate to **Progress** from the dashboard
2. Select an exercise to view:
   - Weight progression over time
   - Estimated 1RM trends
   - Volume progression (sets × reps × weight)
3. View recent workout summaries

## Deployment

### Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create strength-training-app --public --source=. --remote=origin
   git push -u origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables:
     - `DATABASE_URL` (from Vercel Postgres)
     - `NEXTAUTH_URL` (your production URL)
     - `NEXTAUTH_SECRET` (generate new for production)

3. **Set Up Vercel Postgres:**
   - Create Postgres database in Vercel
   - Copy connection string to `DATABASE_URL`

4. **Run Migrations:**
   ```bash
   # From Vercel CLI or GitHub Actions
   npx prisma migrate deploy
   npm run db:seed
   ```

5. Deploy! Your app is now live.

## Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database (dev)
npm run db:migrate   # Create and run migrations (prod)
npm run db:seed      # Seed exercise library
npm run db:studio    # Open Prisma Studio (GUI)
```

## Database Management

### Prisma Studio

View and edit your database visually:

```bash
npm run db:studio
```

Opens at [http://localhost:5555](http://localhost:5555)

### Creating Migrations

When you modify `prisma/schema.prisma`:

```bash
npm run db:migrate
# Enter a migration name when prompted
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Macrocycles
- `GET /api/macrocycles` - List user's macrocycles
- `POST /api/macrocycles` - Create macrocycle
- `GET /api/macrocycles/[id]` - Get macrocycle details
- `PATCH /api/macrocycles/[id]` - Update macrocycle
- `DELETE /api/macrocycles/[id]` - Delete macrocycle

### Mesocycles
- `POST /api/mesocycles` - Create mesocycle
- `GET /api/mesocycles/[id]` - Get mesocycle details
- `DELETE /api/mesocycles/[id]` - Delete mesocycle

### Microcycles
- `POST /api/microcycles` - Create microcycle
- `GET /api/microcycles/[id]` - Get microcycle details
- `DELETE /api/microcycles/[id]` - Delete microcycle

### Workouts
- `POST /api/workouts` - Create workout
- `GET /api/workouts/[id]` - Get workout details
- `DELETE /api/workouts/[id]` - Delete workout

### Exercises
- `GET /api/exercises` - List exercises (supports filters)
- `POST /api/exercises` - Create custom exercise
- `GET /api/exercises/[id]` - Get exercise details
- `GET /api/exercises/[id]/logs` - Get exercise history
- `DELETE /api/exercises/[id]` - Delete custom exercise

### Workout Logs
- `GET /api/workout-logs` - List recent workout logs
- `POST /api/workout-logs` - Create workout log (complete workout)

## Customization

### Add More Exercises

Edit `prisma/seed.ts` to add more exercises, then run:

```bash
npm run db:seed
```

### Modify UI Colors

Edit `tailwind.config.ts` to change the primary color scheme.

### Change Units

The database stores weight in kg. To support lbs, add a conversion layer in the UI or add a user preference field in the Profile model.

## Troubleshooting

### Database Connection Issues

**Error**: "Can't reach database server"

**Solution**:
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env.local`
- Ensure database exists and credentials are correct

### Prisma Client Not Found

**Error**: "@prisma/client did not initialize yet"

**Solution**:
```bash
npm run db:generate
```

### Authentication Not Working

**Error**: NextAuth session undefined

**Solution**:
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies and try again

## Contributing

This is a portfolio/personal project. Feel free to fork and customize for your own use!

## License

MIT License - feel free to use and modify for your own training needs.

## Future Enhancements

- Exercise video/image uploads
- Mobile app (React Native)
- Social features (share workouts)
- AI-powered training recommendations
- Progressive overload calculations
- Deload week suggestions
- Export data (CSV, PDF)
- Body measurement tracking
- Nutrition tracking integration

---

**Built with** Next.js, TypeScript, Prisma, PostgreSQL, and Tailwind CSS
