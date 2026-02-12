# TODO - Immediate Action Items

## 🔥 Priority 1: Merge Phase 6A to Master

**Status**: Ready to merge
**Branch**: `feature/phase6a-phase-details-redesign`
**Commits**: 8 commits (all tested and working)
**Last Commit**: `c11a8b6` - "Improve disabled button visibility with opacity"

### Pre-Merge Checklist
- [x] All features tested on preview deployment
- [x] User approved: "new pages look awesome and are working well"
- [x] Build successful (no TypeScript errors)
- [x] No breaking changes
- [x] Documentation updated (SESSION_SUMMARY.md, PLAN.md)

### Merge Steps
```bash
# 1. Switch to master branch
git checkout master

# 2. Pull latest changes
git pull origin master

# 3. Merge feature branch
git merge feature/phase6a-phase-details-redesign

# 4. Push to origin
git push origin master

# 5. Deploy to production
# (Vercel will auto-deploy on push to master)

# 6. Delete feature branch (optional)
git branch -d feature/phase6a-phase-details-redesign
git push origin --delete feature/phase6a-phase-details-redesign
```

### Post-Merge Actions
- [ ] Verify production deployment successful
- [ ] Test key features on production:
  - [ ] Phase overview swipe navigation
  - [ ] Edit workout page with drag-and-drop
  - [ ] Apply to rest of phase functionality
  - [ ] Completed workout view
  - [ ] Start workout button
- [ ] Update PLAN.md status (if needed)

### Known Issues (Deferred)
- Week navigation returns to week 1 after edit (acceptable workaround: user can swipe to desired week)

---

## 📋 Next Session Tasks

### Phase 6B: Workout History Calendar
**Estimated**: 10-14 hours
**Priority**: CRITICAL

**Tasks**:
1. Create monthly calendar view component
2. Fetch completed workout logs
3. Display workout indicators on calendar
4. Add lift history popup during active workout
5. Add calendar icon to navigation menu
6. Style calendar for mobile responsiveness

**Files to Create**:
- `app/(dashboard)/workout-history/page.tsx`
- `components/LiftHistoryModal.tsx`

**Files to Modify**:
- `app/(dashboard)/workouts/[id]/log/page.tsx` (add history popup)
- Navigation component (add calendar icon)

---

## 🐛 Known Issues (Low Priority)

### Pre-existing Warnings
- `@next/swc` version mismatch (15.5.7 vs 15.5.11)
- useEffect dependency warnings (non-blocking)

### Mobile Drag & Drop (Deferred from Phase 4)
- Touch events not working reliably on mobile
- Desktop drag & drop works perfectly
- Future: Consider up/down arrow buttons alternative

---

**Last Updated**: Feb 12, 2026 (End of Session 14)
