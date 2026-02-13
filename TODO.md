# TODO - Immediate Action Items

## ✅ Recent Completions (Session 15 - Feb 13, 2026)

### Merged to Master
- ✅ Phase 6C: Critical bug fixes and UX improvements (20 commits)
- ✅ All feature branches merged to master
- ✅ Stale branches cleaned up (6 branches deleted)
- ✅ Documentation updated

### Key Fixes Deployed
- ✅ Dashboard showing wrong workout → Fixed (skip completed workouts)
- ✅ Workout save validation errors → Fixed (NaN handling)
- ✅ Duplicate sets appearing → Fixed (state management)
- ✅ Auto-labeling duplicate workout names (A/B/C)
- ✅ "Up Next" modal removed (user feedback)

---

## 🎯 Current Priorities

### Option A: Code Quality & Polish (Recommended)
**Effort**: 2-3 hours
**Impact**: Better stability and developer experience

**Tasks**:
1. Fix useEffect dependency warnings (10 files)
   - `app/(dashboard)/exercises/page.tsx`
   - `app/(dashboard)/macrocycles/[id]/page.tsx`
   - `app/(dashboard)/microcycles/[id]/page.tsx`
   - `app/(dashboard)/workouts/[id]/log/page.tsx` (2 warnings)
   - `components/LiftHistoryModal.tsx`

2. Update @next/swc version (15.5.7 → 15.5.11)
   ```bash
   npm install @next/swc-win32-x64-msvc@15.5.11
   ```

3. Replace `alert()` with modal UI
   - `app/(dashboard)/workouts/[id]/log/page.tsx` (error alerts)
   - Any other locations using browser alerts

4. Add error boundaries
   - Create `components/ErrorBoundary.tsx`
   - Wrap main app sections

5. Add loading states
   - Dashboard data fetching
   - Phase overview data fetching

### Option B: New Features
**Effort**: 8-12 hours
**Priority**: Lower (app is fully functional)

**Ideas**:
- Progressive overload tracking
- Exercise analytics and charts
- Workout templates library
- Export data (CSV/PDF)

---

## 🐛 Known Issues (Low Priority)

### Pre-existing Warnings (Non-blocking)
- ⚠️ `@next/swc` version mismatch (15.5.7 vs 15.5.11)
- ⚠️ useEffect dependency warnings (10 locations)

### Deferred Features
- Week navigation parameter in URL (acceptable workaround: swipe to week)
- Mobile drag & drop for workouts (desktop works, arrows available)

---

## 📝 Maintenance Tasks

### Regular Monitoring
- [ ] Monitor Vercel deployment logs
- [ ] Check Supabase database metrics
- [ ] Review error tracking (if implemented)

### Documentation
- [x] Update PLAN.md ✅
- [x] Update TODO.md ✅
- [x] Update SESSION_SUMMARY.md ✅
- [x] Update MEMORY.md in Claude directory ✅

---

**Last Updated**: Feb 13, 2026 (End of Session 15)
