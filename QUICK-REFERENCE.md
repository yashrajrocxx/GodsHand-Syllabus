# 🎯 QUICK REFERENCE GUIDE

## 📂 What's Where?

```
Syllabus/
│
├── 🏠 index.html           # START HERE - Main homepage
│
├── 📱 manifest.json        # PWA configuration
│
├── 📚 Documentation
│   ├── README.md           # Project overview
│   ├── SETUP.md            # Setup & customization guide
│   ├── IMPROVEMENTS.md     # What's new summary
│   ├── CHANGELOG.md        # Version history
│   └── QUICK-REFERENCE.md  # This file
│
├── 🚀 Scripts
│   ├── start.ps1           # Quick launcher (RUN THIS!)
│   └── update-paths.ps1    # Path updater (already done)
│
├── 📖 chapters/            # All 18 chapters
│   ├── chapter1.html       # Your Body
│   ├── chapter2.html       # Desire & Identity
│   ├── ...                 # Chapters 3-17
│   └── chapter18.html      # 12-Month Plan
│
└── 🎨 assets/
    ├── css/
    │   └── style.css       # All styling
    └── js/
        └── script.js       # Theme, AI, Progress
```

---

## 🚀 How to Start?

### Quick Start (Recommended):
```powershell
.\start.ps1
```
Interactive menu will guide you!

### Direct Browser:
```
Double-click → index.html
```
Works immediately (limited features)

### With Python:
```bash
python -m http.server 8000
# Then open: http://localhost:8000
```

### With Node.js:
```bash
npx http-server
# Then open: http://localhost:8080
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + D` | Toggle dark/light mode |
| `Ctrl/Cmd + K` | Focus search (ready) |
| `Esc` | Close AI popup |

---

## 📊 Features at a Glance

### ✅ What Works Now:
- [x] 18 complete chapters
- [x] Progress tracking (auto-saves)
- [x] Dark/light theme
- [x] AI text explanations
- [x] Mobile responsive
- [x] Offline mode (PWA)
- [x] Chapter navigation
- [x] Keyboard shortcuts

### 🔜 Coming Soon:
- [ ] Full search
- [ ] Bookmarks
- [ ] Export progress
- [ ] Print views
- [ ] Quiz system

---

## 🎨 Customization Quick Tips

### Change Colors:
Edit `assets/css/style.css`:
```css
/* Line ~15 - Feature cards */
background: linear-gradient(...);

/* Line ~200 - Chapter items */
border-color: #your-color;
```

### Update AI Keys:
Edit `assets/js/script.js`:
```javascript
// Line ~5 - AI_PROVIDERS
const AI_PROVIDERS = {
  gemini: {
    apiKey: "YOUR_KEY_HERE"
  }
}
```

### Add New Chapter:
1. Copy `chapters/chapter18.html`
2. Rename to `chapter19.html`
3. Update content inside
4. Add link in `index.html` (search for "chapter18")
5. Update navigation buttons

---

## 🐛 Troubleshooting

### Progress Not Saving?
```javascript
// Open browser console (F12)
localStorage.getItem('chaptersCompleted')
// Should show: ["1","5","12"]

// To reset:
localStorage.clear()
```

### AI Not Working?
1. Check internet connection
2. Verify API keys in `assets/js/script.js`
3. Check browser console (F12) for errors
4. Try different provider (auto-switches)

### Paths Broken?
```powershell
# Re-run path updater
.\update-paths.ps1
```

### Theme Not Saving?
```javascript
// Open console (F12)
localStorage.theme
// Should show: "dark" or "light"

// To fix:
localStorage.removeItem('theme')
```

---

## 📱 Install as App

### Desktop (Chrome/Edge):
1. Open site
2. Click install icon (⊕) in address bar
3. Click "Install"

### Mobile (Android):
1. Open in Chrome
2. Menu (⋮) → "Add to Home screen"

### iPhone:
1. Safari → Share button
2. "Add to Home Screen"

---

## 📈 Progress Tracking

### How it Works:
1. Scroll through **80%** of a chapter
2. ✅ Automatically marked complete
3. 🎉 Badge appears
4. 📊 Updates home page progress

### View Progress:
```javascript
// Browser console (F12)
JSON.parse(localStorage.chaptersCompleted)
// Returns: [1, 5, 7, 12, 18]
```

### Reset Progress:
```javascript
// Browser console (F12)
localStorage.removeItem('chaptersCompleted')
location.reload()
```

---

## 🎯 File Reference

### Important Files:

| File | Purpose | When to Edit |
|------|---------|--------------|
| `index.html` | Home page | Add chapters, change layout |
| `chapters/chapterX.html` | Chapter content | Update chapter text |
| `assets/css/style.css` | All styling | Change colors, layout |
| `assets/js/script.js` | All functionality | Add features, AI keys |
| `manifest.json` | PWA config | Change app name, icons |
| `README.md` | Documentation | Update project info |

### Don't Edit:
- `update-paths.ps1` (one-time use)
- `.gitignore` (unless you know Git)

---

## 🔗 Quick Links

### In This Project:
- 🏠 [Main Page](index.html)
- 📖 [Chapter 1](chapters/chapter1.html)
- 📚 [Full README](README.md)
- 🛠️ [Setup Guide](SETUP.md)

### External:
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Marked.js Docs](https://marked.js.org/)
- [Gemini API](https://ai.google.dev/)
- [Groq API](https://console.groq.com/)

---

## 💡 Pro Tips

### 1. Use Keyboard Shortcuts
Press `Ctrl+D` for quick theme toggle!

### 2. Install as App
Better experience, works offline!

### 3. Complete in Order
Progress tracking works best sequentially.

### 4. Select Text for AI
Highlight any term → Get instant explanation!

### 5. Check Progress
Visit home page to see your completion bar.

---

## 📞 Need Help?

### Check These in Order:
1. This file (QUICK-REFERENCE.md) ← You are here
2. [SETUP.md](SETUP.md) - Detailed setup
3. [README.md](README.md) - Full documentation
4. [IMPROVEMENTS.md](IMPROVEMENTS.md) - What's new
5. [CHANGELOG.md](CHANGELOG.md) - Version history

### Still Stuck?
- Open browser console (F12) → Look for red errors
- Check file paths are correct
- Try clearing cache (Ctrl+Shift+Delete)
- Restart browser

---

## ✨ Cool Features You Might Miss

### 1. **AI Popup**
Select ANY text in a chapter → Instant AI explanation!

### 2. **Completion Badge**
Scroll to bottom of chapter → See ✅ badge appear!

### 3. **Dark Mode**
Auto-saves preference, even after closing browser!

### 4. **Offline Mode**
Visit once with internet → Works forever offline!

### 5. **Progress Bar**
Home page shows beautiful visual of your journey!

---

## 🎓 Learning Path

### Recommended Order:
```
1. Start → index.html
2. Read → Chapter 1
3. Progress → Chapters 2-17
4. Plan → Chapter 18 (12-Month Plan)
5. Review → Revisit as needed
```

### Time Estimate:
- Quick read: 30 min per chapter
- Deep study: 2-3 hours per chapter
- Full completion: 40-60 hours
- With practice: 12 months

---

## 🎯 Quick Commands

### For Developers:
```powershell
# View structure
tree /F /A

# Start server
python -m http.server 8000

# Update paths (if needed)
.\update-paths.ps1

# Quick launch
.\start.ps1
```

### For Users:
```
✅ Just double-click index.html
✅ Or run start.ps1
✅ Everything else is automatic!
```

---

## 🏆 Achievement Checklist

Track your journey:

- [ ] Opened the manual
- [ ] Read Chapter 1
- [ ] Installed as app
- [ ] Tried dark mode
- [ ] Used AI explanation
- [ ] Completed 5 chapters
- [ ] Completed 10 chapters
- [ ] Read all 18 chapters
- [ ] Started 12-month plan
- [ ] Became evolved human 🚀

---

**Last Updated**: November 21, 2025
**Current Version**: 1.1.0
**Status**: ✅ Production Ready

**Happy evolving! 🌟**
