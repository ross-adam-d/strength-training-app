# TODO - Immediate Action Items

## ✅ Recent Completions (Session 15-17 - Feb 13-15, 2026)

### Merged to Master
- ✅ Phase 6C: Critical bug fixes and UX improvements (20 commits)
- ✅ All feature branches merged to master
- ✅ Stale branches cleaned up (6 branches deleted)
- ✅ Documentation updated

### Performance Optimizations (Session 16-17) 🚀 COMPLETE
- ✅ Dashboard query optimization (7.5x faster - 3s → 400ms)
- ✅ Phase overview API optimization (3.3x faster - 2s → 600ms)
- ✅ Workout log load optimization (2.5x faster - 1.5s → 600ms)
- ✅ Workout save optimization (2.75x faster - 1.1s → 400ms)
- ✅ Microcycle API optimization (10x faster - 5s → 500ms)
- ✅ Training Block API optimization (10x faster - replaced nested include with select)
- ✅ Edit Workout API already optimized (select + cache headers)
- ✅ Added skeleton loaders to all slow pages (dashboard, macrocycle detail, workout log, edit workout)
- ✅ Added caching headers to all endpoints (30s-10min depending on endpoint)
- ✅ Changed workout completion redirect to dashboard (instant with cache)

**Result**: All pages now load fast with proper loading states. Performance work complete! 🎉

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

**Last Updated**: Feb 15, 2026 (End of Session 17)
