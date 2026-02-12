# New Features & Clarifications Backlog

**Date Added**: Feb 12, 2026
**Source**: User email clarifications

---

## 🏋️ Workout Logging Enhancements

### WL-1: Heading Format Cleanup
**Current**: Unclear format
**Desired**: "Week X, Lower - Day, Date" (clean, consistent format)
**Page**: `workouts/[id]/log/page.tsx`
**Effort**: 30min
**Priority**: Low

### WL-2: Prepopulate Weights and Reps ✅
**Status**: Already implemented (Session 3)
**Feature**: Weights/reps auto-fill from last completed workout

### WL-3: Lift History Popup
**Feature**: Quick access to previous sets/reps during workout
**Implementation**:
- Modal/popup accessible from each exercise
- Shows previous workout logs for same exercise
- Display: sets, reps, weight, date
- User can reference without navigating away

**Effort**: 3-4 hours
**Priority**: HIGH - Critical UX improvement

### WL-4: "Complete" Button Per Exercise
**Feature**: Save progress after each exercise (not just full workout)
**Implementation**:
- Button at end of last set for each exercise
- Saves completed sets for that exercise
- Allows progressive workout completion
- User can pause and resume workout

**Effort**: 2-3 hours
**Priority**: MEDIUM

### WL-5: Exercise Swap with Scope
**Feature**: Replace exercise during workout with phase-wide option
**Implementation**:
- "Swap Exercise" button on exercise card
- Select replacement from exercise library
- Prompt: "Apply to just this week, or remainder of phase?"
- Update single workout OR all remaining workouts in phase
- Similar to warmup "pin to same-day" logic

**Effort**: 4-5 hours
**Priority**: HIGH

### WL-6: Progressive Workout Saving (Active Workout State)
**Feature**: Workout remains active when navigating away
**Implementation**:
- Save workout state to localStorage or database (draft status)
- "Resume Workout" button appears in navigation when active workout exists
- Returning to workout restores all entered data
- Clear draft on completion or explicit cancel
- Warning if trying to start new workout while one is active

**Effort**: 5-6 hours
**Priority**: HIGH - Major UX improvement
**Technical Notes**:
- Consider localStorage for client-side persistence
- Or add `status: 'draft'` to WorkoutLog model
- Need cleanup logic for abandoned drafts

---

## 📚 Exercise Library Enhancements

### EL-1: Unilateral vs Bilateral Flag
**Feature**: Mark exercises as unilateral (single-side) or bilateral
**Implementation**:
- Add `isUnilateral: Boolean` to Exercise model (default: false)
- Checkbox in exercise creation/edit forms
- If unilateral: split reps input into "Left" and "Right"
- Store as `repsLeft` and `repsRight` in ExerciseLog
- Progress tracking split by side

**Database Changes**:
```prisma
model Exercise {
  isUnilateral Boolean @default(false) // renamed from isSingleSide
}

model ExerciseLog {
  repsLeft  Int? // for unilateral exercises
  repsRight Int? // for unilateral exercises
  // Keep 'reps' for bilateral exercises
}
```

**Effort**: 6-8 hours
**Priority**: HIGH
**Note**: Overlaps with Phase 6 single-side tracking

### EL-2: Reps vs Timed Exercise Type
**Feature**: Exercises can be reps-based OR time-based
**Implementation**:
- Add `exerciseType: Enum('reps', 'timed')` to Exercise model (default: 'reps')
- Radio buttons in exercise creation: "Reps" or "Timed"
- If timed:
  - Replace "Reps" input with "Duration (seconds)" input
  - Add built-in timer in workout log
  - Start/stop timer per set
  - Log duration in seconds instead of reps

**Database Changes**:
```prisma
enum ExerciseType {
  REPS
  TIMED
}

model Exercise {
  exerciseType ExerciseType @default(REPS)
}

model ExerciseLog {
  reps     Int?   // for reps-based exercises
  duration Int?   // for timed exercises (seconds)
}
```

**Effort**: 5-6 hours
**Priority**: MEDIUM

### EL-3: Bodyweight Exercise Default
**Feature**: Bodyweight exercises default weight to "BW" with override
**Implementation**:
- Add `isBodyweight: Boolean` to Exercise model (default: false)
- If bodyweight:
  - Weight input shows "BW" placeholder
  - User can enter number to override (e.g., "+10" for weighted pull-ups)
  - Store as actual weight value in database
  - Display as "BW" if no override, "BW +10kg" if added weight

**Effort**: 2-3 hours
**Priority**: LOW

---

## 🧙 Training Plan Wizard Changes

### TPW-1: Simplified Wizard Flow
**Current**: Long wizard with many steps
**Desired**: Stop after training block duration, go to overview

**New Flow**:
1. Enter training block name
2. Enter start date and duration (weeks)
3. **Stop here** → Navigate to Training Block Overview page
4. User selects focus for each phase (on overview page)
5. User sets training days per week per phase
6. User adds training split per phase

**Changes Required**:
- Shorten wizard to 2 steps only
- Move phase configuration to Training Block Overview page
- Add "Configure Phases" section to overview

**Effort**: 4-5 hours
**Priority**: MEDIUM

---

## 📋 Phase Details Page Redesign (MAJOR)

### PD-1: Clean Up Screen Real Estate
**Current**: Crowded, lots of scrolling, disconnected elements
**Desired**: Clean, compact, swipeable, mobile-first

**Changes**:
1. ✅ Remove "Phase Warmup" box
2. ✅ Remove dates, goal, training details from top
3. ✅ Shrink heading significantly
4. ✅ Move "Back to Training Block" higher on page
5. ✅ Remove dysfunctional drag-and-drop for workouts
6. ✅ Remove disconnected day slider at top
7. ✅ Make entire page swipeable (swipe left/right for weeks)
8. ✅ Show workouts as small compact boxes (title only: "Upper Body 1", "Lower Body 2")
9. ✅ All week workouts fit on mobile screen without scrolling
10. ✅ Remove all edit functionality from this page

**Effort**: 8-10 hours
**Priority**: CRITICAL - Major UX overhaul

### PD-2: Separate Edit Workout Page
**Feature**: Click workout to open edit page (similar to log workout)
**Implementation**:
- New route: `/workouts/[id]/edit`
- Format similar to log workout page (clean, streamlined)
- Exercise details spread across page (not cramped)
- Delete and Edit buttons at bottom of each exercise card
- Drag-and-drop for exercise reordering (remove promote/demote arrows)
- Save button with scope prompt

**Effort**: 6-8 hours
**Priority**: HIGH

### PD-3: Save with Scope Prompt
**Feature**: "Apply changes to remainder of phase?"
**Implementation**:
- On save, show modal:
  - "Do you want these changes to apply to '[Workout Name]' for the remainder of the phase?"
  - Two buttons: "Yes - Apply to All" / "No - This Week Only"
- If Yes: Update all matching workouts in remaining weeks
- If No: Update only current workout
- Logic similar to "pin warmup to same-day workouts"

**Effort**: 3-4 hours
**Priority**: HIGH

### PD-4: Remove Week View
**Status**: Confirmed removal
**Action**: Delete week detail view, rely on phase overview only

**Effort**: 1 hour
**Priority**: LOW

---

## 📅 Workout History Calendar

### WHC-1: Monthly Calendar View
**Feature**: Visual calendar showing completed workouts
**Implementation**:
- New route: `/workout-history` or `/calendar`
- Monthly calendar grid (current month by default)
- Navigation: previous/next month arrows
- Completed workouts: show "strongman stick figure" icon 🏋️
- Click workout to see details (modal or navigate to workout log)
- Highlight today's date

**Effort**: 6-8 hours
**Priority**: HIGH

### WHC-2: Workout History List Below Calendar
**Feature**: List of completed workouts below calendar
**Implementation**:
- Order: most recent first (same as dashboard)
- Display: workout name, date, duration, RPE
- Click to view full workout details
- Pagination or infinite scroll for older workouts

**Effort**: 2-3 hours
**Priority**: MEDIUM

### WHC-3: Calendar in Banner Menu
**Feature**: Add calendar icon to navigation
**Implementation**:
- Add calendar icon to bottom navigation (mobile)
- Add to sidebar (desktop)
- Navigate to `/workout-history` page
- Badge showing workouts this week (optional)

**Effort**: 1-2 hours
**Priority**: MEDIUM

### WHC-4: In-Workout Quick History (Critical)
**Feature**: Quick lift history access during workout
**Note**: Critical since we're removing week summary
**Implementation**: See WL-3 above (Lift History Popup)

**Effort**: 3-4 hours
**Priority**: CRITICAL

---

## 📊 Summary by Category

### Critical Priority (Complete First)
1. **Phase Details Redesign** (PD-1, PD-2, PD-3) - 17-22 hours
2. **Workout History Calendar** (WHC-1, WHC-3, WHC-4) - 10-14 hours
3. **Lift History Popup** (WL-3) - 3-4 hours

**Total Critical**: 30-40 hours

### High Priority
1. **Exercise Swap with Scope** (WL-5) - 4-5 hours
2. **Progressive Workout Saving** (WL-6) - 5-6 hours
3. **Unilateral/Bilateral Exercises** (EL-1) - 6-8 hours

**Total High**: 15-19 hours

### Medium Priority
1. **"Complete" Button Per Exercise** (WL-4) - 2-3 hours
2. **Reps vs Timed Exercises** (EL-2) - 5-6 hours
3. **Training Plan Wizard** (TPW-1) - 4-5 hours
4. **Workout History List** (WHC-2) - 2-3 hours

**Total Medium**: 13-17 hours

### Low Priority
1. **Heading Format Cleanup** (WL-1) - 30min
2. **Bodyweight Exercise Default** (EL-3) - 2-3 hours
3. **Remove Week View** (PD-4) - 1 hour

**Total Low**: 3.5-4.5 hours

---

## 🎯 Recommended Phasing

### NEW Phase 6A: Phase Details Redesign (Priority 1)
**Effort**: 17-22 hours
**Tasks**: PD-1, PD-2, PD-3, PD-4
**Outcome**: Clean, swipeable phase overview with separate edit page

### NEW Phase 6B: Workout History Calendar (Priority 2)
**Effort**: 10-14 hours
**Tasks**: WHC-1, WHC-2, WHC-3, WL-3
**Outcome**: Calendar view with lift history popup

### NEW Phase 6C: Advanced Exercise Features (Priority 3)
**Effort**: 15-19 hours
**Tasks**: WL-5, WL-6, EL-1
**Outcome**: Exercise swap, progressive saving, unilateral exercises

### ORIGINAL Phase 6: Additional Exercise Types (Priority 4)
**Effort**: 7-9 hours
**Tasks**: EL-2, EL-3
**Outcome**: Timed exercises, bodyweight defaults

---

## 🔄 Integration with Existing Plan

**Recommendation**: Replace original Phase 6 (Advanced Workout Features) with new priorities:

1. **Phase 6A**: Phase Details Redesign (17-22h)
2. **Phase 6B**: Workout History Calendar (10-14h)
3. **Phase 6C**: Advanced Exercise Features (15-19h)
4. **Phase 6D**: Additional Exercise Types (7-9h)

**Total**: 49-64 hours

**Then continue with**:
- Phase 7: Dashboard Redesign (16-20h)
- Phase 8: Progress Enhancements (10-12h)
- Phase 9: Training Block Menu (12-16h)

---

**Next Steps**: Review and prioritize these features, then integrate into PLAN.md
