# Strength Training App - Project Plan

## 📍 Current Status (Updated: Feb 12, 2026)

**Production App**: https://strength-training-app.vercel.app
**Repository**: https://github.com/ross-adam-d/strength-training-app.git
**Branch**: `master` (clean, all changes deployed)
**Last Commit**: `a9f593f` - "Add skip vs delete visual distinction"

---

## ✅ Completed Work

### Phase 1: Critical Fixes & Foundation (7h)
- ✅ Login persistence with proper cookie configuration
- ✅ Single active training block validation
- ✅ Database constraints and cleanup scripts
- **Sessions**: 1-5 (Feb 2-6, 2026)

### Phase 2: Training Block Overview (6h)
- ✅ Editable metadata (name, dates, status)
- ✅ Phase goal dropdown and training days per week
- ✅ Collapsible phase sections
- ✅ Simplified overview layout
- **Sessions**: 6 (Feb 6, 2026)

### Phase 3: Phase Overview Page (11h)
- ✅ New mesocycle detail page with horizontal week navigation
- ✅ Collapsible workout cards per week
- ✅ Workout day editing for all workouts
- ✅ Exercise CRUD: add, edit, delete, reorder (up/down arrows)
- ✅ Warmup notes schema (phase-level and workout-level)
- **Sessions**: 7-8 (Feb 7-9, 2026)

### Phase 4: Warmup & Reordering (7h - 67% complete)
- ✅ **Task 1**: Drag & drop workout reordering (desktop)
- ✅ **Task 2**: Warmup section UI (phase-wide, workout-specific, pin to same-day)
- ⏳ **Task 3**: "Apply to Rest of Phase" functionality (deferred)
- **Sessions**: 9 (Feb 10, 2026)

### Phase 5: Workout Logging Enhancements (8h)
- ✅ **Task 1**: Per-exercise notes (simplified from per-set)
- ✅ **Task 2**: RPE 1-5 scale (exercise-level + overall average)
- ✅ **Task 3**: "Up Next" message after completion
- ✅ **Task 4**: Missing fields warning modal
- ✅ **Task 5**: Skip vs delete visual distinction (yellow theme)
- **Sessions**: 13 (Feb 11, 2026)

### Additional Features (Sessions 10-12)
- ✅ Custom exercise creation with multi-select validation (Session 11)
- ✅ Inline custom exercise creation in Phase Overview (Session 11)
- ✅ Custom exercise UI improvements for mobile visibility (Session 12)

**Total Effort (Phases 1-5)**: 39 hours (vs 43-63h estimated)
**Efficiency**: 38% faster than estimated

---

## 🚀 Upcoming Work

### Phase 6A: Phase Details Redesign ⭐ NEXT UP
**Priority**: CRITICAL
**Effort**: 17-22 hours (2-3 sessions)
**Impact**: Major UX overhaul for daily use

**Goals**: Clean, mobile-first phase overview with reduced screen real estate

**Key Features**:
1. **Clean Up Layout**
   - Remove phase warmup box
   - Remove dates, goal, training details from top
   - Shrink heading, move "Back to Training Block" higher
   - Remove dysfunctional drag-and-drop for workouts

2. **Swipeable Week Navigation**
   - Remove disconnected day slider at top
   - Make entire page swipeable (swipe left/right for weeks)
   - Smooth transitions between weeks

3. **Compact Workout Display**
   - Show workouts as small boxes (title only: "Upper Body 1", "Lower Body 2")
   - All week workouts fit on mobile screen without scrolling
   - Click to navigate to edit page

4. **Separate Edit Workout Page** (`/workouts/[id]/edit`)
   - Format similar to log workout page (clean, streamlined)
   - Exercise details spread across page
   - Delete/Edit buttons at bottom of exercise cards
   - **Drag-and-drop exercise reordering** (remove promote/demote arrows)
   - Save with scope prompt (see below)

5. **"Apply to Rest of Phase" Prompt**
   - On save: "Do you want these changes to apply to '[Workout Name]' for the remainder of the phase?"
   - Two options: "Yes - Apply to All" / "No - This Week Only"
   - Updates all matching workouts in remaining weeks if "Yes"

6. **Remove Week View**
   - Delete week detail view (consolidated into phase overview)

**Files to Modify**:
- `app/(dashboard)/mesocycles/[id]/page.tsx` - Major redesign
- Create: `app/(dashboard)/workouts/[id]/edit/page.tsx` - New edit page
- Update: `app/api/workouts/[id]/route.ts` - Handle bulk updates for "apply to rest"

---

### Phase 6B: Workout History Calendar
**Priority**: CRITICAL
**Effort**: 10-14 hours
**Impact**: Better progress tracking and workout reference (replaces week view)

**Key Features**:
1. **Monthly Calendar View** (`/workout-history`)
   - Monthly calendar grid (current month by default)
   - Previous/next month navigation
   - Completed workouts: show strongman stick figure icon 🏋️
   - Click workout to see details (modal or navigate to log)
   - Highlight today's date

2. **Workout History List**
   - Below calendar: list of completed workouts
   - Order: most recent first (same as dashboard)
   - Display: name, date, duration, RPE
   - Click to view full workout details

3. **Banner Menu Integration**
   - Add calendar icon to bottom navigation (mobile)
   - Add to sidebar (desktop)
   - Navigate to workout history page

4. **Lift History Popup (CRITICAL)**
   - Quick access during active workout
   - Modal/popup from each exercise
   - Shows previous workout logs for same exercise
   - Display: sets, reps, weight, date
   - Essential since week summary is removed

**Files to Create/Modify**:
- Create: `app/(dashboard)/workout-history/page.tsx` - Calendar page
- Create: `components/LiftHistoryModal.tsx` - Popup component
- Update: `app/(dashboard)/workouts/[id]/log/page.tsx` - Add history popup
- Update: `components/navigation.tsx` - Add calendar icon

---

### Phase 6C: Advanced Exercise Features
**Priority**: HIGH
**Effort**: 20-25 hours
**Impact**: Improved workout logging flexibility

**Key Features**:
1. **Exercise Swap with Scope**
   - "Swap Exercise" button during workout logging
   - Select replacement from exercise library
   - Prompt: "Apply to just this week, or remainder of phase?"
   - Update single workout OR all remaining in phase

2. **Progressive Workout Saving (Active Workout State)**
   - Workout remains active when navigating away
   - Save draft to localStorage or database (`status: 'draft'`)
   - "Resume Workout" button in navigation
   - Auto-restore all entered data when returning
   - Warning if trying to start new workout while one is active
   - Cleanup logic for abandoned drafts

3. **Unilateral Exercise Tracking**
   - Flag exercises as unilateral (single-side) vs bilateral
   - If unilateral: split reps input into "Left" and "Right"
   - Store as `repsLeft` and `repsRight` in ExerciseLog
   - Progress tracking split by side
   - Schema: `isUnilateral: Boolean` on Exercise model

4. **Superset Functionality**
   - Mark exercises as "superset with previous"
   - Visual grouping in workout log (bracket/connector)
   - Suppress rest timer between supersetted exercises
   - Rest timer shows after completing superset group
   - Schema: `supersetWithPrevious: Boolean` on WorkoutExercise

5. **Per-Exercise "Complete" Button**
   - Button at end of last set for each exercise
   - Save progress after completing each exercise
   - Allows pausing and resuming mid-workout

**Database Changes**:
```prisma
model Exercise {
  isUnilateral Boolean @default(false)
}

model ExerciseLog {
  repsLeft  Int?  // for unilateral exercises
  repsRight Int?  // for unilateral exercises
}

model WorkoutExercise {
  supersetWithPrevious Boolean @default(false)
}

model WorkoutLog {
  status String @default("completed") // "draft" or "completed"
}
```

**Files to Create/Modify**:
- Update: `app/(dashboard)/workouts/[id]/log/page.tsx` - All new features
- Update: `app/(dashboard)/exercises/page.tsx` - Unilateral flag
- Update: Exercise edit forms - Superset checkbox
- Create: localStorage hooks for draft persistence

---

### Phase 6D: Additional Exercise Types
**Priority**: MEDIUM
**Effort**: 7-9 hours
**Impact**: More exercise type flexibility

**Key Features**:
1. **Reps vs Timed Exercises**
   - Exercise type: "Reps" or "Timed" (radio buttons in creation)
   - If timed: replace "Reps" input with "Duration (seconds)"
   - Built-in timer in workout log (start/stop per set)
   - Log duration in seconds instead of reps
   - Schema: `exerciseType: Enum('REPS', 'TIMED')`

2. **Bodyweight Exercise Default**
   - Flag exercises as bodyweight
   - Weight input shows "BW" placeholder
   - User can override (e.g., "+10" for weighted pull-ups)
   - Display as "BW" if no override, "BW +10kg" if added
   - Schema: `isBodyweight: Boolean`

3. **Heading Format Cleanup**
   - Standardize to "Week X, [Workout Name] - [Day], [Date]"
   - Clean, consistent formatting

**Database Changes**:
```prisma
enum ExerciseType {
  REPS
  TIMED
}

model Exercise {
  exerciseType ExerciseType @default(REPS)
  isBodyweight Boolean @default(false)
}

model ExerciseLog {
  duration Int? // for timed exercises (seconds)
}
```

---

### Phase 7: Dashboard Redesign
**Priority**: MEDIUM
**Effort**: 16-20 hours
**Impact**: Better workout-focused UX

**Key Features**:
- Next workout prominent card (large, at top)
- Manual workout button repositioned (bottom, secondary style)
- Current phase progress graphic (animated bar)
- Horizontal daily calendar (last 30 days with workout indicators)
- Phase volume graph (total sets × weight × reps per week)

---

### Phase 8: Progress Enhancements
**Priority**: MEDIUM
**Effort**: 10-12 hours
**Impact**: Better analytics and tracking

**Key Features**:
- Volume graph with muscle group filter
- RM table for active phase (1RM, 5RM, 10RM estimates)
- Weak point identification
- Training readiness score

---

### Phase 9: Training Block Menu & Wizard
**Priority**: LOW
**Effort**: 12-16 hours
**Impact**: Better training block management

**Key Features**:
- Clone training block (deep copy all structure)
- Enhanced delete with warnings
- Status editing in list view
- Simplified wizard (stop after duration, configure on overview)

---

## 📊 Phase Summary

| Phase | Description | Effort | Priority | Status |
|-------|-------------|--------|----------|--------|
| Phase 1 | Critical Fixes | 8-13h → 7h | - | ✅ Complete |
| Phase 2 | Training Block Overview | 6-8h → 6h | - | ✅ Complete |
| Phase 3 | Phase Overview + Exercise Mgmt | 8-10h → 14h | - | ✅ Complete |
| Phase 4 | Warmup + Reordering | 4-6h → 7h | - | ✅ Complete (67%) |
| Phase 5 | Workout Logging Enhancements | 15-20h → 8h | - | ✅ Complete |
| **Phase 6A** | **Phase Details Redesign** | **17-22h** | **CRITICAL** | 📋 Next |
| **Phase 6B** | **Workout History Calendar** | **10-14h** | **CRITICAL** | 📋 Pending |
| **Phase 6C** | **Advanced Exercise Features** | **20-25h** | **HIGH** | 📋 Pending |
| Phase 6D | Additional Exercise Types | 7-9h | MEDIUM | 📋 Pending |
| Phase 7 | Dashboard Redesign | 16-20h | MEDIUM | 📋 Pending |
| Phase 8 | Progress Enhancements | 10-12h | MEDIUM | 📋 Pending |
| Phase 9 | Training Block Menu | 12-16h | LOW | 📋 Pending |

**Completed**: 42 hours (Phases 1-5)
**Remaining**: 92-117 hours (Phases 6A-9)
**Total Project**: 134-159 hours

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Supabase) + Prisma 6.19
- **Auth**: NextAuth.js v4
- **Charts**: Recharts
- **Deployment**: Vercel

---

## 📦 Recent Deployments

### Session 13 (Feb 11, 2026) - Phase 5 Complete
- 5 commits, 1 production deployment
- Workout logging enhancements (notes, RPE, modals)
- Build: 34s, Page size: 5.94 kB

### Session 12 (Feb 11, 2026) - UI Polish
- 1 commit, improved custom exercise visibility
- Gray backgrounds for better mobile contrast
- Border thickness increased (border-2)

### Session 11 (Feb 11, 2026) - Custom Exercise Creation
- 1 commit, multi-select validation
- Inline creation in Phase Overview
- Exercise Library form improvements

### Session 9 (Feb 10, 2026) - Phase 4
- 6 commits + merge
- Warmup UI with dark theme
- Drag & drop reordering (@dnd-kit)

---

## ⚠️ Known Issues

### Pre-existing (Non-blocking)
- `@next/swc` version mismatch (15.5.7 vs 15.5.11)
- useEffect dependency warnings (no runtime impact)

### Deferred
- Mobile drag & drop for workout reordering (works on desktop)
  - Consider arrow buttons alternative (like exercise reordering)

---

## 📚 Documentation

- **PLAN.md** (this file) - High-level progress summary
- **IMPLEMENTATION_PLAN.md** - Detailed phase-by-phase guide
- **SESSION_SUMMARY.md** - Detailed session logs (Sessions 9-13)
- **README.md** - Setup, deployment, API docs
- **ISSUES.md** - Known issues tracker

---

## 🎉 Achievements

- **5 major phases complete** in 39 hours
- **38% faster than estimated** (43-63h → 39h actual)
- **Production app actively used** since Feb 2026
- **Mobile-optimized** for Samsung Chrome
- **Zero breaking deployments** in last 8 sessions
- **Clean, simple UI maintained** throughout Phase 5

---

## 📖 Quick Links

- [Detailed Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [Session History](./SESSION_SUMMARY.md)
- [Production App](https://strength-training-app.vercel.app)
- [GitHub Repository](https://github.com/ross-adam-d/strength-training-app.git)

---

**Last Updated**: Feb 12, 2026
**Next Session**: Phase 6A - Phase Details Redesign (17-22h)
