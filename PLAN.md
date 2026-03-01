# Strength Training App - Project Plan

## 📍 Current Status (Updated: Mar 1, 2026 - Session 43)

**Production App**: https://strength-training-app.vercel.app
**Repository**: https://github.com/ross-adam-d/strength-training-app.git
**Branch**: `feature/stripe-integration` (active development) | `master`: `ffa2cca`
**Latest Commit**: `e178ae5` - pbX copy/UX updates
**Status**: Coach extension in progress (Session 43). Blocked on live Stripe setup before merging feature branch.

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
- **Status**: Merged to master

### Phase 6B: Workout History Calendar (4h)
- ✅ Monthly calendar view with workout indicators
- ✅ Lift history popup during active workout
- ✅ Navigation integration (calendar icon in bottom nav)
- **Sessions**: 14 (Feb 12, 2026)
- **Status**: Merged to master

### Phase 6C: Critical Bug Fixes & UX Polish (3h)
- ✅ Fixed dashboard showing wrong workout (skip completed workouts)
- ✅ Fixed workout save validation errors (NaN handling, empty strings)
- ✅ Fixed duplicate sets appearing in workout logs
- ✅ Auto-label duplicate workout names (Lower A, Lower B, etc.)
- ✅ Added defensive error handling to prevent crashes
- ✅ Added 30-second timeout for workout save
- ✅ Added "In Progress" indicators (dashboard + phase overview)
- ✅ Progressive workout saving with draft detection
- ✅ Exercise swap simplified (removed scope modal)
- ✅ Removed "Up Next" modal after completion (unnecessary)
- **Sessions**: 15 (Feb 13, 2026)
- **Status**: Merged to master
- **20 commits total** - all production-critical fixes

### Session 16: Performance Optimizations (2h)
- ✅ Dashboard query optimization (7.5x faster - 3s → 400ms)
- ✅ Phase overview API optimization (3.3x faster - 2s → 600ms)
- ✅ Workout log load optimization (2.5x faster - 1.5s → 600ms)
- ✅ Workout save optimization (2.75x faster - 1.1s → 400ms)
- ✅ Microcycle API optimization (10x faster - 5s → 500ms)
- ✅ Training Block API optimization (10x faster - replaced nested include with select)
- ✅ Edit Workout API already optimized (select + cache headers)
- ✅ Added skeleton loaders to all slow pages
- ✅ Added caching headers to all endpoints (30s-10min)
- ✅ Changed workout completion redirect to dashboard (instant with cache)

### Session 17: Code Quality & Polish (2h)
- ✅ Fixed all useEffect dependency warnings (6 warnings → 0)
- ✅ Added global error boundary component
- ✅ Improved app stability and error handling
- ✅ Fixed unilateral exercise validation bug (false positive incomplete sets warning)

### Session 18: Live Workout Exercise Management (3h - Feb 16, 2026)
- ✅ Fixed critical add exercise validation bug (empty exerciseId, targetSets = 0)
- ✅ Added client-side validation with error messages (edit + log pages)
- ✅ Implemented "Add Exercise" feature during live workout
  - Full modal form with all exercise configuration
  - Same validation as edit workout page
  - Auto-creates empty sets for immediate logging
- ✅ Fixed leading zero bug in number inputs (affects all number fields)
  - Changed form state from numbers to strings
  - Parse only on submission, not on change
  - Users can now clear fields without "0" appearing
- ✅ Fixed timing issue: rest timer now works for added exercises
  - Reversed order: fetch workout data BEFORE creating sets
  - Ensures exercise settings available immediately

**Total Effort (Phases 1-6C + Sessions 16-18)**: 74 hours (vs 70-100h estimated)
**Efficiency**: 26% faster than upper estimate

### Sessions 19-21: Performance, Dashboard, Block Page (Sessions 19-21, Feb 16-17, 2026)
- ✅ Training Block page tidy (header, phase labels, locking, rebuild modal)
- ✅ Phase locking fix (locked only if `startDate <= today AND status active|completed`)
- ✅ Progress page revamp (time filter, block comparison charts)
- ✅ Navigation performance (prop-based email, no client auth fetch)
- ✅ Dashboard parallel queries + removed broken `revalidate`
- ✅ Workout generation parallelised (17s → 1-2s via `Promise.all`)
- ✅ Vercel region set to `sin1` (Singapore → Supabase Mumbai ~60ms)
- ✅ Login: `window.location.assign` hard nav (no router cache issues)

### Session 22: Beta Access Management (Feb 18, 2026)
- ✅ **Landing page** — ProBlock branding, hero, features, pricing preview (coming soon)
- ✅ **Subscription schema** — `Subscription` model, `UserRole` + `SubscriptionStatus` enums
- ✅ **Register API** — creates 28-day TRIALING subscription on signup
- ✅ **JWT subscription data** — role, subscriptionStatus, trialEndsAt in token (edge-compatible)
- ✅ **Middleware** — blocks write APIs (403) for expired users, redirects pages to `/subscribe`
- ✅ **SubscriptionBanner** — amber warning shown ≤7 days before expiry
- ✅ **`/subscribe` page** — clean lockout page for expired users
- ✅ **Admin dashboard** (`/admin`) — role-guarded, sidebar nav
- ✅ **Admin user list** — status badges, trial dates, joined date
- ✅ **Admin user detail** — subscription controls (status, trial extension, manual override)
- ✅ **Admin API routes** — list users, user detail, patch subscription
- ✅ **Navigation** — ProBlock brand, admin link for ADMIN role

**Total Effort (all sessions)**: ~87 hours

---

## 🚀 Upcoming Work

### Coach Extension (Session 43 — IN PROGRESS)

**Branch**: `feature/stripe-integration`

#### ✅ Phase 1 COMPLETE — Foundation
- Schema: `UserRole` enum + COACH, `CoachProfile`, `CoachClientRelationship`, `CoachInvite`, `CoachMessage` models, `Macrocycle.createdByCoachId`
- DB pushed via Session mode pooler
- `resend` npm package installed
- `lib/coachAccess.ts` — `verifyCoachClientAccess()` helper
- `lib/email.ts` — `sendCoachInvite()` via Resend
- `middleware.ts` — COACH bypasses subscription checks, `/dashboard` redirects to `/coach`, `/invites` public
- `app/(dashboard)/layout.tsx` — COACH redirected to `/coach`
- `components/navigation.tsx` — "My Coach" link for USER role
- `app/(coach)/layout.tsx` — role-guarded sidebar layout
- `app/(coach)/coach/page.tsx` — client list with at-a-glance metrics
- `app/(coach)/coach/invite/page.tsx` — invite form
- `app/api/coach/clients/route.ts` — GET client list, POST send invite
- `app/api/invites/[token]/route.ts` — GET invite details, POST accept/decline
- `app/invites/[token]/page.tsx` — accept/decline UI (client component)
- `app/(admin)/admin/users/[id]/page.tsx` — Role section with COACH grant button + maxClients
- `app/api/admin/users/[id]/route.ts` — PATCH handler for role change + CoachProfile create

#### 🔜 Phase 2 — Client Visibility (NEXT)
Files to create:
- `app/api/coach/clients/[clientId]/route.ts` — GET client detail + relationship
- `app/api/coach/clients/[clientId]/macrocycles/route.ts` — GET client's blocks
- `app/api/coach/clients/[clientId]/workout-logs/route.ts` — GET recent logs
- `app/api/coach/clients/[clientId]/progress/route.ts` — GET PRs/volume
- `app/(coach)/coach/clients/[clientId]/page.tsx` — client overview
- `app/(coach)/coach/clients/[clientId]/blocks/page.tsx` — block list
- `app/(coach)/coach/clients/[clientId]/history/page.tsx` — workout history
- `app/(coach)/coach/clients/[clientId]/progress/page.tsx` — progress charts
- `app/(dashboard)/my-coach/page.tsx` — client-facing coach page
- Macrocycle/mesocycle pages: show read-only notice if `createdByCoachId` set

#### 🔜 Phase 3 — Block Creation & Management
- `app/(coach)/coach/clients/[clientId]/blocks/new/page.tsx` — create block form
- `app/api/coach/clients/[clientId]/macrocycles/route.ts` — POST create block for client
- Update PATCH/DELETE in macrocycle, mesocycle, workout, workout-exercise routes — add coach ownership check
- Update `generate-workouts` route for coach access
- `app/(coach)/coach/clients/[clientId]/blocks/[blockId]/page.tsx` — block detail with edit controls

#### 🔜 Phase 4 — Messaging
- `app/api/coach/clients/[clientId]/messages/route.ts` — GET thread, POST send (coach side)
- `app/api/messages/route.ts` — GET/POST (client side)
- `app/api/messages/unread/route.ts` — GET unread count
- `app/(coach)/coach/messages/page.tsx` — coach messages overview
- `app/(coach)/coach/clients/[clientId]/messages/page.tsx` — thread (30s poll)
- Client messages in `my-coach` page
- Unread badge in Navigation

#### 🔜 Phase 5 — Seats & Admin UI
- Enforce `maxClients` already done in invite POST route
- `app/(admin)/admin/coaches/page.tsx` — list all COACH users with seat usage
- `maxClients` admin control already added to user detail page

### ⚠️ Still Blocked: Live Stripe Setup
Must be done before merging `feature/stripe-integration` → master. See memory for steps.

### Beta Operations
- Monitor beta users via admin dashboard
- Extend trials / grant access manually as needed

---

### ~~Sessions 26-27: Periodisation~~ ✅ COMPLETE

- ✅ `Microcycle.isRecovery` schema field added + DB pushed
- ✅ `isCompound: boolean` added to `ExerciseSlot` interface + all slots marked
- ✅ Setup route persists `isRecovery` from wizard payload
- ✅ Setup page `generateSimplifiedPlan()` now flags recovery weeks correctly
- ✅ `generate-workouts`: GOAL_OVERRIDES constant + priority logic (isRecovery > goal > slot default)
- ✅ Training block page rebuild modal description updated

---

### Next Up: Bug Fixes + Exercise Library (Session 28)

#### Bug Fixes
- **RDL duplicate** ⚠️ *Code written, not committed* — Good Mornings replaces RDL alt in Lower + Legs Hamstrings slots. Need to verify `Good Mornings` exists in exercise DB before deploying.
- **Add exercise sets not populating** ⚠️ *Code written, not committed* — POST response now returns full exercise fields; `handleAddExercise()` updates `workout` state directly, skipping `fetchWorkout()`.

#### Exercise Library (~3-4h)
- **Muscle groups**: Remove `legs`; add `quads`, `hamstrings`, `adductors`, `abductors`. Update `MUSCLE_GROUP_OPTIONS` in exercises page + phase overview form. Run DB script to reclassify existing exercises.
- **Library expansion**: Add ~20-30 exercises to reduce repetition across splits. Focus areas: chest (cable fly, decline, weighted dips), back (T-bar row, chest-supported row), legs (hack squat, Bulgarian split squat, Nordic curl, hip thrust), shoulders (cable lateral raise, Arnold press, reverse fly), arms (hammer curl, preacher curl, skull crushers).

---

### Post-Beta Features (later)
- Progressive overload tracking + exercise analytics charts
- Data export (CSV/PDF)
- Stripe integration + email lifecycle (separate plan)

---

### ~~Phase 6C: Advanced Exercise Features~~ ✅ COMPLETE
**Status**: All 5 features already implemented!

1. ✅ **Exercise Swap** - Simplified version (Session 15)
2. ✅ **Progressive Workout Saving** - Draft detection + auto-restore (Session 15)
3. ✅ **Unilateral Exercise Tracking** - Left/Right reps implemented (Previously deployed)
4. ✅ **Superset Functionality** - Visual grouping + rest timer logic (Previously deployed)
5. ✅ **Per-Exercise "Complete" Button** - Progress tracking (Session 13)

---

### ~~Phase 6D: Additional Exercise Types~~ ✅ COMPLETE
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

### ~~Phase 7: Dashboard Redesign~~ ✅ COMPLETE
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

| Phase | Description | Effort | Status |
|-------|-------------|--------|--------|
| Phase 1 | Critical Fixes | 7h | ✅ Complete |
| Phase 2 | Training Block Overview | 6h | ✅ Complete |
| Phase 3 | Phase Overview + Exercise Mgmt | 11h | ✅ Complete |
| Phase 4 | Warmup + Reordering | 7h | ✅ Complete |
| Phase 5 | Workout Logging Enhancements | 8h | ✅ Complete |
| Phase 6A | Phase Details Redesign | 9h | ✅ Complete |
| Phase 6B | Workout History Calendar | 4h | ✅ Complete |
| Phase 6C | Critical Bug Fixes & UX | 3h | ✅ Complete |
| Session 16 | Performance Optimizations | 2h | ✅ Complete |
| Session 17 | Code Quality & Polish | 2h | ✅ Complete |
| **User Requests** | **Dashboard + Exercise Library + Wizard** | **4-6h** | **✅ Complete** |
| Session 18 | Live Workout Exercise Management | 3h | ✅ Complete |
| Phase 6D | Additional Exercise Types | 7-9h | ✅ Complete |
| Phase 7 | Dashboard Redesign | 16-20h | ✅ Complete |
| Sessions 26-27 | Periodisation (recovery weeks + goal-based) | ~4h | ✅ Complete |
| Phase 8 | Progress Enhancements | 10-12h | 📋 Pending |
| Phase 9 | Training Block Menu | 12-16h | 📋 Pending |

**Completed**: ~91 hours
**Next Up**: Bug fixes (RDL duplicate, add exercise sets), exercise library expansion
**Remaining**: ~22-28 hours (Phases 8-9)
**Total Project**: ~101-107 hours

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

**Last Updated**: Mar 1, 2026 (Session 43)
**Next Session**: Continue Coach Extension — Phase 2 (client visibility API + pages)
