# Known Issues & Pending Fixes

## 🐛 Critical Issues

### Custom Exercise Creation - UI Issues (Feb 11, 2026)

**Status:** 🟡 UI improvement needed

**Affected Pages:**
- Phase Overview (`/mesocycles/[id]`) → Add Exercise → Create Custom Exercise

**Issues:**
1. **Poor discoverability**
   - Form is expandable but requires clicking small arrow to the right
   - Arrow is not obvious/easy to miss on mobile
   - Users may not realize the form is there

2. **Poor visibility - White background**
   - Form uses white/light background making text fields hard to see
   - Input fields blend into background
   - Difficult to read and interact with on mobile
   - Needs better contrast and visual distinction

3. **Missing in exercise edit workflow**
   - "Create Custom Exercise" only appears when adding new exercise
   - Should also appear when changing/editing existing exercise
   - Use case: Replace an existing exercise with a new custom one

**Impact:**
- Form is functional but hard to discover (small arrow)
- Poor visibility makes it difficult to use (white background)
- Missing from exercise edit workflow

**Proposed Solution:**

1. **Improve inline form UI visibility**
   ```
   Phase Overview (mesocycles/[id]/page.tsx, lines ~1089-1200):

   Current issues:
   - White background (bg-white) makes fields hard to see
   - Small checkboxes with light styling
   - May need larger arrow or auto-expand behavior

   Improvements needed:
   - Change background to darker color (bg-gray-100 or bg-blue-50)
   - Increase input field contrast (darker borders, bg-white for inputs)
   - Larger, more visible expand/collapse indicator
   - Consider auto-expanding when "Create Custom Exercise" selected
   - Better label contrast and sizing for mobile
   ```

2. **Add to exercise edit dropdown**
   ```
   When editing existing exercise (Phase Overview):
   - Find exercise select dropdown in edit mode
   - Add "➕ Create Custom Exercise..." option
   - Show same inline form when selected
   - Auto-select newly created exercise in dropdown
   ```

**Specific UI Changes:**

```tsx
// Current inline form (lines ~1089-1200):
<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
  // Nested white background checkboxes:
  <div className="... bg-white"> // ← PROBLEM: Hard to see

// Proposed changes:
<div className="p-3 bg-gray-50 border border-gray-300 rounded-lg space-y-3">
  // Make input fields stand out:
  <input className="... bg-white border-2 border-gray-400 ...">

  // Checkbox containers with better contrast:
  <div className="... bg-gray-100 border-2 border-gray-300">
    <label className="... text-gray-900 font-medium">
```

**Benefits:**
- ✅ Simpler implementation (no component extraction needed)
- ✅ Improved visibility on mobile and desktop
- ✅ Better discoverability with darker backgrounds
- ✅ Works in both add and edit workflows
- ✅ Maintains existing validation logic

**Estimated Effort:** 1-2 hours
- Improve inline form styling: 45min
- Add to edit workflow: 45min
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
