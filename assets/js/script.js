document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIG - Multiple AI Providers ---
  const AI_PROVIDERS = {
    gemini: {
      name: "Google Gemini",
      apiKey: "AIzaSyDrsy9iaa06TOkCisLGV6atzBAhHjrF5ZY",
      endpoint:
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
    },
    groq: {
      name: "Groq",
      apiKey: "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",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      model: "llama-3.1-8b-instant",
    },
    ollama: {
      name: "Ollama (Local)",
      endpoint: "http://localhost:11434/api/generate",
      model: "llama3.2",
    },
  };

  let isApiCallPending = false;

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

  // --- SETTINGS & THEME MANAGEMENT ---
  function loadSettings() {
    return {
      fontSize: localStorage.getItem("fontSize") || "normal",
      theme: localStorage.getItem("theme") || "light",
    };
  }

  function applySettings() {
    const settings = loadSettings();

    // Apply font size
    htmlEl.classList.remove("font-small", "font-normal", "font-large");
    htmlEl.classList.add(`font-${settings.fontSize}`);

    // Apply theme
    setTheme(settings.theme === "dark");

    // Update UI buttons if they exist (home page only)
    const fontSizeBtns = document.querySelectorAll(".font-size-btn");
    const themeToggleBtns = document.querySelectorAll(".theme-toggle-btn");

    fontSizeBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.size === settings.fontSize);
    });

    themeToggleBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.theme === settings.theme);
    });
  }

  function setTheme(isDark) {
    if (isDark) {
      htmlEl.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      htmlEl.classList.remove("dark");
      localStorage.theme = "light";
    }
  }

  // Theme toggle button (works on all pages)
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const isDark = htmlEl.classList.contains("dark");
      setTheme(!isDark);
    });
  }

  // Initialize settings
  applySettings();

  // --- SELECTION LOGIC (Mobile & Desktop) ---
  const handleSelection = (e) => {
    // Don't close popup if clicking inside it
    if (selectionPopup && selectionPopup.contains(e.target)) return;

    // Ignore clicks on UI elements
    if (e.target.closest("#theme-toggle")) return;
    if (e.target.closest("#settings-btn-nav")) return;
    if (e.target.closest("#settings-dropdown")) return;

    // Wait for browser to update selection
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (!mainContent) return;

      // Check if text is selected AND it's inside main content
      if (
        text.length > 0 &&
        selection.anchorNode &&
        mainContent.contains(selection.anchorNode)
      ) {
        selectedText = text;

        // Reset chat
        chatHistory = [];
        if (chatMessages) chatMessages.innerHTML = "";

        // Get selection coordinates
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          // Show popup
          showPopup(rect);

          // Auto-load explanation
          switchTab("explain");
        } catch (err) {
          // Silently fail if selection bounds cannot be determined
        }
      } else {
        // Hide popup if no selection
        if (selectionPopup) {
          selectionPopup.classList.remove("visible");
        }
      }
    }, 10);
  };

  // Attach to mouse and touch events
  document.addEventListener("mouseup", handleSelection);
  document.addEventListener("touchend", handleSelection);

  // Disable context menu on selected text
  document.addEventListener("contextmenu", (e) => {
    if (
      window.getSelection().toString().trim().length > 0 &&
      mainContent &&
      mainContent.contains(e.target)
    ) {
      e.preventDefault();
    }
  });

  // Close popup button
  if (popupClose) {
    popupClose.addEventListener("click", (e) => {
      e.stopPropagation();
      selectionPopup.classList.remove("visible");
    });
  }

  function showPopup(rect) {
    if (!selectionPopup) return;

    // Responsive sizing with multiple breakpoints
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Determine device type and set appropriate values
    let popupWidth, popupMinHeight, popupMaxHeight, margin, gap;

    if (screenWidth < 375) {
      // Very small phones (iPhone SE, etc.)
      popupWidth = screenWidth - 24;
      popupMinHeight = 280;
      popupMaxHeight = Math.min(screenHeight * 0.65, 450);
      margin = 12;
      gap = 8;
    } else if (screenWidth < 640) {
      // Small phones and mobile devices
      popupWidth = Math.min(screenWidth - 32, 380);
      popupMinHeight = 300;
      popupMaxHeight = Math.min(screenHeight * 0.7, 500);
      margin = 16;
      gap = 10;
    } else if (screenWidth < 768) {
      // Large phones and small tablets
      popupWidth = Math.min(screenWidth - 48, 420);
      popupMinHeight = 320;
      popupMaxHeight = Math.min(screenHeight * 0.75, 550);
      margin = 20;
      gap = 12;
    } else if (screenWidth < 1024) {
      // Tablets
      popupWidth = 460;
      popupMinHeight = 340;
      popupMaxHeight = Math.min(screenHeight * 0.8, 600);
      margin = 24;
      gap = 14;
    } else {
      // Desktop and large screens
      popupWidth = 480;
      popupMinHeight = 360;
      popupMaxHeight = Math.min(screenHeight * 0.85, 650);
      margin = 32;
      gap = 16;
    }

    // === HORIZONTAL POSITIONING ===
    // Center popup on selection, but keep it on screen
    const selectionCenterX = rect.left + rect.width / 2;
    let left = selectionCenterX - popupWidth / 2;

    // Keep popup within viewport bounds
    const minLeft = margin;
    const maxLeft = window.innerWidth - popupWidth - margin;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    // Convert to absolute positioning with scroll offset
    const absoluteLeft = left + window.pageXOffset;

    // === VERTICAL POSITIONING ===
    // Calculate viewport position of selection
    const viewportTop = rect.top;
    const viewportBottom = rect.bottom;
    const viewportHeight = window.innerHeight;
    const scrollY = window.pageYOffset;

    // Calculate available space
    const spaceAbove = viewportTop - margin;
    const spaceBelow = viewportHeight - viewportBottom - margin;

    // Determine optimal position
    let top;
    let positionAbove = false;
    let availableHeight;

    // Smart positioning: prefer position with more space
    if (spaceBelow >= popupMinHeight + gap) {
      // Place below if there's enough space
      positionAbove = false;
      top = rect.bottom + scrollY + gap;
      availableHeight = Math.min(spaceBelow - gap, popupMaxHeight);
    } else if (spaceAbove >= popupMinHeight + gap) {
      // Place above if below doesn't work but above has space
      positionAbove = true;
      availableHeight = Math.min(spaceAbove - gap, popupMaxHeight);
      top = rect.top + scrollY - availableHeight - gap;
    } else {
      // Not enough space in either direction - use the side with more space
      if (spaceBelow > spaceAbove) {
        positionAbove = false;
        top = rect.bottom + scrollY + gap;
        availableHeight = Math.min(spaceBelow - gap, popupMaxHeight);
      } else {
        positionAbove = true;
        availableHeight = Math.min(spaceAbove - gap, popupMaxHeight);
        top = rect.top + scrollY - availableHeight - gap;
      }
    }

    // Ensure popup stays within page bounds
    const minTop = scrollY + margin;
    const maxTop = scrollY + viewportHeight - availableHeight - margin;
    top = Math.max(minTop, Math.min(top, maxTop));

    // Add positioning class for arrow direction
    selectionPopup.setAttribute(
      "data-position",
      positionAbove ? "above" : "below"
    );

    // Apply positioning with smooth transition
    selectionPopup.style.left = `${absoluteLeft}px`;
    selectionPopup.style.top = `${top}px`;
    selectionPopup.style.width = `${popupWidth}px`;
    selectionPopup.style.maxHeight = `${availableHeight}px`;
    selectionPopup.classList.add("visible");
  }

  // --- TAB LOGIC ---
  if (popupTabs) {
    popupTabs.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        switchTab(e.target.dataset.tab);
      });
    });
  }

  function switchTab(mode) {
    if (!popupTabs) return;

    popupTabs.forEach((b) => b.classList.remove("active"));
    const activeTab = document.querySelector(`[data-tab="${mode}"]`);
    if (activeTab) activeTab.classList.add("active");

    if (mode === "discuss") {
      if (popupExplain) popupExplain.style.display = "none";
      if (popupChat) popupChat.classList.remove("hidden");
      if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
      renderChat();
    } else {
      if (popupChat) popupChat.classList.add("hidden");
      if (popupExplain) {
        popupExplain.style.display = "block";

        // Professional loading state
        popupExplain.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 150px; gap: 1rem;">
            <div class="spinner"></div>
            <p style="color: #64748b; font-size: 0.875rem; font-weight: 500;">Loading explanation...</p>
          </div>
        `;

        const prompt = `You are a helpful dictionary assistant.
Term: "${selectedText}"

Instructions:
1. Define the term simply in English (Max 2 sentences).
2. Translate JUST the term "${selectedText}" into Hindi.

Output Format (Markdown):
**Definition:** [English Definition]

**Hindi:** [Hindi Translation]`;

        callAI(prompt).then((res) => {
          if (popupExplain && typeof marked !== "undefined") {
            popupExplain.innerHTML = marked.parse(res);
          } else if (popupExplain) {
            popupExplain.innerHTML = `<div style="padding: 1rem; line-height: 1.6;">${res.replace(
              /\n/g,
              "<br>"
            )}</div>`;
          }
        });
      }
    }
  }

  // --- MULTI-PROVIDER AI LOGIC ---
  async function callAI(prompt, retries = 2) {
    if (isApiCallPending)
      return "Please wait for the current request to complete.";
    isApiCallPending = true;

    const providers = ["gemini", "groq", "ollama"];

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      try {
        const result = await callProvider(provider, prompt);
        isApiCallPending = false;
        return result;
      } catch (e) {
        if (e.message.includes("429") || e.message.includes("quota")) {
          continue;
        }

        if (i === providers.length - 1) {
          isApiCallPending = false;
          return fallbackOfflineResponse(prompt);
        }
      }
    }

    isApiCallPending = false;
    return fallbackOfflineResponse(prompt);
  }

  async function callProvider(provider, prompt) {
    const config = AI_PROVIDERS[provider];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      let response;

      if (provider === "gemini") {
        response = await fetch(`${config.endpoint}?key=${config.apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `${response.status}: ${
              errorData.error?.message || response.statusText
            }`
          );
        }

        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
        throw new Error("Invalid response format");
      } else if (provider === "groq") {
        response = await fetch(config.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 1024,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.choices?.[0]?.message?.content) {
          return data.choices[0].message.content;
        }
        throw new Error("Invalid response format");
      } else if (provider === "ollama") {
        response = await fetch(config.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: config.model,
            prompt: prompt,
            stream: false,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error("Ollama not available");
        }

        const data = await response.json();
        if (data.response) {
          return data.response;
        }
        throw new Error("Invalid response format");
      }
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  }

  function fallbackOfflineResponse(prompt) {
    const text = selectedText.toLowerCase().trim();

    if (prompt.includes("Define the term") || prompt.includes("dictionary")) {
      return `**Offline Mode**\n\n**Selected Text:** ${selectedText}\n\n*AI services are temporarily unavailable.*\n\n**Tip:** You can:\n1. Try again in a few moments\n2. Search online for more information\n3. Check a dictionary or reference material`;
    }

    return `**Offline Mode**\n\nAI services are currently unavailable. Please:\n\n1. Check your internet connection\n2. Wait a moment and try again\n3. Get a free Groq API key at console.groq.com\n\nSelected text: "${selectedText}"`;
  }

  // --- CHAT LOGIC ---
  if (chatSend && chatInput) {
    chatSend.addEventListener("click", (e) => {
      e.stopPropagation();
      sendChat();
    });
    chatInput.addEventListener("keypress", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") sendChat();
    });
    chatInput.addEventListener("mouseup", (e) => e.stopPropagation());
    chatInput.addEventListener("touchend", (e) => e.stopPropagation());
  }

  async function sendChat() {
    const msg = chatInput.value.trim();
    if (!msg) return;

    chatHistory.push({ role: "user", text: msg });
    renderChat();
    chatInput.value = "";

    chatInput.disabled = true;
    chatSend.disabled = true;

    chatHistory.push({ role: "loading", text: "Thinking..." });
    renderChat();

    const contextPrompt = `Context: "${selectedText}". User Question: ${msg}. Answer simply in 2-3 sentences.`;
    const response = await callAI(contextPrompt);

    chatHistory = chatHistory.filter((m) => m.role !== "loading");
    chatHistory.push({ role: "model", text: response });
    renderChat();

    chatInput.disabled = false;
    chatSend.disabled = false;
    chatInput.focus();
  }

  function renderChat() {
    if (!chatMessages) return;
    chatMessages.innerHTML = chatHistory
      .map((m) => {
        if (m.role === "loading") {
          return `<div class="chat-bubble chat-ai chat-loading">
            <div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>
            <span style="margin-left: 0.5rem; font-size: 0.85rem; color: #64748b;">${m.text}</span>
          </div>`;
        }
        return `<div class="chat-bubble ${
          m.role === "user" ? "chat-user" : "chat-ai"
        } markdown-body">${
          m.role === "user"
            ? m.text
            : typeof marked !== "undefined"
            ? marked.parse(m.text)
            : m.text.replace(/\n/g, "<br>")
        }</div>`;
      })
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

  // --- CHAPTER PROGRESS TRACKING ---
  function initProgressTracking() {
    const currentPage = window.location.pathname.split("/").pop();
    if (!currentPage.includes("chapter")) return;

    const chapterMatch = currentPage.match(/chapter(\d+)/);
    if (!chapterMatch) return;

    const chapterNum = parseInt(chapterMatch[1]);
    let progress = JSON.parse(
      localStorage.getItem("chaptersCompleted") || "[]"
    );

    let maxScroll = 0;
    window.addEventListener("scroll", () => {
      const scrollPercent =
        (window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight)) *
        100;
      maxScroll = Math.max(maxScroll, scrollPercent);

      if (maxScroll > 80 && !progress.includes(chapterNum)) {
        progress.push(chapterNum);
        localStorage.setItem("chaptersCompleted", JSON.stringify(progress));
        showCompletionBadge();
      }
    });
  }

  function showCompletionBadge() {
    const badge = document.createElement("div");
    badge.className = "completion-badge";
    badge.innerHTML = "✓ Chapter completed!";
    badge.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);
      z-index: 9999;
      animation: slideIn 0.5s ease;
    `;
    document.body.appendChild(badge);
    setTimeout(() => {
      badge.style.animation = "slideOut 0.5s ease";
      setTimeout(() => badge.remove(), 500);
    }, 3000);
  }

  function displayProgressOnHome() {
    const progressBar = document.getElementById("overall-progress");
    if (!progressBar) return;

    const progress = JSON.parse(
      localStorage.getItem("chaptersCompleted") || "[]"
    );
    const totalChapters = 18;
    const percentage = Math.round((progress.length / totalChapters) * 100);

    progressBar.innerHTML = `
      <div style="background: linear-gradient(135deg, #3b82f6, #06b6d4); padding: 1.5rem; border-radius: 16px; color: white; margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <span style="font-weight: 600; font-size: 1rem;">Your Progress</span>
          <span style="font-weight: 700; font-size: 1.25rem;">${progress.length}/${totalChapters}</span>
        </div>
        <div style="background: rgba(255,255,255,0.2); height: 12px; border-radius: 6px; overflow: hidden;">
          <div style="background: white; height: 100%; width: ${percentage}%; transition: width 0.5s ease; border-radius: 6px;"></div>
        </div>
        <div style="margin-top: 0.5rem; font-size: 0.875rem; opacity: 0.9;">${percentage}% Complete</div>
      </div>
    `;
  }

  // Initialize based on page type
  if (window.location.pathname.includes("chapter")) {
    initProgressTracking();
  } else if (window.location.pathname.includes("index")) {
    displayProgressOnHome();
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + D for dark mode toggle
    if ((e.ctrlKey || e.metaKey) && e.key === "d") {
      e.preventDefault();
      if (toggleBtn) toggleBtn.click();
    }
  });

  // === SETTINGS DROPDOWN (HOME PAGE ONLY) ===
  // Note: Settings dropdown is handled by inline onclick handlers in index.html
  // This section just initializes the active states on page load
  const fontSizeBtns = document.querySelectorAll(".font-size-btn");
  const themeToggleBtns = document.querySelectorAll(".theme-toggle-btn");

  // Initialize active states for settings buttons
  const currentSettings = loadSettings();

  fontSizeBtns.forEach((btn) => {
    if (btn.dataset.size === currentSettings.fontSize) {
      btn.classList.add("active");
    }
  });

  themeToggleBtns.forEach((btn) => {
    if (btn.dataset.theme === currentSettings.theme) {
      btn.classList.add("active");
    }
  });
});
