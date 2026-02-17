# Known Issues & Pending Fixes

**Last Updated**: Feb 17, 2026 (End of Session 18)
**Project Status**: Production stable, all changes deployed

---

## 🐛 Active Issues

### Custom Split Defaults to Full Body
**Status**: 🔴 Known bug
**Priority**: Low
**Discovered**: Session 16

**Description**:
When "Custom" training split is selected in phase configuration, workout generation defaults to using the Full Body template instead of allowing custom configuration.

**Location**: `app/api/mesocycles/[id]/generate-workouts/route.ts` line 14

**Current Code**:
```typescript
'Custom': ['Full Body']  // Wrong
```

**Expected Behavior**:
- Should prompt user to select which workout types to use, OR
- Create empty workouts for manual configuration

**Impact**: Users cannot generate truly custom workout splits

**Workaround**: Use "Manual" mode to create empty workouts, then configure manually

**Estimated Effort**: 1-2 hours

---

## ⏳ Deferred Features

### Mobile Drag & Drop Not Working
**Status**: 🟡 Deferred (low priority)
**Discovered**: Session 9
**Estimated Effort**: 2-3 hours

**Issue**: Touch sensor not working reliably on mobile for workout reordering

**Current State**:
- ✅ Works perfectly on desktop/laptop
- ❌ Touch gestures not reliable on mobile

**Possible Solutions**:
- Arrow buttons (like exercise reordering) as mobile alternative
- Debug @dnd-kit touch sensor configuration
- Different drag-and-drop library with better mobile support

**User Impact**: Low - users can reorder on desktop, mobile has workaround

---

## ✅ Pre-existing Warnings (Accepted)

### @next/swc Version Mismatch
**Status**: 🟢 Non-blocking
**Impact**: None - warning only, no runtime issues

**Details**:
- Local: 15.5.7
- Next.js: 15.5.11

**Action**: Will resolve with Next.js updates

---

## 🎉 Recently Fixed (Sessions 13-18)

### Session 18: Validation & Number Input Bugs (Feb 16, 2026)
**Commits**: `b0a3ced`, `afc9a62`, `00454f5`, `2dedf59`

**Fixed Issues**:
1. ✅ **Critical validation bug** - Empty exerciseId and targetSets = 0 allowed
2. ✅ **Leading zero bug** - Number inputs showing "0" when cleared
3. ✅ **Timing issue** - Rest timer not working for newly added exercises
4. ✅ **Add exercise validation** - No client-side validation with error messages

**Solution**:
- Changed form state from `number` to `string` for all number inputs
- Parse to number only on submit, not on onChange
- Fetch workout data BEFORE creating sets (timing fix)
- Added red borders and error messages for invalid inputs

**Files Modified**:
- `workouts/[id]/edit/page.tsx`
- `workouts/[id]/log/page.tsx`

---

### Session 17: useEffect Warnings (Feb 15, 2026)
**Status**: ✅ Fixed - Zero warnings

**Previous State**:
- 6+ useEffect dependency warnings in multiple pages
- Non-blocking but cluttered build output

**Fixed**:
- All useEffect hooks properly configured
- Added global error boundary component
- Improved app stability

**Impact**: Clean builds, better error recovery

---

### Session 15: Critical Bug Fixes & UX (Feb 13, 2026)
**Status**: ✅ 20 commits merged

**Major Fixes**:
1. ✅ **Dashboard next workout** - Was showing completed workouts
2. ✅ **Workout save validation** - NaN errors, empty strings
3. ✅ **Duplicate sets bug** - Sets appearing multiple times in logs
4. ✅ **Crash prevention** - Defensive error handling throughout
5. ✅ **Duplicate workout names** - Now auto-labeled with A/B/C suffixes
6. ✅ **Navigation deadend** - Fixed post-wizard navigation

**UX Improvements**:
- "In Progress" indicators on dashboard and phase overview
- Progressive saving with draft detection
- Simplified exercise swap (removed scope modal)
- Removed "Up Next" modal (user feedback: unnecessary)

---

### Session 13: Workout Logging Enhancements (Feb 11, 2026)
**Status**: ✅ Phase 5 complete

**Commits**: `29e99e8`, `2737670`, `ddfca0d`, `3202b3b`, `a9f593f`

**Features Added**:
1. ✅ **Missing fields warning modal** - Alerts before completing with empty sets
2. ✅ **Per-exercise notes** - Simplified from per-set notes
3. ✅ **RPE 1-5 scale** - Exercise-level + overall average
4. ✅ **"Up Next" message** - Shows next workout after completion
5. ✅ **Skip vs delete visual distinction** - Yellow theme for skipped sets

**Schema Changes**:
- Added `exerciseRpe` (Int?) to ExerciseLog
- Added `overallRpe` (Float?) to WorkoutLog

---

### Session 12: Custom Exercise UI Polish (Feb 11, 2026)
**Commit**: `9945d37`

**Issues Resolved**:
1. ✅ **Poor visibility** - Changed to gray backgrounds (bg-gray-50, bg-gray-100)
2. ✅ **Low contrast** - Thicker borders (border-2, border-gray-400)
3. ✅ **Missing from edit workflow** - Added to both Add and Edit dropdowns
4. ✅ **Auto-selection** - Newly created exercises auto-selected

**Files Modified**: `app/(dashboard)/mesocycles/[id]/page.tsx` (+133, -15 lines)

**Testing**: ✅ Mobile testing confirmed successful

---

## 🎯 Next Priorities

### Phase 6D: Additional Exercise Types (4-5 hours)
**Status**: 📋 Planned for next session

**Features**:
1. Timed exercises (duration instead of reps)
2. Bodyweight exercise defaults
3. Heading format cleanup

**Database Changes Needed**:
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

### Medium Priority Features (8-12 hours)
- Progressive overload recommendations
- Training volume analytics
- Exercise charts and metrics
- Export workout data (CSV/PDF)

---

## 📊 Project Health

**Current State** (Session 18 End):
- ✅ Zero build errors
- ✅ Zero useEffect warnings (fixed Session 17)
- ✅ Production stable
- ✅ All features deployed
- 🟡 1 active bug (Custom split, low impact)
- 🟡 1 deferred feature (Mobile drag & drop, low priority)

**Total Effort**: 74 hours across 18 sessions
**Efficiency**: 26% faster than estimated

**Production**: https://strength-training-app.vercel.app

---

## 🔍 Issue Tracking Process

### When Discovering New Issues:
1. Document in this file with status, priority, session discovered
2. Describe workaround if available
3. Estimate effort to fix
4. Add to PLAN.md if it's a future enhancement

### When Resolving Issues:
1. Move to "Recently Fixed" section
2. Document the solution and commits
3. Note files modified
4. Update status in this file

---

**Repository**: https://github.com/ross-adam-d/strength-training-app.git
**Branch**: `master`
**Latest Commit**: `2dedf59` - "Fix timing issue: refresh workout data before creating sets"
