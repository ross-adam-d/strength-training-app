# Strength Training App - Project Plan

## 📍 Current Status (Updated: Feb 12, 2026 - End of Session 14)

**Production App**: https://strength-training-app.vercel.app
**Repository**: https://github.com/ross-adam-d/strength-training-app.git
**Branch**: `feature/phase6a-phase-details-redesign` (ready to merge)
**Master Branch**: `a9f593f` - "Add skip vs delete visual distinction"
**Feature Branch**: `c11a8b6` - "Improve disabled button visibility with opacity"

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

### Phase 6A: Phase Details Redesign (9h - 95% complete)
- ✅ **Task 1**: Clean up layout (removed clutter, simplified header)
- ✅ **Task 2**: Swipeable week navigation (touch gestures + smooth transitions)
- ✅ **Task 3**: Compact workout display (small cards fit on mobile screen)
- ✅ **Task 4**: Separate edit workout page (full CRUD with drag-and-drop)
- ✅ **Task 5**: "Apply to rest of phase" prompt (modal + bulk updates)
- ✅ **Task 6**: Remove week view (consolidated into phase overview)
- ⏳ **Navigation polish**: Week parameter (deferred - acceptable workaround)
- **Sessions**: 14 (Feb 12, 2026)
- **Status**: Feature branch ready to merge to master

**Total Effort (Phases 1-6A)**: 48 hours (vs 60-85h estimated)
**Efficiency**: 43% faster than estimated

---

## 🚀 Upcoming Work

### Phase 6B: Workout History Calendar ⭐ NEXT UP
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
| Phase 6A | Phase Details Redesign | 17-22h → 9h | - | ✅ Complete (95%) |
| **Phase 6B** | **Workout History Calendar** | **10-14h** | **CRITICAL** | 📋 Next |
| **Phase 6C** | **Advanced Exercise Features** | **20-25h** | **HIGH** | 📋 Pending |
| Phase 6D | Additional Exercise Types | 7-9h | MEDIUM | 📋 Pending |
| Phase 7 | Dashboard Redesign | 16-20h | MEDIUM | 📋 Pending |
| Phase 8 | Progress Enhancements | 10-12h | MEDIUM | 📋 Pending |
| Phase 9 | Training Block Menu | 12-16h | LOW | 📋 Pending |

**Completed**: 48 hours (Phases 1-6A)
**Remaining**: 74-99 hours (Phases 6B-9)
**Total Project**: 122-147 hours

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

### Session 14 (Feb 12, 2026) - Phase 6A Complete
- 8 commits on feature branch, ready to merge
- Phase overview redesign: 82% code reduction (1,515 → 269 lines)
- New edit workout page with drag-and-drop (706 lines)
- Apply to rest of phase functionality
- Swipeable week navigation with touch gestures
- Preview deployments: 6+ iterations
- **Status**: Feature branch ready for merge to master

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
- **SESSION_SUMMARY.md** - Detailed session logs (Sessions 9-14)
- **README.md** - Setup, deployment, API docs
- **ISSUES.md** - Known issues tracker

---

## 🎉 Achievements

- **6 major phases complete** in 48 hours (Phases 1-6A)
- **43% faster than estimated** (60-85h → 48h actual)
- **Production app actively used** since Feb 2026
- **Mobile-optimized** for Samsung Chrome
- **Zero breaking deployments** in last 9 sessions
- **Clean, simple UI maintained** throughout all phases
- **82% code reduction** on Phase Overview redesign (1,515 → 269 lines)

---

## 📖 Quick Links

- [Detailed Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [Session History](./SESSION_SUMMARY.md)
- [Production App](https://strength-training-app.vercel.app)
- [GitHub Repository](https://github.com/ross-adam-d/strength-training-app.git)

---

**Last Updated**: Feb 12, 2026 (End of Session 14)
**Next Session**: Merge Phase 6A + Phase 6B - Workout History Calendar (10-14h)
