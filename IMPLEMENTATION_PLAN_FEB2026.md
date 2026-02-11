# Implementation Plan - February 2026 Scope Update

## Overview
This document outlines the implementation plan for the major scope changes defined in "Updated scope 8.2.26.docx". These changes represent a significant restructuring of the app's training cycle management and workout logging functionality.

## Progress Summary (Updated: Feb 11, 2026)

**Completed**: Phases 1, 2, 3, 4, 5 ✅
**In Progress**: None
**Remaining**: Phases 6-9

| Phase | Status | Effort (Est → Actual) | Commits |
|-------|--------|----------------------|---------|
| Phase 1: Critical Fixes | ✅ Complete | 8-13h → 7h | 5 commits |
| Phase 2: Training Block Overview | ✅ Complete | 6-8h → 6h | 1 commit |
| Phase 3: Phase Overview + Exercise Mgmt | ✅ Complete | 8-10h → 11h | 3 commits |
| Phase 4: Workout Reordering + Warmup | ✅ Complete | 4-6h → 7h | 6 commits + merge |
| Phase 5: Workout Logging Enhancements | ✅ Complete | 15-20h → 8h | 5 commits |
| Phase 6: Advanced Workout Features | 📋 Pending | 11-14h | - |
| Phase 7: Dashboard Redesign | 📋 Pending | 16-20h | - |
| Phase 8: Progress Enhancements | 📋 Pending | 10-12h | - |
| Phase 9: Training Block Menu | 📋 Pending | 12-16h | - |

**Total Actual Effort (Phases 1-5)**: 39 hours (vs 43-63h estimated)
**Remaining Estimated**: 49-62 hours

## Branch Strategy
- **Branch Name**: `feature/scope-update-feb2026`
- **Base**: `master` (current production)
- **Status**: 14+ commits, all changes deployed to preview
- **Preview URL**: https://strength-training-9i6vkjabo-adams-projects-57987d51.vercel.app
- **Merge Strategy**: Ready for merge to master after user testing

---

## Phase 1: Critical Fixes & Foundation ✅ COMPLETE

**Goal**: Fix blocking issues and prepare database/validation foundation

### 1.1 Login Persistence Issue ✅
**Problem**: Login not carrying over between devices/browsers

**Completed**:
- [x] Added explicit cookie configuration with httpOnly, sameSite, secure flags
- [x] Set JWT and cookie maxAge to 30 days
- [x] Tested session persistence across browsers/devices
- [x] User confirmed working: "I have logged in on web and mobile and changes carry across!"

**Actual effort**: 2 hours

### 1.2 Login Performance Optimization ✅
**Problem**: Login takes 5+ seconds

**Completed**:
- [x] Added performance logging to auth API route
- [x] Performance improved with cookie configuration changes
- [x] User noted training block creation takes 30s (added to backlog for future optimization)

**Actual effort**: 1 hour

### 1.3 Single Active Training Block Validation ✅
**Problem**: Need to ensure only one training block can be active at a time

**Completed**:
- [x] Added validation to `POST /api/macrocycles`
- [x] Added validation to `PATCH /api/macrocycles/[id]` (status changes)
- [x] Added validation to `POST /api/macrocycles/setup`
- [x] Clear error messages when validation fails
- [x] Updated training block setup page with active block modal (pause existing or create as planned)
- [x] Added database constraint (unique partial index on status='active')
- [x] Created TypeScript cleanup script to fix duplicate active blocks

**Actual effort**: 4 hours

---

## Phase 2: Training Block Overview Restructure ✅ COMPLETE

**Goal**: Convert Training Block detail page to an overview/outline page

### 2.1 Training Block Page Redesign ✅
**Current**: Shows all phases and weeks in detail
**New**: Overview with editable metadata and phase list

**Completed**:
- [x] Updated `app/(dashboard)/macrocycles/[id]/page.tsx` - complete redesign
- [x] Made training block name editable (inline editing)
- [x] Display duration with edit capability (date pickers + week calculation)
- [x] Replaced status badge with dropdown (planned, active, paused, completed)
- [x] Added phase goal field to Prisma schema (String, nullable)
- [x] Created phase goal dropdown with 5 options + custom
- [x] Added trainingDaysPerWeek field (1-7 selector)
- [x] Removed week detail display (simplified to phase list only)
- [x] Updated API routes to support new fields
- [x] Maintained collapsible phase sections
- [x] Linked each phase to new Phase Overview page (/mesocycles/[id])

**Database changes applied**:
```prisma
model Mesocycle {
  goal String? // "Hypertrophy", "Strength", "Power", "Maintenance", or custom
  trainingDaysPerWeek Int? // e.g., 3, 4, 5, 6
  warmupNotes String? // Added in Phase 3
}
```

**API Updates completed**:
- [x] `PATCH /api/macrocycles/[id]` - update name, dates, status
- [x] `POST /api/mesocycles` - create with goal, trainingDaysPerWeek
- [x] `PATCH /api/mesocycles/[id]` - update goal, trainingDaysPerWeek

**Actual effort**: 6 hours

---

## Phase 3: Training Phase Overview Page ✅ COMPLETE

**Goal**: Create the new Training Phase Overview page with workout and exercise management

### 3.1 Create New Page ✅
**Path**: `app/(dashboard)/mesocycles/[id]/page.tsx` (NEW - recreated after Session 6 deletion)

**Completed**:
- [x] Created new mesocycle detail page from scratch
- [x] Fetch mesocycle with full nested data (microcycles → workouts → exercises → logs)
- [x] Implemented horizontal week navigation (scroll-friendly buttons)
- [x] Display week number and date range per microcycle
- [x] Show collapsible workout cards per week
- [x] Display workout title with week number (e.g., "Week 1 - Push")
- [x] Display editable day/date with dropdown (all workouts, including completed)
- [x] Implement expand/collapse for workout details (default: all expanded)
- [x] Show exercise list when expanded with all details

**UI Components implemented**:
- [x] Horizontal week button scroller (touch-friendly)
- [x] Collapsible workout sections (Set-based state)
- [x] Workout card component with day selector
- [x] Completed workout badge ("✓ Completed")

**API route**:
- [x] Updated `GET /api/mesocycles/[id]` to include full nested data
- [x] Updated `PATCH /api/workouts/[id]` to allow day editing for ALL workouts

**Actual effort**: 6 hours

### 3.2 Warm-up Section ✅
**Completed**:
- [x] Added `warmupNotes` field to Mesocycle model (String, nullable)
- [x] Added `warmupNotes` field to Workout model (String, nullable)
- [x] Updated API schemas to accept warmupNotes
- [x] Schema applied via `npm run db:push`

**Note**: UI for warm-up editing deferred to Phase 4 (focused on exercise management first per user request)

**Actual effort**: 1 hour

### 3.3 Exercise Management ✅ (NEW - user requested)
**Completed**:
- [x] Fetch all exercises on page load for dropdowns
- [x] Add exercise functionality (inline form, "Add Exercise" button)
- [x] Edit exercise details (inline form with all fields: sets, reps, RIR, tempo, rest, notes)
- [x] Delete exercise with confirmation prompt
- [x] Change exercise in workout (exercise dropdown in edit form)
- [x] Exercise reordering with up/down arrows (⬆️⬇️)
- [x] Swap orderIndex values via parallel PATCH requests
- [x] Disable arrows at boundaries (first/last exercise)
- [x] Hide all controls for completed workouts
- [x] Mobile-friendly touch targets and color-coded actions
- [x] TypeScript fixes for nullable fields (targetRir, restPeriod)

**API routes used**:
- [x] `GET /api/exercises` - fetch exercise library
- [x] `POST /api/workout-exercises` - add exercise to workout
- [x] `PATCH /api/workout-exercises/[id]` - update exercise details, orderIndex
- [x] `DELETE /api/workout-exercises/[id]` - remove exercise

**Actual effort**: 4 hours

**Phase 3 Total Effort**: 11 hours
```prisma
model Mesocycle {
  // ... existing fields
  warmupNotes String?
}

model Workout {
  // ... existing fields
  warmupNotes String?
}
```

**Estimated effort**: 3-4 hours

---

## Phase 4: Phase Overview Editing Features (Priority: HIGH)

**Goal**: Add all editing capabilities to the Phase Overview page

### 4.1 Workout Day Editing
**Tasks**:
- [ ] Add day/date picker to each workout card
- [ ] Allow editing for ALL workouts (even completed ones)
- [ ] Update `PATCH /api/workouts/[id]` to handle day changes
- [ ] Update UI to show current day with edit icon
- [ ] Validate day changes (no conflicts in same week)

**Estimated effort**: 3-4 hours

### 4.2 Drag & Drop Workout Reordering
**Tasks**:
- [ ] Install drag-and-drop library (e.g., `@dnd-kit/core`, `react-beautiful-dnd`)
- [ ] Implement drag handles on workout cards
- [ ] Allow reordering within same week
- [ ] Update `orderIndex` or similar field in database
- [ ] Persist new order via API
- [ ] Add visual feedback during drag

**Database consideration**:
- May need `orderIndex` field on Workout model if not already present

**Estimated effort**: 5-6 hours

### 4.3 Exercise Management
**Tasks**:
- [ ] Display all exercises in expanded workout view
- [ ] Add "Add Exercise" button per workout
- [ ] Exercise selection modal (from exercise library)
- [ ] Edit exercise parameters:
  - Target sets
  - Target reps
  - RIR (Reps in Reserve)
  - Tempo/cadence
  - Rest period
- [ ] Remove exercise functionality
- [ ] Disable editing for completed workouts
- [ ] Use existing WorkoutExercise API routes
- [ ] Update UI to match mobile-friendly patterns

**Estimated effort**: 6-8 hours

### 4.4 "Apply to Rest of Phase" Functionality
**Tasks**:
- [ ] Add "Apply to rest of phase" checkbox/button at week level
- [ ] Add "Apply to rest of phase" checkbox/button at workout level
- [ ] Create API endpoint: `POST /api/mesocycles/[id]/apply-changes`
- [ ] Backend logic to duplicate workout structure to remaining weeks
- [ ] Show confirmation modal with preview of affected weeks
- [ ] Handle partial application (some weeks may have completed workouts)
- [ ] Validation: don't overwrite completed workouts

**API payload example**:
```typescript
{
  sourceWeekId: string,
  sourceWorkoutId?: string, // if applying single workout
  targetWeekIds: string[], // which weeks to apply to
}
```

**Estimated effort**: 8-10 hours

---

## Phase 5: Workout Logging Enhancements ✅ COMPLETE

**Goal**: Update workout logging page with new note structure and RPE system

### 5.1 Note Structure Changes ✅
**Current**: Notes per set
**New**: Notes per exercise only

**Completed** (Session 13 - Feb 11, 2026):
- [x] Updated UI to remove per-set note fields
- [x] Added exercise-level notes field at bottom of each exercise section
- [x] Exercise notes stored in first set's notes field
- [x] Textarea with "Exercise Notes" label after "Add Set" button
- [x] Notes attached only to set 1 on submission

**Actual effort**: 1.5 hours

### 5.2 RPE 1-5 Scale ✅
**Current**: RIR (Reps in Reserve) tracking
**New**: RPE 1-5 dropdown after each exercise

**Completed** (Session 13 - Feb 11, 2026):
- [x] Added RPE dropdown (1=Too Easy, 2=Easy, 3=Just Right, 4=Hard, 5=Too Much)
- [x] Displayed after "Add Set" button for each exercise
- [x] Calculate overall workout RPE (average of all exercise RPEs)
- [x] Store in database (exerciseRpe in ExerciseLog, overallRpe in WorkoutLog)
- [x] RIR kept for set-level tracking (both coexist)

**Database changes applied**:
```prisma
model ExerciseLog {
  // ... existing fields
  exerciseRpe Int? // 1-5 scale for the exercise
}

model WorkoutLog {
  // ... existing fields
  overallRpe Float? // calculated average
}
```

**Actual effort**: 2 hours

### 5.3 "Up Next" Message ✅
**Completed** (Session 13 - Feb 11, 2026):
- [x] On workout completion, queries for next scheduled workout
- [x] Modal displays:
  - Next workout name (e.g., "Week 2 - Pull")
  - Day of week
  - Date (formatted MM/DD/YYYY)
  - Week number
- [x] Handles case where no next workout exists ("You've completed all workouts in this phase!")
- [x] "Got It" button to close modal
- [x] Fetches mesocycle data to find all workouts in order

**Actual effort**: 2.5 hours

### 5.4 Missing Fields Warning ✅
**Current**: Basic validation
**New**: Explicit warning with options

**Completed** (Session 13 - Feb 11, 2026):
- [x] On "Complete Workout" click, checks for empty weight/rep fields
- [x] Modal shows: "Some sets have incomplete data (X sets)" with detailed warning
- [x] Two buttons: "Continue Without These Sets" and "Go Back"
- [x] If confirmed, marks empty sets as `skipped: true`
- [x] Updated completion logic in `handleComplete` function

**Actual effort**: 1 hour

### 5.5 Skip vs Delete Behavior ✅
**Current**: Skip button exists
**New**: Differentiate skip (strikethrough + preserve) vs delete (remove)

**Completed** (Session 13 - Feb 11, 2026):
- [x] Updated skip button with yellow theme (text-yellow-600, border-yellow-300)
- [x] Skipped sets display with yellow background (bg-yellow-50, border-2 border-yellow-200)
- [x] Applied strikethrough styling to set number and "Skipped" text
- [x] Added ⊘ icon to skipped sets
- [x] Changed "Delete" button label to "Remove" for clarity
- [x] Added confirmation modal for delete with tip suggesting skip as alternative
- [x] Removed browser `window.confirm()` for skip action
- [x] Visual distinction: skip = yellow + strikethrough, delete = confirmation modal

**Actual effort**: 1 hour

**Phase 5 Total Effort**: 8 hours (vs 15-20h estimated)

---

## Phase 6: Advanced Workout Features (Priority: MEDIUM)

**Goal**: Add single-side exercises and superset functionality

### 6.1 Single-Side Exercise Tracking
**Challenge**: Record left/right separately for exercises like split squats

**Tasks**:
- [ ] Add flag to Exercise model: `isSingleSide: boolean`
- [ ] Update exercise creation/edit to mark single-side exercises
- [ ] Modify workout log UI for single-side exercises:
  - Split reps field into "Left" and "Right"
  - Show weight once (assumed same for both sides)
  - Two rest timer triggers per set
- [ ] Update `ExerciseLog` schema to store L/R separately
- [ ] Update API submission to handle split data
- [ ] Display in progress tracking split by side

**Database changes**:
```prisma
model Exercise {
  // ... existing fields
  isSingleSide Boolean @default(false)
}

model ExerciseLog {
  // ... existing fields
  repsLeft Int? // for single-side exercises
  repsRight Int? // for single-side exercises
  // Keep 'reps' for bilateral exercises
}
```

**Estimated effort**: 6-8 hours

### 6.2 Superset Functionality
**Tasks**:
- [ ] Add "Superset with previous?" checkbox to WorkoutExercise
- [ ] Store superset grouping in database
- [ ] Update workout log UI to show supersets grouped visually
- [ ] Suppress rest timer between supersetted exercises
- [ ] Show rest timer after completing superset group
- [ ] Update WorkoutExercise model to include superset flag

**Database changes**:
```prisma
model WorkoutExercise {
  // ... existing fields
  supersetWithPrevious Boolean @default(false)
}
```

**UI Design**:
- Visual bracket or connector between supersetted exercises
- Single rest timer after group completion

**Estimated effort**: 5-6 hours

---

## Phase 7: Dashboard Redesign (Priority: MEDIUM)

**Goal**: Restructure dashboard for better workout-focused UX

### 7.1 Next Workout Prominent Card
**Tasks**:
- [ ] Move "Next Workout" to top of dashboard (first element)
- [ ] Design prominent card with:
  - Large workout name
  - Day of week and date
  - Week number and phase
  - "Start Workout" CTA button
- [ ] Query logic to find next scheduled workout
- [ ] Handle case where all workouts are complete
- [ ] Make card visually distinct (larger, highlighted)

**Estimated effort**: 3-4 hours

### 7.2 Manual Workout Button Repositioning
**Tasks**:
- [ ] Move "Log a Manual Workout" button to bottom of page
- [ ] Change to distinct button style (secondary or outlined)
- [ ] Ensure still visible but not primary action
- [ ] Update link/routing if needed

**Estimated effort**: 1 hour

### 7.3 Current Phase Progress Graphic
**Tasks**:
- [ ] Design visual progress indicator (similar to existing but enhanced)
- [ ] Show current phase name, week number, completion %
- [ ] Animated progress bar
- [ ] Display on dashboard
- [ ] Reuse or enhance existing progress bar component

**Estimated effort**: 3-4 hours

### 7.4 Horizontal Daily Calendar
**Tasks**:
- [ ] Create horizontal scrollable calendar (last 30 days)
- [ ] Show each day as small card/pill
- [ ] Add lifting symbol (dumbbell icon) on days with completed workouts
- [ ] Highlight today
- [ ] Clicking a day could show workout summary (optional)
- [ ] Fetch workout log data for last 30 days

**Component libraries**:
- Consider `react-horizontal-scrolling-menu` or custom

**Estimated effort**: 5-6 hours

### 7.5 Phase Volume Graph
**Tasks**:
- [ ] Add "Total Set Volume per Week" graph to dashboard
- [ ] Calculate: sum of (sets × weight × reps) per week
- [ ] Display only for current active phase
- [ ] Use recharts (already in project)
- [ ] Line or bar chart
- [ ] X-axis: Week number, Y-axis: Total volume (kg or lbs)

**Estimated effort**: 4-5 hours

---

## Phase 8: Progress Page Enhancements (Priority: MEDIUM)

**Goal**: Add muscle group filtering and RM table

### 8.1 Volume Graph with Muscle Group Filter
**Tasks**:
- [ ] Update existing volume graph or create new one
- [ ] Add dropdown to select muscle group
- [ ] Filter exercise logs by muscle group
- [ ] Calculate total volume per week for selected muscle group
- [ ] Display filtered graph
- [ ] Default to "All Muscle Groups"

**Data challenge**:
- Need to map exercises to muscle groups
- Use existing `Exercise.muscleGroups` array field

**Estimated effort**: 5-6 hours

### 8.2 RM Table for Active Phase
**Tasks**:
- [ ] Create new component: RM Table
- [ ] Calculate estimated 1RM, 5RM, 10RM using Epley formula
- [ ] Display all exercises in active phase
- [ ] Show last lift date and details (e.g., "10x50kg on 24/1/26")
- [ ] Update calculations when new workout logs added
- [ ] Format as clean table:
  ```
  Exercise       | Est 1RM | Est 5RM | Est 10RM | Last Lift
  Bench Press    | 65      | 57.5    | 52.5     | 10x50kg (24/1/26)
  ```

**Formulas**:
- 1RM = weight × (1 + reps/30)
- 5RM = 1RM × 0.85
- 10RM = 1RM × 0.75

**Estimated effort**: 5-6 hours

---

## Phase 9: Training Block Menu Improvements (Priority: LOW)

**Goal**: Add clone, enhanced delete, and status management

### 9.1 Clone Training Block
**Tasks**:
- [ ] Add "Clone" button to training block list page
- [ ] Create API endpoint: `POST /api/macrocycles/[id]/clone`
- [ ] Deep copy entire structure:
  - Macrocycle → Mesocycles → Microcycles → Workouts → WorkoutExercises
- [ ] New clone starts as "planned" status
- [ ] Adjust dates (prompt user for new start date)
- [ ] Show success message with link to new block

**Estimated effort**: 6-8 hours

### 9.2 Enhanced Delete with Warnings
**Tasks**:
- [ ] Add confirmation modal for delete actions
- [ ] Show warning messages:
  - "This will permanently delete all phases, weeks, and workouts"
  - "Workout logs will NOT be deleted and will remain in your history"
- [ ] Require explicit confirmation (e.g., type "DELETE")
- [ ] Cascade delete properly in database
- [ ] Test with active vs planned vs completed blocks

**Estimated effort**: 3-4 hours

### 9.3 Status Editing in List View
**Tasks**:
- [ ] Add status dropdown to each training block card
- [ ] Allow changing: Planned → Active → Completed
- [ ] Enforce single active block validation
- [ ] Show confirmation for status changes
- [ ] Update status via API
- [ ] Reflect changes immediately in UI

**Estimated effort**: 3-4 hours

---

## Testing & Quality Assurance Plan

### Per-Phase Testing
After each phase:
- [ ] Local testing (dev environment)
- [ ] Manual QA of all new features
- [ ] Test on mobile (Samsung Chrome specifically)
- [ ] Test edge cases and error states
- [ ] Verify no regressions in existing features
- [ ] Update MEMORY.md with any new patterns

### Pre-Merge Testing
Before merging to master:
- [ ] Full regression test suite
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] Performance testing (check load times)
- [ ] Database integrity checks
- [ ] Test production build locally

### Deployment Strategy
- [ ] Deploy to Vercel preview environment first
- [ ] Test with production database (non-destructive operations only)
- [ ] User acceptance testing
- [ ] Monitor for errors in production
- [ ] Rollback plan if critical issues found

---

## Estimated Timeline

| Phase | Effort (hours) | Priority |
|-------|----------------|----------|
| Phase 1: Critical Fixes | 8-13 | CRITICAL |
| Phase 2: Training Block Restructure | 6-8 | HIGH |
| Phase 3: Phase Overview Foundation | 11-14 | HIGH |
| Phase 4: Phase Overview Editing | 22-28 | HIGH |
| Phase 5: Workout Logging Enhancements | 15-20 | HIGH |
| Phase 6: Advanced Workout Features | 11-14 | MEDIUM |
| Phase 7: Dashboard Redesign | 16-20 | MEDIUM |
| Phase 8: Progress Enhancements | 10-12 | MEDIUM |
| Phase 9: Training Block Menu | 12-16 | LOW |
| **TOTAL** | **111-145 hours** | |

### Recommended Approach
1. **Week 1-2**: Phases 1-2 (Critical fixes + Training Block restructure)
2. **Week 3-4**: Phase 3 (Phase Overview foundation)
3. **Week 5-6**: Phase 4 (Phase Overview editing)
4. **Week 7**: Phase 5 (Workout logging enhancements)
5. **Week 8**: Phase 6 (Advanced workout features)
6. **Week 9**: Phase 7 (Dashboard redesign)
7. **Week 10**: Phase 8 (Progress enhancements)
8. **Week 11**: Phase 9 (Training block menu)
9. **Week 12**: Testing, bug fixes, polish

**Total estimated timeline: 10-12 weeks of development**

---

## Risk Assessment

### High Risk Items
1. **Login persistence issue** - Could affect all users if misconfigured
2. **Single active block validation** - Database constraints + API validation needed
3. **"Apply to rest of phase"** - Complex logic, risk of data corruption
4. **Drag & drop reordering** - Can be finicky on mobile
5. **Single-side exercises** - Schema changes affect existing data

### Mitigation Strategies
- Thorough testing before each merge
- Database backups before schema changes
- Feature flags for risky new features
- Incremental rollout to production
- Clear rollback procedures

---

## Database Schema Changes Summary

### New Fields
```prisma
// Mesocycle
trainingDaysPerWeek Int?
goal String?
warmupNotes String?

// Workout
warmupNotes String?

// Exercise
isSingleSide Boolean @default(false)

// ExerciseLog
exerciseRpe Int?
repsLeft Int?
repsRight Int?

// WorkoutLog
overallRpe Decimal?

// WorkoutExercise
supersetWithPrevious Boolean @default(false)
```

### New Constraints
```sql
-- Only one active macrocycle per user
CREATE UNIQUE INDEX unique_active_macrocycle_per_user
ON "Macrocycle" ("userId")
WHERE status = 'active';
```

---

## Next Steps

1. **Review this plan** - Confirm priorities and timeline
2. **Create feature branch** - `git checkout -b feature/scope-update-feb2026`
3. **Start with Phase 1** - Critical fixes first
4. **Update MEMORY.md** - Document new patterns as we build
5. **Regular check-ins** - Review progress after each phase

---

## Notes
- This plan assumes working ~10-15 hours per week on development
- Some phases can be parallelized if multiple developers involved
- Testing time is additional to development estimates
- Plan may adjust based on discoveries during implementation
