# Getting Started with Strength Training App

Welcome! This guide will help you get your strength training app up and running in just a few steps.

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd strength-training-app
npm install
```

### 2. Set Up Database

You have three options:

#### Option A: Local PostgreSQL (Recommended for development)

Install PostgreSQL locally, then update `.env.local`:

```env
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/strength_training_db"
```

#### Option B: Docker

```bash
docker run --name strength-postgres -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=strength_training_db -p 5432:5432 -d postgres

# Update .env.local
DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/strength_training_db"
```

#### Option C: Cloud Database (Supabase, Railway, etc.)

Sign up for a free tier and copy the connection string to `.env.local`.

### 3. Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Create tables
npm run db:push

# Seed exercises
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## First Time Setup

### 1. Create Your Account

1. Click **"Sign Up"** on the home page
2. Enter your name, email, and password (min 8 characters)
3. Click **"Create Account"**
4. You'll be redirected to login
5. Login with your credentials

### 2. Create Your First Macrocycle

A macrocycle is your long-term training block (10-24 weeks).

1. Navigate to **"Macrocycles"** in the navigation
2. Click **"Create Macrocycle"**
3. Fill in:
   - **Name**: e.g., "Winter 2024 Training Block"
   - **Description**: e.g., "Focus on strength and muscle building"
   - **Start Date**: Today or your planned start
   - **End Date**: 12-16 weeks from start
   - **Goals**: e.g., "Increase bench press to 100kg, squat to 150kg"
   - **Status**: Active
4. Click **"Create"**

### 3. Add Mesocycles

Mesocycles are 4-6 week training phases within your macrocycle.

1. Click on your macrocycle to open it
2. Click **"Add Mesocycle"**
3. Fill in:
   - **Name**: e.g., "Hypertrophy Phase 1"
   - **Description**: e.g., "Building muscle mass"
   - **Start Date**: First day of the mesocycle
   - **End Date**: 4-6 weeks later
   - **Focus**: "Hypertrophy" (or Strength, Power, Deload)
4. Click **"Create"**

Repeat for each phase of your macrocycle. Common structure:
- Mesocycle 1: Hypertrophy (6 weeks)
- Mesocycle 2: Strength (4 weeks)
- Mesocycle 3: Power (3 weeks)
- Mesocycle 4: Deload (1 week)

### 4. Create Microcycles

Microcycles are weekly training plans.

1. Click on a mesocycle to open it
2. Click **"Add Microcycle"**
3. Fill in:
   - **Name**: e.g., "Week 1"
   - **Week Number**: 1 (increment for each week)
   - **Start Date**: Monday of that week
   - **End Date**: Sunday of that week
4. Click **"Create"**

Create one for each week in your mesocycle.

### 5. Plan Your Workouts

Now design the actual workouts!

1. Click on a microcycle to open it
2. Click **"Create Workout"**
3. Fill in:
   - **Workout Name**: e.g., "Upper Body Push"
   - **Description**: e.g., "Chest, shoulders, triceps"
   - **Day of Week**: Monday (optional)
   - **Estimated Duration**: 90 minutes (optional)
4. Click **"Add Exercise"** for each exercise you want:
   - Select exercise from dropdown
   - Enter target sets (e.g., 4)
   - Enter target reps (e.g., "8-10" or "8")
   - Enter target RPE (Rate of Perceived Exertion, 1-10)
5. Click **"Create"**

Example workout structure:
- Barbell Bench Press: 4 sets × 8 reps @ RPE 8
- Dumbbell Shoulder Press: 3 sets × 10 reps @ RPE 7
- Lateral Raises: 3 sets × 12 reps @ RPE 6
- Tricep Pushdowns: 3 sets × 15 reps @ RPE 7

### 6. Log Your First Workout

When it's time to train:

1. Go to your microcycle
2. Click **"Start Workout"** on the workout you want to do
3. For each exercise:
   - Click **"Add Set"**
   - Enter the weight you used (in kg)
   - Enter the reps you completed
   - Enter RPE (how hard it felt, 1-10)
   - Add notes if needed
4. Move through all exercises using the tabs
5. When done:
   - Rate your overall workout (1-5 stars)
   - Add general notes
   - Click **"Complete Workout"**

### 7. Track Your Progress

1. Navigate to **"Progress"** in the navigation
2. Select an exercise from the dropdown
3. View:
   - Weight progression over time
   - Estimated 1RM (one-rep max) trend
   - Total volume progression
4. Scroll down to see recent workout history

## Tips for Success

### Training Principles

1. **Progressive Overload**: Gradually increase weight, reps, or sets over time
2. **Track Everything**: Log every set to see your progress
3. **Be Consistent**: Stick to your program for at least 4-6 weeks
4. **Listen to Your Body**: Use RPE to avoid overtraining
5. **Deload**: Take a lighter week every 4-6 weeks

### Using RPE (Rate of Perceived Exertion)

RPE is a 1-10 scale of how hard a set feels:
- **10**: Maximum effort, couldn't do another rep
- **9**: Could maybe do 1 more rep
- **8**: Could do 2 more reps
- **7**: Could do 3 more reps
- **6**: Could do 4+ more reps
- **5 or less**: Very easy

Aim for RPE 7-9 for most working sets.

### Sample Weekly Schedule

**Upper/Lower Split (4 days/week):**
- Monday: Upper Body Push
- Tuesday: Lower Body
- Thursday: Upper Body Pull
- Saturday: Lower Body

**Push/Pull/Legs (6 days/week):**
- Monday: Push (Chest, Shoulders, Triceps)
- Tuesday: Pull (Back, Biceps)
- Wednesday: Legs
- Thursday: Push
- Friday: Pull
- Saturday: Legs

### Exercise Selection

The app includes 30+ exercises. Good starting exercises:

**Compound Movements (most important):**
- Barbell Squat
- Deadlift
- Barbell Bench Press
- Barbell Row
- Overhead Press
- Pull-ups

**Isolation Movements (supplementary):**
- Leg Curl
- Leg Extension
- Lateral Raise
- Barbell Curl
- Tricep Pushdown

## Common Questions

### Do I need to follow periodization?

Not necessarily! You can use this app just for workout logging. But periodization helps:
- Organize your training long-term
- Plan progressive overload systematically
- Prevent plateaus
- Reduce injury risk

### Can I use this for other training styles?

Yes! While designed for strength training, you can adapt it for:
- Bodybuilding
- Powerlifting
- Olympic weightlifting
- CrossFit-style training
- General fitness

### How often should I create new cycles?

Typical timeline:
- **Macrocycle**: Create one every 12-16 weeks
- **Mesocycle**: 3-4 per macrocycle
- **Microcycle**: One per week
- **Workouts**: Plan for the whole microcycle at once

### Can I modify workouts mid-cycle?

While the app doesn't have an edit workout feature yet, you can:
1. Delete and recreate the workout, or
2. Just adjust weights/reps when logging (the plan is just a guide)

### What if I miss a workout?

No problem! Just skip it and move on to the next one. Or:
- You can log it on a different day
- Adjust your microcycle dates if needed
- The app tracks when you actually completed workouts

## Keyboard Shortcuts

When logging workouts:
- **Tab**: Move between input fields
- **Enter**: Save current set and add new one (future feature)

## Mobile Usage

The app is mobile-responsive! You can:
- Log workouts at the gym on your phone
- Plan workouts on desktop
- Check progress anywhere

## Data Export

Currently, your data is in the PostgreSQL database. To export:

```bash
# View in Prisma Studio
npm run db:studio
```

Future feature: CSV/PDF export

## Need Help?

Common issues:

**"Can't connect to database"**
- Check DATABASE_URL in `.env.local`
- Make sure PostgreSQL is running
- Try `npm run db:push` again

**"No exercises showing"**
- Run `npm run db:seed` to add exercise library

**"Can't log in"**
- Clear browser cookies
- Check NEXTAUTH_SECRET is set
- Try registering a new account

**"Charts not showing"**
- You need to log at least 2 workouts for the same exercise
- Make sure you completed the workouts (not just planned them)

## What's Next?

1. **Complete a full microcycle** (1 week of workouts)
2. **Review your progress** after 2-3 weeks
3. **Adjust your program** based on progress
4. **Create custom exercises** for your specific needs
5. **Deploy to production** when ready (see DEPLOYMENT.md)

---

**Ready to get strong?** Start by creating your first macrocycle! 💪

For more details, see:
- **README.md** - Full documentation
- **DEPLOYMENT.md** - Production deployment guide
- **PLAN.md** - Implementation details
