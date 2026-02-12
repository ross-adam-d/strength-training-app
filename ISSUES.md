# Known Issues & Pending Fixes

## ✅ Recently Fixed

### Custom Exercise Creation - UI Issues (Fixed: Session 12, Feb 11, 2026)

**Status:** ✅ Fixed - Commit `9945d37`

**Issues Resolved:**
1. ✅ **Poor visibility** - Changed from white backgrounds to gray (bg-gray-50, bg-gray-100)
2. ✅ **Low contrast** - Increased border thickness (border → border-2, border-gray-400)
3. ✅ **Missing from edit workflow** - Added "➕ Create Custom Exercise..." to both Add and Edit dropdowns
4. ✅ **Auto-selection** - Newly created exercises automatically selected in dropdown

**Changes Made:**
- Inline form: gray background (bg-gray-50) instead of blue/white
- Checkbox containers: darker gray (bg-gray-100) with thicker borders (border-2)
- Available in both "Add Exercise" and "Edit Exercise" contexts
- Better mobile visibility confirmed by user testing

**Files Modified:**
- `app/(dashboard)/mesocycles/[id]/page.tsx` (+133, -15 lines)

**Testing:** ✅ Mobile testing confirmed successful

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
