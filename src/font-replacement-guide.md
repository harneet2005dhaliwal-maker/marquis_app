# Font Replacement Guide for StudyPage.tsx

## All 57 instances need to be replaced:

### Replace these patterns globally:
1. `fontFamily: "Inter, sans-serif"` → `fontFamily: "Neurial Grotesk, sans-serif"`
2. `fontFamily: "Inter, -apple-system, sans-serif"` → `fontFamily: "Neurial Grotesk, sans-serif"`
3. `fontFamily: "Roboto Slab, serif"` → `fontFamily: "Neurial Grotesk, sans-serif"`

### Critical sections (from user's screenshot):
- Line 1459: Flashcard question/answer text (currently Roboto Slab)
- Line 1414: "Flashcard Review" heading (currently Inter)
- Lines 1480, 1500, 1515, 1529: Navigation buttons (currently Inter)
- Lines 1548, 1561: Card action buttons (currently Inter)
- Lines 1576, 1591, 1606, 1616, 1631, 1641: Add flashcard form (mix of Inter and Roboto Slab)

### All instances across the file:
Lines: 557, 569, 605, 651, 694, 704, 719, 738, 752, 771, 785, 804, 818, 837, 856, 871, 887, 910, 932, 961, 979, 990, 1002, 1013, 1414, 1459, 1480, 1500, 1515, 1529, 1548, 1561, 1576, 1591, 1606, 1616, 1631, 1641, 1676, 1691, 1711, 1723, 1737, 1753, 1773, 1788, 1801, 1814, 1842, 1853, 1891, 2060, 2063, 2073, 2076, 2086, 2089

### Consistency Summary:
✅ All fonts should use: **Neurial Grotesk, sans-serif**
❌ Remove: Inter, Roboto Slab (not brand compliant)
