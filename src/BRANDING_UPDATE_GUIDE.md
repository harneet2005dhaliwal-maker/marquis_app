# Marquis App - Complete Branding Update Guide

## ✅ COMPLETED UPDATES

### 1. Global Typography (/styles/globals.css)
- ✅ Removed Roboto Slab entirely
- ✅ All text now uses **Inter** (Neurial Grotesk alternative)
- ✅ Updated color variables:
  - `--marquis-yellow: #F8D548`
  - `--marquis-yellow-alt: #FFD84D`
  - `--marquis-grey: #666666`
  - `--marquis-grey-soft: #999999`
  - `--marquis-bg-warm: #FFFCF4`
  - `--marquis-bg-alt: #FFF9EB`

### 2. Parent Dashboard (/components/ParentDashboardPage.tsx)
- ✅ Premium redesign applied
- ✅ Hero card with yellow gradient
- ✅ Clean 4-card stat grid with trend indicators
- ✅ Single insight banner
- ✅ Key highlights in modular cards
- ✅ Collapsible subject accordions
- ✅ Premium reassurance block

---

## 🔄 REQUIRED UPDATES (Apply These Changes)

### **VOCABULARY CHANGES**
Replace ALL instances of "session" with "lesson" across the entire app:

#### Files to Update:
- `/components/StudyPage.tsx`
- `/components/StudentDashboard.tsx`
- `/components/PomodoroTimer.tsx`
- `/components/ParentSchedulePage.tsx`
- `/components/ParentMessagesPage.tsx`
- All other component files

**Find & Replace:**
```
"session" → "lesson"
"Session" → "Lesson"
"sessions" → "lessons"
"Sessions" → "Lessons"
```

**Examples:**
- "Next Session" → "Next Lesson"
- "Focus Session" → "Focus Lesson"  
- "Session Summary" → "Lesson Summary"
- "Session Timer" → "Lesson Timer"
- "Completed sessions" → "Completed lessons"

---

### **FONT UPDATES**

#### Parent Dashboard Pages
Replace all `fontFamily` properties:

**OLD:**
```typescript
fontFamily: "Roboto Slab, serif"
```

**NEW:**
```typescript
fontFamily: "Inter, sans-serif"
```

**Apply to:**
- `/components/ParentDashboardPage.tsx` ✅ (Already updated)
- `/components/ParentSchedulePage.tsx`
- `/components/ParentMessagesPage.tsx`
- `/components/ParentReportsPage.tsx`
- `/components/ParentBillingPage.tsx`
- `/components/ParentPortalPage.tsx`

#### Student Pages
**Apply to:**
- `/components/StudentDashboard.tsx`
- `/components/StudyPage.tsx`
- `/components/PomodoroTimer.tsx`
- `/components/QuizPage.tsx`
- `/components/FlashcardCreator.tsx`
- All other student components

---

### **LOGO & SLOGAN UPDATES**

#### New Slogan:
**"Powered by Care, Driven by Results."**

#### Apply to These Files:

**1. Login Page** (`/components/LoginPage.tsx`):
```typescript
// Add after logo
<p style={{
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  color: "#666666",
  marginTop: "12px",
  textAlign: "center",
}}>
  Powered by Care, Driven by Results.
</p>
```

**2. Student Dashboard Header:**
Add slogan under app name in header

**3. Parent Portal Header:**
Add slogan under "Marquis" logo

**4. Onboarding/Welcome Screens:**
Add slogan prominently below logo

---

### **COLOR PALETTE UPDATES**

Replace old color values with new ones:

**OLD → NEW:**
```typescript
// Yellow
"#FFD500" → "#F8D548" or "#FFD84D"
"#F9C933" → "#F8D548"

// Background
"#FFFFFF" → "#FFFCF4" (for warm backgrounds)
"#FFF9E6" → "#FFF9EB"

// Grey
"#6A6A6A" → "#666666"
"#999" → "#999999"
```

**Apply accent colors sparingly** - Yellow should be used for:
- Important CTAs
- Badges
- Icons
- Highlights
- NOT full backgrounds

---

### **DESIGN SIMPLIFICATION**

#### Remove/Reduce:
1. **Emojis** - Remove most decorative emojis except:
   - Keep 👋 in greetings
   - Keep ✨ for insights
   - Keep 🧠 for confidence messages
   - Remove all others

2. **Gradients** - Reduce gradient usage:
   - Keep hero card gradient
   - Remove gradient backgrounds from stat cards
   - Use solid colors or subtle tints

3. **Decorative Elements:**
   - Remove unnecessary borders
   - Remove decorative icons that don't serve function
   - Simplify card styles

#### Increase Spacing:
```typescript
// Section spacing
marginBottom: "48px" // 3rem

// Card padding
padding: "24px" or "32px"

// Gap between elements
gap: "16px" or "20px"
```

---

### **SPECIFIC FILE UPDATES**

#### `/components/LoginPage.tsx`
```typescript
// Update colors
background: "#FFFCF4" // warm off-white

// Add slogan
<p style={{
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  color: "#666666",
  marginTop: "12px",
}}>
  Powered by Care, Driven by Results.
</p>

// Button style
background: "#F8D548"
```

#### `/components/StudentDashboard.tsx`
- Replace all "Roboto Slab" → "Inter"
- Change "session" → "lesson"
- Update yellow: "#F8D548"
- Simplify card designs
- Remove excessive emojis
- Add warm background: "#FFFCF4"

#### `/components/StudyPage.tsx`
- Simplify tabs
- Remove excessive animations
- "Session" → "Lesson" everywhere
- Clean font stack to Inter only
- Reduce decorative elements

#### `/components/PomodoroTimer.tsx`
- "Focus Session" → "Focus Lesson"
- "Session Complete" → "Lesson Complete"
- Simplify planet unlock animations
- Update fonts to Inter

#### Parent Portal Pages
All pages need:
- Font update: "Roboto Slab" → "Inter"
- Color updates: use new yellow (#F8D548)
- Warm background: "#FFFCF4"
- Remove decorative emojis
- Add system integration tags (e.g., "Synced from Deputy")

---

### **SYSTEM INTEGRATION PLACEHOLDERS**

Add small tags/badges to indicate system integration:

```typescript
<Badge style={{
  background: "rgba(76, 175, 80, 0.1)",
  color: "#4CAF50",
  fontSize: "10px",
  padding: "2px 8px",
}}>
  Synced from Deputy
</Badge>

<Badge style={{
  background: "rgba(33, 150, 243, 0.1)",
  color: "#2196F3",
  fontSize: "10px",
}}>
  Linked to Marquis Email
</Badge>

<Badge style={{
  background: "rgba(249, 201, 51, 0.1)",
  color: "#F8D548",
  fontSize: "10px",
}}>
  Updated automatically
</Badge>
```

**Add to:**
- Schedule items (Deputy sync)
- Login form (Marquis email)
- Assessment results (backend link)
- Attendance feed (system integrated)

---

## 📋 CHECKLIST

### Typography
- [ ] Replace all "Roboto Slab" with "Inter"
- [ ] Update all fontFamily properties
- [ ] Remove playful/rounded fonts

### Vocabulary
- [ ] Replace "session" with "lesson" (all files)
- [ ] Update button labels
- [ ] Update tooltips and labels

### Colors
- [ ] Update yellow: #F8D548 / #FFD84D
- [ ] Update backgrounds: #FFFCF4 / #FFF9EB
- [ ] Update grey: #666666 / #999999
- [ ] Use colors sparingly

### Logo & Slogan
- [ ] Add "Powered by Care, Driven by Results"
- [ ] Update logo placements
- [ ] Ensure logo visibility on all backgrounds

### Design Simplification
- [ ] Remove excessive emojis
- [ ] Reduce gradients
- [ ] Increase spacing (48px sections)
- [ ] Simplify card designs
- [ ] Remove decorative elements

### System Integration
- [ ] Add "Synced from Deputy" badges
- [ ] Add "Linked to Marquis Email" indicators
- [ ] Add "Updated automatically" tags
- [ ] Show integration status visually

---

## 🎨 DESIGN PRINCIPLES

**Modern. Clean. Premium. Professional.**

✔ Simplicity + Functionality + Professionalism
✔ Strong hierarchy (clear headings, simple layouts)
✔ Balanced whitespace (48px between sections)
✔ Cohesive iconography (thin line, black/grey)
✔ Light animation (fade, slide — no bounce)
✔ Purposeful design (every element serves a function)

---

## 📁 FILES REQUIRING UPDATES

### High Priority:
1. `/components/LoginPage.tsx`
2. `/components/StudentDashboard.tsx`
3. `/components/StudyPage.tsx`
4. `/components/PomodoroTimer.tsx`

### Medium Priority:
5. `/components/ParentSchedulePage.tsx`
6. `/components/ParentMessagesPage.tsx`
7. `/components/ParentReportsPage.tsx`
8. `/components/ParentBillingPage.tsx`
9. `/components/ParentPortalPage.tsx`

### Lower Priority:
10. `/components/QuizPage.tsx`
11. `/components/FlashcardCreator.tsx`
12. All other component files

---

## ✨ EXPECTED OUTCOME

The app should feel like:
- **Apple Education** clarity
- **Notion** organization
- **Duolingo Parents** friendliness
- **Marquis brand** warmth

**Clean. Spacious. Calm. Premium. Trustworthy.**

Parents and students should feel confident using a professional, enterprise-grade education platform.
