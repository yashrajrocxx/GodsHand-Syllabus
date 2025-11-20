document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIG ---
  const API_KEY = "AIzaSyDrsy9iaa06TOkCisLGV6atzBAhHjrF5ZY";
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;

  // --- ELEMENTS ---
  const htmlEl = document.documentElement;
  const toggleBtn = document.getElementById("theme-toggle");
  const selectionPopup = document.getElementById("selection-popup");
  const popupExplain = document.getElementById("popup-content-explain");
  const popupChat = document.getElementById("popup-chat");
  const popupClose = document.getElementById("popup-close");
  const mainContent = document.getElementById("main-content");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const chatMessages = document.getElementById("chat-messages");
  const popupTabs = document.querySelectorAll(".popup-tab");

  let selectedText = "";
  let chatHistory = [];
  let isApiCallPending = false;

  // --- THEME TOGGLE ---
  function setTheme(isDark) {
    if (isDark) {
      htmlEl.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      htmlEl.classList.remove("dark");
      localStorage.theme = "light";
    }
  }

  toggleBtn.addEventListener("click", () => {
    const isDark = htmlEl.classList.contains("dark");
    setTheme(!isDark);
  });

  // --- SELECTION LOGIC (Mobile & Desktop) ---
  const handleSelection = (e) => {
    // 1. Allow interaction inside the popup without closing it
    if (selectionPopup.contains(e.target)) return;

    // 2. Ignore clicks on specific UI elements (like the theme toggle)
    if (e.target.closest("#theme-toggle")) return;

    // 3. Wait a tick for the browser to update the selection range
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      // Check if text is selected AND it's inside the main content area
      if (
        text.length > 0 &&
        mainContent &&
        mainContent.contains(selection.anchorNode)
      ) {
        selectedText = text;

        // Reset Chat
        chatHistory = [];
        if (chatMessages) chatMessages.innerHTML = "";

        // Get Coordinates
        // We use the range rect to get the visual position of the selection
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          // Show the popup
          showPopup(rect);

          // Auto-load explanation
          switchTab("explain");
        } catch (err) {
          console.warn("Could not get selection bounds", err);
        }
      } else {
        // If no text is selected (or clicked outside), hide popup
        selectionPopup.classList.remove("visible");
      }
    }, 10);
  };

  // Attach to both Mouse and Touch events
  document.addEventListener("mouseup", handleSelection);
  document.addEventListener("touchend", handleSelection);

  // --- DISABLE CONTEXT MENU ---
  // This prevents the native "Copy/Paste" menu from blocking our popup
  document.addEventListener("contextmenu", (e) => {
    if (
      window.getSelection().toString().trim().length > 0 &&
      mainContent &&
      mainContent.contains(e.target)
    ) {
      e.preventDefault();
    }
  });

  // --- POPUP FUNCTIONS ---
  if (popupClose) {
    popupClose.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent triggering selection logic
      selectionPopup.classList.remove("visible");
    });
  }

  function showPopup(rect) {
    const popupWidth = 340;
    const popupHeight = 350; // Max height estimate
    const margin = 15;

    // --- Horizontal Positioning ---
    // Center the popup horizontally relative to the selection
    let left = rect.left + rect.width / 2 - popupWidth / 2;

    // Clamp: Ensure it doesn't go off the left screen edge
    if (left < margin) {
      left = margin;
    }
    // Clamp: Ensure it doesn't go off the right screen edge
    else if (left + popupWidth > window.innerWidth - margin) {
      left = window.innerWidth - popupWidth - margin;
    }

    // Add horizontal scroll offset (usually 0 for mobile, but important for desktop)
    const absoluteLeft = left + window.scrollX;

    // --- Vertical Positioning ---
    // Default: Calculate position *above* the text
    // rect.top is relative to viewport. We add scrollY to get absolute doc position.
    // We subtract popupHeight to place it above.
    let top = rect.top + window.scrollY - popupHeight - margin;

    // Check collision with top of viewport (visible area)
    // If rect.top (distance from viewport top) is small, we don't have room above.
    if (rect.top < 360) {
      // Not enough space above? Flip it to *below* the text.
      top = rect.bottom + window.scrollY + margin;
    }

    // Apply coordinates
    selectionPopup.style.left = `${absoluteLeft}px`;
    selectionPopup.style.top = `${top}px`;
    selectionPopup.classList.add("visible");
  }

  // --- TAB LOGIC ---
  if (popupTabs) {
    popupTabs.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent event bubbling
        switchTab(e.target.dataset.tab);
      });
    });
  }

  function switchTab(mode) {
    popupTabs.forEach((b) => b.classList.remove("active"));
    document.querySelector(`[data-tab="${mode}"]`).classList.add("active");

    if (mode === "discuss") {
      popupExplain.style.display = "none";
      popupChat.classList.remove("hidden");
      if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
      renderChat();
    } else {
      popupChat.classList.add("hidden");
      popupExplain.style.display = "block";

      // Show spinner while loading
      popupExplain.innerHTML = '<div class="spinner"></div>';

      const prompt = `
            You are a helpful dictionary assistant.
            Term: "${selectedText}"
            
            Instructions:
            1. Define the term simply in English (Max 2 sentences).
            2. Translate JUST the term "${selectedText}" into Hindi.
            
            Output Format (Markdown):
            **Definition:** [English Definition]
            
            **Hindi:** [Hindi Translation]
            `;

      callAI(prompt).then((res) => {
        popupExplain.innerHTML = marked.parse(res);
      });
    }
  }

  // --- API LOGIC ---
  async function callAI(prompt) {
    if (isApiCallPending) return;
    isApiCallPending = true;
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (e) {
      console.error(e);
      return "Error connecting to AI. Please try again.";
    } finally {
      isApiCallPending = false;
    }
  }

  // --- CHAT LOGIC ---
  if (chatSend && chatInput) {
    chatSend.addEventListener("click", (e) => {
      e.stopPropagation();
      sendChat();
    });
    chatInput.addEventListener("keypress", (e) => {
      e.stopPropagation(); // Stop keypress from triggering other listeners
      if (e.key === "Enter") sendChat();
    });
    // Prevent taps on input from closing the popup
    chatInput.addEventListener("mouseup", (e) => e.stopPropagation());
    chatInput.addEventListener("touchend", (e) => e.stopPropagation());
  }

  async function sendChat() {
    const msg = chatInput.value.trim();
    if (!msg) return;

    chatHistory.push({ role: "user", text: msg });
    renderChat();
    chatInput.value = "";

    const contextPrompt = `Context: "${selectedText}". User Question: ${msg}. Answer simply.`;
    const response = await callAI(contextPrompt);

    chatHistory.push({ role: "model", text: response });
    renderChat();
  }

  function renderChat() {
    if (!chatMessages) return;
    chatMessages.innerHTML = chatHistory
      .map(
        (m) =>
          `<div class="chat-bubble ${
            m.role === "user" ? "chat-user" : "chat-ai"
          } markdown-body">${
            m.role === "user" ? m.text : marked.parse(m.text)
          }</div>`
      )
      .join("");
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // --- ANIMATION OBSERVER ---
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));

  // --- SCROLL NAV HIGHLIGHTER ---
  const navSections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll(".nav-link");
  if (navSections.length > 0) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            let id = entry.target.id;
            navLinks.forEach((link) => link.classList.remove("active"));
            const activeLink = document.querySelector(
              `.nav-link[href="#${id}"]`
            );
            if (activeLink) activeLink.classList.add("active");
          }
        });
      },
      { root: null, rootMargin: "0px", threshold: 0.4 }
    );
    navSections.forEach((sec) => navObserver.observe(sec));
  }
});
