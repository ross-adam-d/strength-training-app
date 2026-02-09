# Implementation Plan - February 2026 Scope Update

## Overview
This document outlines the implementation plan for the major scope changes defined in "Updated scope 8.2.26.docx". These changes represent a significant restructuring of the app's training cycle management and workout logging functionality.

## Branch Strategy
- **Branch Name**: `feature/scope-update-feb2026`
- **Base**: `master` (current production)
- **Merge Strategy**: Incremental merges after each phase is tested and stable

---

## Phase 1: Critical Fixes & Foundation (Priority: CRITICAL)

**Goal**: Fix blocking issues and prepare database/validation foundation

### 1.1 Login Persistence Issue
**Problem**: Login not carrying over between devices/browsers
**Investigation needed**:
- Check NextAuth session configuration
- Verify JWT token settings
- Review cookie configuration (domain, secure, sameSite)
- Test session storage vs database sessions

**Tasks**:
- [ ] Investigate session configuration in `app/api/auth/[...nextauth]/route.ts`
- [ ] Review `NEXTAUTH_SECRET` and `NEXTAUTH_URL` in production
- [ ] Test session persistence across browsers/devices
- [ ] Consider switching to database sessions if needed
- [ ] Update documentation with session strategy

**Estimated effort**: 2-4 hours

### 1.2 Login Performance Optimization
**Problem**: Login takes 5+ seconds
**Investigation needed**:
- Profile the authentication flow
- Check database query performance
- Review API response times
- Investigate client-side rendering delays

**Tasks**:
- [ ] Add performance logging to auth API route
- [ ] Profile database queries during login
- [ ] Check if Prisma client is properly cached
- [ ] Optimize any slow queries
- [ ] Consider adding loading states during auth
- [ ] Test with production database connection pooling

**Estimated effort**: 3-5 hours

### 1.3 Single Active Training Block Validation
**Problem**: Need to ensure only one training block can be active at a time

**Tasks**:
- [ ] Add validation to API route: `POST /api/macrocycles`
- [ ] Add validation to API route: `PATCH /api/macrocycles/[id]` (status changes)
- [ ] When setting a block to "active", check if another is already active
- [ ] Provide clear error message if validation fails
- [ ] Update training block setup page to show warning
- [ ] Update training block list page to enforce via UI
- [ ] Add database constraint (unique partial index on status='active')

**Database migration**:
```sql
-- Ensure only one active macrocycle per user
CREATE UNIQUE INDEX unique_active_macrocycle_per_user
ON "Macrocycle" ("userId")
WHERE status = 'active';
```

**Estimated effort**: 3-4 hours

---

## Phase 2: Training Block Overview Restructure (Priority: HIGH)

**Goal**: Convert Training Block detail page to an overview/outline page

### 2.1 Training Block Page Redesign
**Current**: Shows all phases and weeks in detail
**New**: Overview with editable metadata and phase list

**Tasks**:
- [ ] Update `app/(dashboard)/macrocycles/[id]/page.tsx`
- [ ] Make training block name editable (inline or modal)
- [ ] Display duration (calculated from startDate/endDate) with edit capability
- [ ] Add "Training Split" display per phase (e.g., "5 days/week")
- [ ] Add phase goal field to Prisma schema (enum or string)
- [ ] Create phase goal dropdown (Hypertrophy, Strength, Power, Maintenance, Custom)
- [ ] Remove week detail display (keep phase list only)
- [ ] Update API routes to support new fields
- [ ] Maintain collapsible phase sections
- [ ] Link each phase to new Phase Overview page

**Database changes**:
```prisma
model Mesocycle {
  // ... existing fields
  trainingDaysPerWeek Int? // e.g., 3, 4, 5, 6
  goal String? // "Hypertrophy", "Strength", "Power", "Maintenance", or custom
}
```

**API Updates**:
- [ ] `PATCH /api/macrocycles/[id]` - update name, dates
- [ ] `PATCH /api/mesocycles/[id]` - update goal, trainingDaysPerWeek

**Estimated effort**: 6-8 hours

---

## Phase 3: Training Phase Overview Page - Foundation (Priority: HIGH)

**Goal**: Create the new Training Phase Overview page with basic structure

### 3.1 Create New Page
**Path**: `app/(dashboard)/mesocycles/[id]/page.tsx` (NEW - was deleted in Session 6)

**Tasks**:
- [ ] Create new mesocycle detail page
- [ ] Fetch mesocycle with all microcycles and workouts
- [ ] Implement horizontal week navigation (scroll/swipe)
- [ ] Display week number and date range
- [ ] Show collapsible workout cards per week
- [ ] Display workout title with week number (e.g., "Week 1 - Push")
- [ ] Display editable day/date below title
- [ ] Implement expand/collapse for workout details
- [ ] Show exercise list when expanded (from WorkoutExercise)

**UI Components needed**:
- Horizontal week scroller (touch/drag friendly)
- Collapsible workout sections
- Workout card component

**API route**:
- [ ] Update or create `GET /api/mesocycles/[id]` to include full nested data

**Estimated effort**: 8-10 hours

### 3.2 Warm-up Section
**Tasks**:
- [ ] Add `warmupNotes` field to Mesocycle model
- [ ] Add `warmupNotes` field to Workout model
- [ ] Display warm-up section in phase overview (collapsible)
- [ ] Display warm-up section in workout view (collapsible)
- [ ] Make editable for non-completed workouts
- [ ] Update API routes to handle warmupNotes

**Database changes**:
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

## Phase 5: Workout Logging Enhancements (Priority: HIGH)

**Goal**: Update workout logging page with new note structure and RPE system

### 5.1 Note Structure Changes
**Current**: Notes per set
**New**: Notes per exercise only

**Tasks**:
- [ ] Update UI to remove per-set note fields
- [ ] Add exercise-level notes field at bottom of each exercise section
- [ ] Update `ExerciseLog` API to handle exercise notes
- [ ] Migrate existing set notes to exercise notes (data migration script)
- [ ] Update database schema if needed

**Database consideration**:
- Check if `ExerciseLog.notes` exists or if notes are per-set

**Estimated effort**: 4-5 hours

### 5.2 RPE 1-5 Scale
**Current**: RIR (Reps in Reserve) tracking
**New**: RPE 1-5 dropdown at end of last set

**Tasks**:
- [ ] Add RPE dropdown (1=Too Easy, 2=Easy, 3=Just Right, 4=Hard, 5=Too Much)
- [ ] Display after last set of each exercise
- [ ] Calculate overall workout RPE (average of all exercise RPEs)
- [ ] Display overall RPE on completion screen
- [ ] Store in database (ExerciseLog or WorkoutLog)
- [ ] Keep RIR for set-level tracking (don't remove)

**Database changes**:
```prisma
model ExerciseLog {
  // ... existing fields
  exerciseRpe Int? // 1-5 scale for the exercise
}

model WorkoutLog {
  // ... existing fields
  overallRpe Decimal? // calculated average
}
```

**Estimated effort**: 4-5 hours

### 5.3 "Up Next" Message
**Tasks**:
- [ ] On workout completion, query for next scheduled workout
- [ ] Display modal or card with:
  - Next workout name (e.g., "Week 2 - Pull")
  - Day of week
  - Date
  - Phase info
- [ ] Handle case where no next workout exists
- [ ] Add "Continue" button to close/navigate

**Estimated effort**: 2-3 hours

### 5.4 Missing Fields Warning
**Current**: Basic validation
**New**: Explicit warning with options

**Tasks**:
- [ ] On "Complete Workout" click, check for empty weight/rep fields
- [ ] Show modal: "Some sets are incomplete. Incomplete sets will be marked as skipped. Continue?"
- [ ] Two buttons: "Yes, Complete Workout" and "No, Resume Workout"
- [ ] If confirmed, mark empty sets as `skipped: true`
- [ ] Update completion logic in `handleComplete` function

**Estimated effort**: 2-3 hours

### 5.5 Skip vs Delete Behavior
**Current**: Skip button exists
**New**: Differentiate skip (strikethrough + preserve) vs delete (remove)

**Tasks**:
- [ ] Update skip button to apply strikethrough styling to row
- [ ] Preserve intended weight/reps in skipped sets (show but strike through)
- [ ] Add separate "Delete" button (trash icon)
- [ ] Delete removes set from UI and prevents submission
- [ ] Update submit logic to handle both states
- [ ] Visual distinction: skip = strike + grey, delete = removed

**Estimated effort**: 3-4 hours

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
