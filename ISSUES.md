# Known Issues & Pending Fixes

## 🐛 Critical Issues

### Custom Exercise Creation - Mobile Broken (Feb 11, 2026)

**Status:** 🔴 BLOCKING mobile users from creating custom exercises

**Affected Pages:**
- Phase Overview (`/mesocycles/[id]`) → Add Exercise → Create Custom Exercise

**Issues:**
1. **Input fields not editable on mobile**
   - Form displays but cannot type in text inputs or interact with checkboxes
   - Works perfectly on desktop/laptop
   - Likely Samsung Chrome input visibility issue

2. **Wrong form preference**
   - Current: Compact inline form (blue background, small text, nested in workout card)
   - Preferred: Exercise Library modal form (proven mobile compatibility, better UX)

3. **Missing in exercise edit workflow**
   - "Create Custom Exercise" only appears when adding new exercise
   - Should also appear when changing/editing existing exercise
   - Use case: Replace an existing exercise with a new custom one

**Impact:**
- Mobile users cannot create custom exercises from Phase Overview
- Desktop users can, but UX is cramped
- Workaround: Navigate to Exercise Library page to create (works on mobile)

**Proposed Solution:**

1. **Extract Exercise Library form to reusable component**
   ```
   components/CustomExerciseModal.tsx
   - Props: isOpen, onClose, onExerciseCreated(exerciseId)
   - Reuse Exercise Library validation logic
   - Mobile-tested and proven to work
   ```

2. **Replace inline form with modal approach**
   ```
   Phase Overview (mesocycles/[id]/page.tsx):
   - Remove inline custom exercise form
   - Import <CustomExerciseModal>
   - Open modal when "Create Custom Exercise" selected
   - Auto-select returned exercise ID in dropdown
   ```

3. **Add to exercise edit dropdown**
   ```
   When editing existing exercise:
   - Add "Create Custom Exercise" to exercise selection dropdown
   - Same modal-based workflow
   ```

**Benefits:**
- ✅ Proven mobile compatibility
- ✅ Consistent UX across Exercise Library and Phase Overview
- ✅ Larger touch targets and better accessibility
- ✅ Full validation from Exercise Library form
- ✅ Works in both add and edit workflows

**Estimated Effort:** 3-4 hours
- Extract modal component: 1-2h
- Replace inline form: 1h
- Add to edit workflow: 1h
- Testing: 30min

---

## 📋 Other Known Issues

### Mobile Drag & Drop Not Working (Session 9)
- **Status:** 🟡 Deferred
- **Issue:** Touch sensor not working reliably on mobile for workout reordering
- **Workaround:** Works perfectly on desktop/laptop
- **Solution:** Consider arrow buttons (like exercise reordering) as mobile alternative
- **Estimated Effort:** 2-3 hours

### Pre-existing Build Warnings (Non-blocking)
- **Status:** 🟢 Low priority
- `@next/swc` version mismatch: Local 15.5.7, Next.js 15.5.11
- useEffect dependency warnings in multiple pages
- **Impact:** None - warnings only, no runtime issues

---

## 🎯 Next Session Priority

**Fix Custom Exercise Modal on Mobile** - CRITICAL for mobile UX
