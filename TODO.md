# TODO - Immediate Action Items

## ✅ Recent Completions (Session 15-17 - Feb 13-15, 2026)

### Code Quality & Polish (Session 17) ✅
- ✅ Fixed all useEffect dependency warnings (6 warnings across 5 files)
- ✅ Added global error boundary component
- ✅ Improved app stability and error handling
- ⚠️ @next/swc version mismatch: Harmless bundling issue, can't fix without Next.js update
- ⏭️ Replace alert() with modals: Deferred (alerts work fine for errors)

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

## 🎯 Current Priorities (Session 80+)

### Test on Prod (next session start)
- [ ] Prescribed exercise — reps show as greyed placeholder, weight pre-fills, inputs start empty
- [ ] No "New PR!" on workout open for prescribed exercises
- [ ] Coach: View Details on completed workout in phase editor works (no error)
- [ ] View details: "Plan: N×reps" line under each exercise name

### Growth / Monetisation
- [ ] BETA30 coupon — create in Stripe, build redemption UI at checkout, sync via webhook
- [ ] Beta thank-you email — send to existing users with BETA30 offer via Resend
- [ ] LinkedIn outreach — message drafted, send to ~10 warm contacts

### Coach Channel
- [ ] Onboarding improvement — reduce friction so coaches' clients activate and stick

### Marketing
- [ ] Product Hunt prep — screenshots, demo video, pitch

---

## 🐛 Known Issues (Low Priority)

### Pre-existing Warnings (Non-blocking)
- ⚠️ `@next/swc` version mismatch (15.5.7 vs 15.5.11)

### Deferred Features
- Week navigation parameter in URL (acceptable workaround: swipe to week)
- Mobile drag & drop for workouts (desktop works, arrows available)
- Stripe + email lifecycle (post-beta)

### Beta Access Notes
- Subscription data baked into JWT at login — admin changes (trial extension, manual override) take effect on user's next login
- Both `ross.adam.d@gmail.com` and `Ross.adam.d@gmail.com` are ADMIN in DB

---

## 📝 Maintenance Tasks

### Regular Monitoring
- [ ] Monitor Vercel deployment logs
- [ ] Check Supabase database metrics

### Documentation
- [x] Update PLAN.md ✅
- [x] Update TODO.md ✅
- [x] Update sessions.md in Claude memory ✅
- [x] Update MEMORY.md in Claude directory ✅

---

**Last Updated**: Mar 18, 2026 (Session 80 — Prescribed reps fix, coach View Details fix, plan vs actual deployed)
