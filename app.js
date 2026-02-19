/* ============================
   SEGMENT INTENDING — APP ENGINE v2
   ============================ */

(function () {
  'use strict';

  // ===== STATE =====
  const state = {
    hasOnboarded: false,
    currentSlide: 0,
    selectedActivity: null,
    selectedExample: '',
    intentionText: '',
    selectedFeelings: [],
    customFeeling: '',
    activeSegment: null,
    timerInterval: null,
    timerStart: null,
    pauseDuration: 5,
    segments: [],
    allSegments: {},
    streak: 0,
    totalSegments: 0,
    reminders: [],
    settings: {
      location: false,
      mic: false,
      motion: false,
      screen: false,
      inactivity: true,
      patterns: true,
      aiProvider: 'gemini',
      aiApiKey: '',
      theme: 'dark',
      batterySaver: true
    }
  };

  // ===== DOM REFS =====
  const screens = {
    onboarding: document.getElementById('screen-onboarding'),
    pause: document.getElementById('screen-pause'),
    newSegment: document.getElementById('screen-new-segment'),
    active: document.getElementById('screen-active'),
    dashboard: document.getElementById('screen-dashboard'),
    history: document.getElementById('screen-history'),
    analytics: document.getElementById('screen-analytics'),
    settings: document.getElementById('screen-settings')
  };

  // ===== INIT =====
  function init() {
    loadState();
    setupEventListeners();
    setupTheme();
    setupBatteryMonitor();

    if (state.hasOnboarded) {
      showScreen('dashboard');
      updateDashboard();
    }

    updateStreak();
    startReminderScheduler();
    checkNotificationPermission();
    initSmartDetection();
  }

  // ===== PERSISTENCE =====
  function saveState() {
    const toSave = {
      hasOnboarded: state.hasOnboarded,
      pauseDuration: state.pauseDuration,
      allSegments: state.allSegments,
      streak: state.streak,
      totalSegments: state.totalSegments,
      settings: state.settings,
      reminders: state.reminders,
      activeSegment: state.activeSegment,
      timerStart: state.timerStart
    };
    localStorage.setItem('segmentIntending', JSON.stringify(toSave));
  }

  function loadState() {
    const saved = localStorage.getItem('segmentIntending');
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      state.hasOnboarded = data.hasOnboarded || false;
      state.pauseDuration = data.pauseDuration || 5;
      state.allSegments = data.allSegments || {};
      state.streak = data.streak || 0;
      state.totalSegments = data.totalSegments || 0;
      state.settings = { ...state.settings, ...(data.settings || {}) };
      state.reminders = data.reminders || [];
      state.activeSegment = data.activeSegment || null;
      state.timerStart = data.timerStart || null;

      const todayKey = getTodayKey();
      state.segments = state.allSegments[todayKey] || [];

      restoreSettingsUI();

      if (state.activeSegment && state.timerStart) {
        showScreen('active');
        displayActiveSegment();
        startTimer();
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  }

  function restoreSettingsUI() {
    const safeCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };
    safeCheck('toggle-location', state.settings.location);
    safeCheck('toggle-mic', state.settings.mic);
    safeCheck('toggle-motion', state.settings.motion);
    safeCheck('toggle-screen', state.settings.screen);
    safeCheck('toggle-inactivity', state.settings.inactivity !== false);
    safeCheck('toggle-patterns', state.settings.patterns !== false);

    // Show/hide saved places section
    const placesSection = document.getElementById('saved-places-section');
    if (placesSection) placesSection.classList.toggle('hidden', !state.settings.location);

    document.querySelectorAll('.duration-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.duration) === state.pauseDuration);
    });

    // AI settings
    const providerEl = document.getElementById('ai-provider');
    const keyEl = document.getElementById('ai-api-key');
    if (providerEl) providerEl.value = state.settings.aiProvider || 'gemini';
    if (keyEl) keyEl.value = state.settings.aiApiKey || '';

    // Render reminder list
    renderReminderList();
  }

  // ===== HELPERS =====
  function getTodayKey() {
    return new Date().toISOString().split('T')[0];
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString(currentLang, { weekday: 'long', month: 'short', day: 'numeric' });
  }

  // ===== SCREEN NAVIGATION =====
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.nav === name);
    });
  }

  // ===== ONBOARDING =====
  function setupOnboarding() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const btnNext = document.getElementById('btn-onboarding-next');
    const btnSkip = document.getElementById('btn-onboarding-skip');

    function goToSlide(index) {
      slides.forEach((s, i) => {
        s.classList.remove('active', 'exit-left');
        if (i < index) s.classList.add('exit-left');
        if (i === index) s.classList.add('active');
      });
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
      state.currentSlide = index;
      btnNext.textContent = index === slides.length - 1 ? "Let's Begin" : 'Next';
    }

    btnNext.addEventListener('click', () => {
      if (state.currentSlide < slides.length - 1) {
        goToSlide(state.currentSlide + 1);
      } else {
        completeOnboarding();
      }
    });

    btnSkip.addEventListener('click', completeOnboarding);
    dots.forEach(d => {
      d.addEventListener('click', () => goToSlide(parseInt(d.dataset.dot)));
    });
  }

  function completeOnboarding() {
    state.hasOnboarded = true;
    saveState();
    showScreen('dashboard');
    updateDashboard();
  }

  // ===== ACTIVITY CATEGORIES (Accordion) =====
  function setupActivityCategories() {
    // Toggle accordion
    document.querySelectorAll('.category-header').forEach(header => {
      header.addEventListener('click', () => {
        const targetId = header.dataset.toggle;
        const items = document.getElementById(targetId);
        if (!items) return;

        // Close others
        document.querySelectorAll('.category-items.open').forEach(el => {
          if (el.id !== targetId) {
            el.classList.remove('open');
            const h = document.querySelector(`[data-toggle="${el.id}"]`);
            if (h) h.classList.remove('expanded');
          }
        });

        items.classList.toggle('open');
        header.classList.toggle('expanded', items.classList.contains('open'));
      });
    });

    // Activity button selection
    document.getElementById('activity-categories').addEventListener('click', (e) => {
      const btn = e.target.closest('.activity-btn');
      if (!btn) return;

      document.querySelectorAll('.activity-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      state.selectedActivity = btn.dataset.activity;
      state.selectedExample = btn.dataset.example || '';

      setTimeout(() => {
        goToStep('step-intention');
        showExample(state.selectedExample);
      }, 200);
    });

    // Custom activity
    const customInput = document.getElementById('custom-activity-input');
    const customBtn = document.getElementById('btn-custom-go');

    customInput.addEventListener('input', () => {
      customBtn.disabled = customInput.value.trim().length === 0;
    });

    customBtn.addEventListener('click', () => {
      state.selectedActivity = customInput.value.trim();
      state.selectedExample = '';
      goToStep('step-intention');
      showExample('');
    });

    // Voice for custom activity
    setupVoiceForElement('btn-voice-activity', 'custom-activity-input', () => {
      customBtn.disabled = customInput.value.trim().length === 0;
    });
  }

  function showExample(example) {
    const container = document.getElementById('example-intention');
    const text = document.getElementById('example-text');

    if (example) {
      text.textContent = example;
      container.classList.add('visible');
    } else {
      container.classList.remove('visible');
    }
  }

  // ===== NEW SEGMENT FLOW =====
  function startNewSegment(skipPause) {
    state.selectedActivity = null;
    state.selectedExample = '';
    state.intentionText = '';
    state.selectedFeelings = [];
    state.customFeeling = '';

    document.querySelectorAll('.activity-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('intention-text').value = '';
    document.querySelectorAll('.feeling-chip').forEach(c => c.classList.remove('selected'));
    document.getElementById('custom-feeling').value = '';
    document.getElementById('btn-to-feeling').disabled = true;
    document.getElementById('btn-set-intention').disabled = true;
    document.getElementById('custom-activity-input').value = '';
    document.getElementById('btn-custom-go').disabled = true;

    const exEl = document.getElementById('example-intention');
    if (exEl) exEl.classList.remove('visible');

    document.querySelectorAll('.segment-step').forEach(s => s.classList.remove('active'));
    document.getElementById('step-context').classList.add('active');

    // Close all accordion items, open Morning by default
    document.querySelectorAll('.category-items').forEach(el => el.classList.remove('open'));
    document.querySelectorAll('.category-header').forEach(h => h.classList.remove('expanded'));
    const morning = document.getElementById('cat-morning');
    if (morning) morning.classList.add('open');

    if (skipPause || !state.activeSegment) {
      showScreen('newSegment');
    } else {
      showPause(() => showScreen('newSegment'));
    }
  }

  function showPause(callback) {
    showScreen('pause');
    const progressBar = document.querySelector('.pause-progress-bar');
    const duration = state.pauseDuration;
    document.documentElement.style.setProperty('--pause-duration', `${duration}s`);
    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        progressBar.style.transition = `width ${duration}s linear`;
        progressBar.style.width = '100%';
      });
    });
    setTimeout(() => { if (callback) callback(); }, duration * 1000);
  }

  function goToStep(stepId) {
    document.querySelectorAll('.segment-step').forEach(s => s.classList.remove('active'));
    document.getElementById(stepId).classList.add('active');
  }

  // ===== INTENTION INPUT =====
  function setupIntentionInput() {
    const textarea = document.getElementById('intention-text');
    const btnContinue = document.getElementById('btn-to-feeling');

    textarea.addEventListener('input', () => {
      state.intentionText = textarea.value.trim();
      btnContinue.disabled = state.intentionText.length === 0;
    });

    btnContinue.addEventListener('click', () => {
      if (state.intentionText) goToStep('step-feeling');
    });

    // Use example button
    document.getElementById('btn-use-example').addEventListener('click', () => {
      textarea.value = state.selectedExample;
      state.intentionText = state.selectedExample;
      btnContinue.disabled = false;
    });
  }

  // ===== VOICE INPUT (reusable) =====
  function setupVoiceForElement(buttonId, targetId, onResult) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      btn.style.display = 'none';
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;

    btn.addEventListener('click', () => {
      if (recognition) { recognition.stop(); return; }

      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => btn.classList.add('recording');

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const target = document.getElementById(targetId);
        if (target) {
          target.value = transcript;
          target.dispatchEvent(new Event('input'));
        }
        if (onResult) onResult(transcript);
      };

      recognition.onend = () => { btn.classList.remove('recording'); recognition = null; };
      recognition.onerror = () => { btn.classList.remove('recording'); recognition = null; };
      recognition.start();
    });
  }

  function setupMainVoiceInput() {
    const btnVoice = document.getElementById('btn-voice-input');
    const voiceStatus = document.getElementById('voice-status');
    const textarea = document.getElementById('intention-text');

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      btnVoice.style.display = 'none';
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;

    btnVoice.addEventListener('click', () => {
      if (recognition) { recognition.stop(); return; }

      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        btnVoice.classList.add('recording');
        voiceStatus.classList.remove('hidden');
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        textarea.value = transcript;
        state.intentionText = transcript.trim();
        document.getElementById('btn-to-feeling').disabled = state.intentionText.length === 0;
      };

      recognition.onend = () => {
        btnVoice.classList.remove('recording');
        voiceStatus.classList.add('hidden');
        recognition = null;
      };

      recognition.onerror = () => {
        btnVoice.classList.remove('recording');
        voiceStatus.classList.add('hidden');
        recognition = null;
      };

      recognition.start();
    });
  }

  // ===== AI SUGGEST =====
  function setupAISuggest() {
    const btn = document.getElementById('btn-ai-suggest');
    const loading = document.getElementById('ai-loading');

    btn.addEventListener('click', async () => {
      const apiKey = state.settings.aiApiKey;
      if (!apiKey) {
        alert('Please add your AI API key in Settings → AI Assistant first.');
        return;
      }

      btn.style.display = 'none';
      loading.classList.remove('hidden');

      try {
        const intention = await getAISuggestion(
          state.selectedActivity,
          state.settings.aiProvider,
          apiKey
        );

        const textarea = document.getElementById('intention-text');
        textarea.value = intention;
        state.intentionText = intention;
        document.getElementById('btn-to-feeling').disabled = false;
      } catch (e) {
        alert('AI suggestion failed: ' + e.message);
      } finally {
        btn.style.display = 'flex';
        loading.classList.add('hidden');
      }
    });
  }

  async function getAISuggestion(activity, provider, apiKey) {
    const now = new Date();
    const timeOfDay = now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening';
    const recentFeelings = getRecentFeelings();

    const prompt = `You are a mindful intention-setting assistant for the practice of "Segment Intending." 
The user is about to start a new segment: "${activity}" in the ${timeOfDay}.
${recentFeelings ? `Their recent feelings today have been: ${recentFeelings}.` : ''}

Generate ONE powerful, personal intention statement starting with "I intend to..." 
Make it specific to the activity, include both the desired outcome AND the desired feeling/emotion.
Keep it to 1-2 sentences maximum. Be warm, empowering, and genuine. Do not use quotes around it.`;

    if (provider === 'gemini') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 100, temperature: 0.8 }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'I intend to be fully present and aligned.';
    } else {
      // OpenAI
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
          temperature: 0.8
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.choices?.[0]?.message?.content?.trim() || 'I intend to be fully present and aligned.';
    }
  }

  function getRecentFeelings() {
    const todayKey = getTodayKey();
    const todays = state.allSegments[todayKey] || [];
    const feelings = todays.flatMap(s => s.feelings || []);
    return [...new Set(feelings)].slice(0, 5).join(', ');
  }

  // ===== FEELINGS =====
  function setupFeelings() {
    const grid = document.getElementById('feelings-grid');
    const customInput = document.getElementById('custom-feeling');
    const btnSet = document.getElementById('btn-set-intention');

    grid.addEventListener('click', (e) => {
      const chip = e.target.closest('.feeling-chip');
      if (!chip) return;
      chip.classList.toggle('selected');
      const feeling = chip.dataset.feeling;
      if (chip.classList.contains('selected')) {
        state.selectedFeelings.push(feeling);
      } else {
        state.selectedFeelings = state.selectedFeelings.filter(f => f !== feeling);
      }
      updateSetButton();
    });

    customInput.addEventListener('input', () => {
      state.customFeeling = customInput.value.trim();
      updateSetButton();
    });

    function updateSetButton() {
      btnSet.disabled = state.selectedFeelings.length === 0 && state.customFeeling.length === 0;
    }

    btnSet.addEventListener('click', setIntention);
  }

  function setIntention() {
    const feelings = [...state.selectedFeelings];
    if (state.customFeeling) feelings.push(state.customFeeling);

    const segment = {
      id: Date.now(),
      context: state.selectedActivity,
      intention: state.intentionText,
      feelings: feelings,
      timestamp: new Date().toISOString(),
      duration: 0
    };

    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      if (state.activeSegment) {
        const idx = state.segments.findIndex(s => s.id === state.activeSegment.id);
        if (idx >= 0) state.segments[idx].duration = Date.now() - state.timerStart;
      }
    }

    state.activeSegment = segment;
    state.timerStart = Date.now();
    state.segments.push(segment);

    const todayKey = getTodayKey();
    state.allSegments[todayKey] = state.segments;
    state.totalSegments++;

    updateStreak();
    saveState();

    // Notify smart detection that a segment was set
    if (typeof SmartDetect !== 'undefined') SmartDetect.notifySegmentSet();

    showScreen('active');
    displayActiveSegment();
    startTimer();
  }

  function displayActiveSegment() {
    if (!state.activeSegment) return;
    document.getElementById('active-context-badge').textContent = state.activeSegment.context;
    document.getElementById('active-intention-text').textContent = state.activeSegment.intention;
    const feelStr = state.activeSegment.feelings.join(' • ');
    document.getElementById('active-feeling-display').textContent = feelStr ? `Feeling: ${feelStr}` : '';
  }

  function startTimer() {
    const timerEl = document.getElementById('active-timer');
    if (state.timerInterval) clearInterval(state.timerInterval);
    function updateTimer() {
      const elapsed = Date.now() - state.timerStart;
      const mins = Math.floor(elapsed / 60000);
      const secs = Math.floor((elapsed % 60000) / 1000);
      timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    updateTimer();
    state.timerInterval = setInterval(updateTimer, 1000);
  }

  // ===== DASHBOARD =====
  function updateDashboard() {
    const todayKey = getTodayKey();
    state.segments = state.allSegments[todayKey] || [];
    document.getElementById('dashboard-date').textContent = formatDate(new Date());
    document.getElementById('stat-segments').textContent = state.segments.length;
    document.getElementById('stat-streak').textContent = state.streak;
    document.getElementById('stat-total').textContent = state.totalSegments;
    updateFeelingsChart();
    updateLog();
  }

  function updateFeelingsChart() {
    const chart = document.getElementById('feelings-chart');
    const feelingCounts = {};
    state.segments.forEach(seg => {
      (seg.feelings || []).forEach(f => { feelingCounts[f] = (feelingCounts[f] || 0) + 1; });
    });
    const sorted = Object.entries(feelingCounts).sort((a, b) => b[1] - a[1]);
    const maxCount = sorted.length > 0 ? sorted[0][1] : 1;

    if (sorted.length === 0) {
      chart.innerHTML = '<p style="color: var(--text-tertiary); font-size: 0.85rem; padding: 12px 0;">Set segments to see your feeling patterns</p>';
      return;
    }

    chart.innerHTML = sorted.map(([feeling, count]) => `
      <div class="feeling-bar-row">
        <span class="feeling-bar-label">${feeling}</span>
        <div class="feeling-bar-track">
          <div class="feeling-bar-fill" style="width: ${(count / maxCount) * 100}%"></div>
        </div>
        <span class="feeling-bar-count">${count}</span>
      </div>
    `).join('');
  }

  function updateLog() {
    const logList = document.getElementById('log-list');
    if (state.segments.length === 0) {
      logList.innerHTML = `
        <div class="log-empty">
          <p>${t('history_empty')}</p>
          <p class="log-empty-hint">${t('question_context_hint')}</p>
        </div>`;
      return;
    }
    logList.innerHTML = [...state.segments].reverse().map(seg => `
      <div class="log-item">
        <div class="log-time">${formatTime(seg.timestamp)}</div>
        <div class="log-content">
          <div class="log-context">${t(seg.context)}</div>
          <div class="log-intention">${seg.intention}</div>
          <div class="log-feeling">${(seg.feelings || []).map(f => t(f)).join(' • ')}</div>
        </div>
      </div>
    `).join('');
  }

  // ===== STREAK =====
  function updateStreak() {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      if (state.allSegments[key] && state.allSegments[key].length > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    state.streak = streak;
  }

  // ===== HISTORY =====
  function renderHistory() {
    const calendar = document.getElementById('history-calendar');
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    document.getElementById('history-range').textContent =
      new Date(year, month).toLocaleDateString([], { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayDate = now.getDate();

    const headers = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = headers.map(h => `<div class="cal-header">${h}</div>`).join('');
    for (let i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasSegments = state.allSegments[dateKey] && state.allSegments[dateKey].length > 0;
      const isToday = d === todayDate;
      const classes = ['cal-day'];
      if (hasSegments) classes.push('has-segments');
      if (isToday) classes.push('today');
      html += `<div class="${classes.join(' ')}" data-date="${dateKey}">${d}</div>`;
    }

    calendar.innerHTML = html;
    calendar.querySelectorAll('.cal-day:not(.empty)').forEach(day => {
      day.addEventListener('click', () => {
        calendar.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
        day.classList.add('selected');
        showDayDetail(day.dataset.date);
      });
    });
  }

  function showDayDetail(dateKey) {
    const detail = document.getElementById('history-day-detail');
    const segments = state.allSegments[dateKey] || [];
    if (segments.length === 0) {
      detail.innerHTML = '<p class="history-placeholder">No segments on this day</p>';
      return;
    }
    detail.innerHTML = `
      <h3 style="font-family: 'Outfit', sans-serif; font-size: 1rem; margin-bottom: 12px; color: var(--text-primary);">
        ${formatDate(dateKey)} — ${segments.length} segments
      </h3>
      <div class="log-list">
        ${segments.map(seg => `
          <div class="log-item">
            <div class="log-time">${formatTime(seg.timestamp)}</div>
            <div class="log-content">
              <div class="log-context">${seg.context}</div>
              <div class="log-intention">${seg.intention}</div>
              <div class="log-feeling">${(seg.feelings || []).join(' • ')}</div>
            </div>
          </div>
        `).join('')}
      </div>`;
  }

  // ===== SETTINGS =====
  function setupSettings() {
    // Smart Detection toggles
    const smartToggleMap = {
      'toggle-location': { key: 'location', module: 'location' },
      'toggle-mic': { key: 'mic', module: 'noise' },
      'toggle-motion': { key: 'motion', module: 'motion' },
      'toggle-screen': { key: 'screen', module: 'screen' },
      'toggle-inactivity': { key: 'inactivity', module: 'inactivity' },
      'toggle-patterns': { key: 'patterns', module: 'patterns' },
    };

    Object.entries(smartToggleMap).forEach(([id, { key, module }]) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', (e) => {
          state.settings[key] = e.target.checked;
          saveState();
          if (typeof SmartDetect !== 'undefined') {
            SmartDetect.setEnabled(module, e.target.checked);
          }
          // Show/hide saved places when location toggled
          if (key === 'location') {
            const ps = document.getElementById('saved-places-section');
            if (ps) ps.classList.toggle('hidden', !e.target.checked);
          }
          updateDetectionStatus();
        });
      }
    });

    // Saved places UI
    setupSavedPlacesUI();

    // Pause duration
    document.querySelectorAll('.duration-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.pauseDuration = parseInt(btn.dataset.duration);
        saveState();
      });
    });

    // AI settings
    const providerEl = document.getElementById('ai-provider');
    const keyEl = document.getElementById('ai-api-key');
    const toggleKeyBtn = document.getElementById('btn-toggle-key');

    if (providerEl) {
      providerEl.addEventListener('change', () => {
        state.settings.aiProvider = providerEl.value;
        saveState();
      });
    }

    if (keyEl) {
      keyEl.addEventListener('input', () => {
        state.settings.aiApiKey = keyEl.value.trim();
        saveState();
      });
    }

    if (toggleKeyBtn) {
      toggleKeyBtn.addEventListener('click', () => {
        keyEl.type = keyEl.type === 'password' ? 'text' : 'password';
      });
    }

    // Export
    document.getElementById('btn-export').addEventListener('click', exportData);

    // Clear
    document.getElementById('btn-clear-data').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all your segment data? This cannot be undone.')) {
        localStorage.removeItem('segmentIntending');
        location.reload();
      }
    });

    // Reminders
    setupReminders();
  }

  // ===== REMINDERS SYSTEM =====
  function setupReminders() {
    // Enable notifications button
    const btnEnable = document.getElementById('btn-enable-notifications');
    if (btnEnable) {
      btnEnable.addEventListener('click', async () => {
        const perm = await Notification.requestPermission();
        checkNotificationPermission();
        if (perm === 'granted') {
          new Notification('Segment Intending', {
            body: '✅ Notifications enabled! You\'ll be reminded to set intentions.',
            icon: 'icons/icon-192.png'
          });
        }
      });
    }

    // Add reminder button
    document.getElementById('btn-add-reminder').addEventListener('click', openReminderModal);
    document.getElementById('btn-close-reminder-modal').addEventListener('click', closeReminderModal);
    document.getElementById('btn-save-reminder').addEventListener('click', saveReminder);

    // Custom activity toggle in modal
    const customCheck = document.getElementById('reminder-custom-check');
    if (customCheck) {
      customCheck.addEventListener('change', () => {
        const actSelect = document.getElementById('reminder-activity');
        const customDiv = document.getElementById('modal-custom-activity');
        if (customCheck.checked) {
          actSelect.disabled = true;
          customDiv.style.display = 'block';
        } else {
          actSelect.disabled = false;
          customDiv.style.display = 'none';
        }
      });
    }

    // Repeat buttons
    document.querySelectorAll('.repeat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.repeat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Close modal on overlay tap
    document.getElementById('reminder-modal').addEventListener('click', (e) => {
      if (e.target.classList.contains('reminder-modal-overlay')) closeReminderModal();
    });

    renderReminderList();
  }

  function checkNotificationPermission() {
    const dot = document.getElementById('permission-dot');
    const text = document.getElementById('permission-text');
    const btn = document.getElementById('btn-enable-notifications');

    if (!('Notification' in window)) {
      dot.className = 'permission-dot denied';
      text.textContent = 'Notifications not supported in this browser';
      if (btn) btn.style.display = 'none';
      return;
    }

    const perm = Notification.permission;
    if (perm === 'granted') {
      dot.className = 'permission-dot granted';
      text.textContent = 'Notifications: enabled ✓';
      if (btn) btn.style.display = 'none';
    } else if (perm === 'denied') {
      dot.className = 'permission-dot denied';
      text.textContent = 'Notifications: blocked. Please enable in browser settings.';
      if (btn) btn.style.display = 'none';
    } else {
      dot.className = 'permission-dot pending';
      text.textContent = 'Notifications: not yet enabled';
      if (btn) btn.style.display = 'inline-flex';
    }
  }

  function openReminderModal() {
    // Reset form
    document.getElementById('reminder-activity').value = '';
    document.getElementById('reminder-activity').disabled = false;
    document.getElementById('reminder-custom-check').checked = false;
    document.getElementById('modal-custom-activity').style.display = 'none';
    document.getElementById('reminder-custom-activity').value = '';
    document.getElementById('reminder-time').value = '09:00';
    document.querySelectorAll('.repeat-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.repeat-btn[data-repeat="daily"]').classList.add('active');
    document.getElementById('alert-notification').checked = true;
    document.getElementById('alert-sound').checked = true;
    document.getElementById('alert-vibration').checked = false;

    document.getElementById('reminder-modal').classList.remove('hidden');
  }

  function closeReminderModal() {
    document.getElementById('reminder-modal').classList.add('hidden');
  }

  function saveReminder() {
    const useCustom = document.getElementById('reminder-custom-check').checked;
    let activity;
    if (useCustom) {
      activity = document.getElementById('reminder-custom-activity').value.trim();
    } else {
      activity = document.getElementById('reminder-activity').value;
    }
    if (!activity) { alert('Please select or enter an activity.'); return; }

    const time = document.getElementById('reminder-time').value;
    if (!time) { alert('Please set a time.'); return; }

    const repeat = document.querySelector('.repeat-btn.active')?.dataset.repeat || 'daily';
    const alertNotif = document.getElementById('alert-notification').checked;
    const alertSound = document.getElementById('alert-sound').checked;
    const alertVibrate = document.getElementById('alert-vibration').checked;

    const reminder = {
      id: Date.now(),
      activity,
      time,
      repeat,
      alerts: {
        notification: alertNotif,
        sound: alertSound,
        vibration: alertVibrate
      },
      enabled: true,
      lastFired: null
    };

    state.reminders.push(reminder);
    saveState();
    renderReminderList();
    closeReminderModal();

    // Prompt for notification permission if needed
    if (alertNotif && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(() => checkNotificationPermission());
    }
  }

  function deleteReminder(id) {
    state.reminders = state.reminders.filter(r => r.id !== id);
    saveState();
    renderReminderList();
  }

  function toggleReminder(id) {
    const r = state.reminders.find(r => r.id === id);
    if (r) {
      r.enabled = !r.enabled;
      saveState();
      renderReminderList();
    }
  }

  function renderReminderList() {
    const list = document.getElementById('reminder-list');
    const empty = document.getElementById('reminder-empty');
    if (!list) return;

    // Clear existing items (keep empty placeholder)
    list.querySelectorAll('.reminder-item').forEach(el => el.remove());

    if (state.reminders.length === 0) {
      if (empty) empty.style.display = 'block';
      return;
    }

    if (empty) empty.style.display = 'none';

    state.reminders.forEach(r => {
      const div = document.createElement('div');
      div.className = `reminder-item ${r.enabled ? '' : 'disabled'}`;

      const alertIcons = [];
      if (r.alerts.notification) alertIcons.push('🔔');
      if (r.alerts.sound) alertIcons.push('🔊');
      if (r.alerts.vibration) alertIcons.push('📳');

      const repeatLabel = { daily: t('rep_every_day'), weekdays: t('rep_weekdays'), weekends: t('rep_weekends'), once: t('rep_once') };

      div.innerHTML = `
        <div class="reminder-info">
          <div class="reminder-activity-name">${t(r.activity)}</div>
          <div class="reminder-meta">
            <span class="reminder-time-badge">⏰ ${formatReminderTime(r.time)}</span>
            <span class="reminder-repeat-badge">${repeatLabel[r.repeat] || r.repeat}</span>
            <span class="reminder-alerts">${alertIcons.join(' ')}</span>
          </div>
        </div>
        <div class="reminder-actions">
          <label class="toggle toggle-small">
            <input type="checkbox" ${r.enabled ? 'checked' : ''} data-toggle-reminder="${r.id}">
            <span class="toggle-slider"></span>
          </label>
          <button class="reminder-delete" data-delete-reminder="${r.id}">🗑️</button>
        </div>
      `;

      // Event listeners
      div.querySelector('[data-toggle-reminder]').addEventListener('change', () => toggleReminder(r.id));
      div.querySelector('[data-delete-reminder]').addEventListener('click', () => {
        if (confirm(`Delete reminder for "${r.activity}" at ${formatReminderTime(r.time)}?`)) deleteReminder(r.id);
      });

      list.appendChild(div);
    });
  }

  function formatReminderTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  // ===== REMINDER SCHEDULER =====
  function startReminderScheduler() {
    // Check every 30 seconds
    setInterval(checkReminders, 30000);
    // Also check immediately
    setTimeout(checkReminders, 2000);
  }

  function checkReminders() {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat
    const todayKey = getTodayKey();

    state.reminders.forEach(r => {
      if (!r.enabled) return;
      if (r.time !== currentTime) return;

      // Check if already fired in this minute today
      if (r.lastFired && r.lastFired.startsWith(todayKey + 'T' + currentTime)) return;

      // Check repeat schedule
      if (r.repeat === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) return;
      if (r.repeat === 'weekends' && dayOfWeek >= 1 && dayOfWeek <= 5) return;

      // FIRE the reminder!
      fireReminder(r);

      // Mark as fired
      r.lastFired = now.toISOString();

      // If one-time, disable it
      if (r.repeat === 'once') r.enabled = false;

      saveState();
      renderReminderList();
    });
  }

  function fireReminder(reminder) {
    // 1. Browser Notification with actions
    if (reminder.alerts.notification && 'Notification' in window && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Use SW for interactive notification actions
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification('⏰ Time to set an intention!', {
            body: `It's time for: ${reminder.activity}. Pause and set your intention.`,
            icon: 'icons/icon-192.png',
            badge: 'icons/icon-72.png',
            tag: `reminder-${reminder.id}`,
            requireInteraction: true,
            actions: [
              { action: 'start-segment', title: '✨ Set Intention' },
              { action: 'snooze', title: '💤 Snooze 10min' },
              { action: 'dismiss', title: '✕ Dismiss' }
            ]
          });
        });
      } else {
        // Fallback for no SW
        const notif = new Notification('⏰ Time to set an intention!', {
          body: `It's time for: ${reminder.activity}. Pause and set your intention.`,
          icon: 'icons/icon-192.png',
          tag: `reminder-${reminder.id}`,
          requireInteraction: true
        });
        notif.onclick = () => {
          window.focus();
          startNewSegment(true);
          notif.close();
        };
      }
    }

    // 2. Sound
    if (reminder.alerts.sound) {
      playReminderSound();
    }

    // 3. Vibration
    if (reminder.alerts.vibration && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  }

  // Listen for messages from Service Worker (interactive notifications)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'START_SEGMENT') {
        startNewSegment(true);
      }
    });
  }

  function playReminderSound() {
    // Generate a gentle bell chime using Web Audio API
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.3);
        osc.stop(ctx.currentTime + i * 0.3 + 0.8);
      });
    } catch (e) {
      // Fallback: do nothing if AudioContext is not available
    }
  }

  function exportData() {
    const data = {
      exported: new Date().toISOString(),
      totalSegments: state.totalSegments,
      streak: state.streak,
      segments: state.allSegments
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `segment-intending-${getTodayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ===== NAVIGATION =====
  function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const nav = item.dataset.nav;
        showScreen(nav);
        if (nav === 'dashboard') updateDashboard();
        if (nav === 'history') renderHistory();
        if (nav === 'analytics') updateAnalytics();
      });
    });

    document.getElementById('btn-new-segment').addEventListener('click', () => startNewSegment(false));
    document.getElementById('btn-new-from-dashboard').addEventListener('click', () => startNewSegment(state.activeSegment ? false : true));

    document.getElementById('btn-go-dashboard').addEventListener('click', () => {
      showScreen('dashboard');
      updateDashboard();
    });

    document.getElementById('btn-back-from-segment').addEventListener('click', () => {
      const currentStep = document.querySelector('.segment-step.active');
      if (currentStep.id === 'step-feeling') {
        goToStep('step-intention');
      } else if (currentStep.id === 'step-intention') {
        goToStep('step-context');
      } else {
        if (state.activeSegment) {
          showScreen('active');
        } else {
          showScreen('dashboard');
          updateDashboard();
        }
      }
    });
  }

  // ===== SETUP ALL =====
  function setupEventListeners() {
    setupOnboarding();
    setupActivityCategories();
    setupIntentionInput();
    setupMainVoiceInput();
    setupAISuggest();
    setupFeelings();
    setupSettings();
    setupNavigation();
    setupImport();
    setupAnalyticsEvents();
    checkNotificationPermission();

    // Swipe for onboarding
    let touchStartX = 0;
    screens.onboarding.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    screens.onboarding.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 60) {
        if (diff > 0 && state.currentSlide < 3) {
          document.getElementById('btn-onboarding-next').click();
        } else if (diff < 0 && state.currentSlide > 0) {
          const slides = document.querySelectorAll('.slide');
          const dots = document.querySelectorAll('.dot');
          const prev = state.currentSlide - 1;
          slides.forEach((s, i) => {
            s.classList.remove('active', 'exit-left');
            if (i < prev) s.classList.add('exit-left');
            if (i === prev) s.classList.add('active');
          });
          dots.forEach((d, i) => d.classList.toggle('active', i === prev));
          state.currentSlide = prev;
          document.getElementById('btn-onboarding-next').textContent = 'Next';
        }
      }
    }, { passive: true });
  }

  // ===== SMART DETECTION INTEGRATION =====
  let lastDetectionData = null;
  let bannerTimeout = null;

  function initSmartDetection() {
    if (typeof SmartDetect === 'undefined') return;

    SmartDetect.init(onSmartDetection);

    // Enable modules based on saved settings
    const moduleMap = {
      location: 'location',
      motion: 'motion',
      mic: 'noise',
      screen: 'screen',
      inactivity: 'inactivity',
      patterns: 'patterns'
    };

    Object.entries(moduleMap).forEach(([settingKey, module]) => {
      if (state.settings[settingKey]) {
        SmartDetect.setEnabled(module, true);
      }
    });

    // Update status display periodically
    setInterval(updateDetectionStatus, 5000);
    updateDetectionStatus();
  }

  function onSmartDetection(type, data) {
    console.log('[App] Smart detection:', type, data);

    // Skip "started" and "unavailable" events for banner
    if (type.endsWith('_started') || type.endsWith('_unavailable')) {
      updateDetectionStatus();
      return;
    }

    lastDetectionData = { type, data };

    // Determine icon based on type
    const icons = {
      motion_change: '🏃',
      location_arrived: '📍',
      location_left: '🚗',
      location_moved: '🗺️',
      screen_return: '📱',
      inactivity: '⏰',
      noise_change: '🔊',
      pattern_match: '📊'
    };

    let msgKey = 'smart_banner_title';
    switch (type) {
      case 'motion_change': msgKey = 'smart_msg_motion'; break;
      case 'location_arrived': msgKey = 'smart_msg_location'; break;
      case 'location_left': msgKey = 'smart_msg_motion'; break;
      case 'location_moved': msgKey = 'smart_msg_motion'; break;
      case 'screen_return': msgKey = 'smart_msg_screen'; break;
      case 'inactivity': msgKey = 'smart_msg_inactivity'; break;
      case 'noise_change': msgKey = 'smart_msg_noise'; break;
      case 'pattern_match': msgKey = 'smart_msg_pattern'; break;
      default: msgKey = 'smart_banner_title';
    }

    const displayTitle = t('smart_banner_title');
    const displayMsg = t(msgKey);

    showSmartBanner(
      icons[type] || '🔔',
      displayTitle,
      displayMsg,
      data.suggestedActivity || null
    );

    // Also fire a lightweight notification if enabled
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification(displayTitle, {
          body: displayMsg,
          icon: 'icons/icon-192.png',
          tag: 'smart-detect-' + type,
          requireInteraction: false
        });
        n.onclick = () => {
          window.focus();
          startNewSegment(true);
          if (data.suggestedActivity) {
            // Try to pre-select the activity
            setTimeout(() => preselectActivity(data.suggestedActivity), 100);
          }
          n.close();
        };
      } catch (e) { }
    }

    // Play sound alert
    playReminderSound();

    // Vibrate on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate([150, 80, 150]);
    }

    updateDetectionStatus();
  }

  function showSmartBanner(icon, title, msg, suggestedActivity) {
    const banner = document.getElementById('smart-banner');
    if (!banner) return;

    document.getElementById('smart-banner-icon').textContent = icon;
    document.getElementById('smart-banner-title').textContent = title;
    document.getElementById('smart-banner-msg').textContent = msg;

    banner.classList.remove('hidden');

    // Auto-dismiss after 15 seconds
    if (bannerTimeout) clearTimeout(bannerTimeout);
    bannerTimeout = setTimeout(() => dismissSmartBanner(), 15000);

    // Set Intention button
    const btnSet = document.getElementById('smart-banner-set');
    btnSet.onclick = () => {
      dismissSmartBanner();
      startNewSegment(true);
      if (suggestedActivity) {
        setTimeout(() => preselectActivity(suggestedActivity), 100);
      }
    };

    // Dismiss button
    document.getElementById('smart-banner-dismiss').onclick = dismissSmartBanner;
    document.getElementById('smart-banner-close').onclick = dismissSmartBanner;
  }

  function dismissSmartBanner() {
    const banner = document.getElementById('smart-banner');
    if (banner) banner.classList.add('hidden');
    if (bannerTimeout) clearTimeout(bannerTimeout);
  }

  function preselectActivity(activityName) {
    // Try to click the matching activity button
    document.querySelectorAll('.activity-btn').forEach(btn => {
      if (btn.dataset.activity === activityName ||
        btn.textContent.trim().includes(activityName)) {
        btn.click();
      }
    });
  }

  function updateDetectionStatus() {
    if (typeof SmartDetect === 'undefined') return;
    const status = SmartDetect.getStatus();

    const update = (id, value, active) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = value;
        el.classList.toggle('active', active);
      }
    };

    // Motion
    if (status.motion.enabled) {
      const labels = { unknown: t('Scanning...'), still: t('Still'), walking: t('Walking'), active: t('Active') };
      update('status-motion-val', labels[status.motion.state] || t('On'), true);
    } else {
      update('status-motion-val', t('Off'), false);
    }

    // Location
    if (status.location.enabled) {
      update('status-location-val', status.location.currentPlace || t('Tracking'), true);
    } else {
      update('status-location-val', t('Off'), false);
    }

    // Noise
    if (status.noise.enabled) {
      const labels = { unknown: t('Listening...'), quiet: t('Quiet'), moderate: t('Medium'), loud: t('Loud') };
      update('status-noise-val', labels[status.noise.state] || t('On'), true);
    } else {
      update('status-noise-val', t('Off'), false);
    }

    // Screen
    if (status.screen.enabled) {
      update('status-screen-val', t('Active'), true);
    } else {
      update('status-screen-val', t('Off'), false);
    }
  }

  function setupSavedPlacesUI() {
    const btnSave = document.getElementById('btn-save-current-place');
    const form = document.getElementById('save-place-form');
    const btnConfirm = document.getElementById('btn-confirm-save-place');

    if (btnSave) {
      btnSave.addEventListener('click', () => {
        form.classList.toggle('hidden');
      });
    }

    if (btnConfirm) {
      btnConfirm.addEventListener('click', () => {
        const name = document.getElementById('place-name').value.trim();
        const activity = document.getElementById('place-activity').value;
        if (!name) return;

        if (typeof SmartDetect !== 'undefined') {
          const result = SmartDetect.saveCurrentAsPlace(name, activity);
          if (result) {
            document.getElementById('place-name').value = '';
            document.getElementById('place-activity').value = '';
            form.classList.add('hidden');
            renderSavedPlaces();
          } else {
            alert('Unable to save location. Make sure Location Awareness is enabled and your position is available.');
          }
        }
      });
    }

    renderSavedPlaces();
  }

  function renderSavedPlaces() {
    if (typeof SmartDetect === 'undefined') return;
    const places = SmartDetect.getSavedPlaces();
    const list = document.getElementById('saved-places-list');
    const empty = document.getElementById('saved-places-empty');
    if (!list) return;

    if (places.length === 0) {
      list.innerHTML = '<p class="saved-places-empty">No saved places yet</p>';
      return;
    }

    const placeIcons = {
      'home': '🏠', 'work': '🏢', 'office': '🏢', 'gym': '💪',
      'school': '🎓', 'church': '⛪', 'store': '🏪', 'park': '🌳',
      'default': '📍'
    };

    list.innerHTML = places.map(p => {
      const icon = placeIcons[p.name.toLowerCase()] || placeIcons.default;
      return `
        <div class="saved-place-item">
          <div class="saved-place-info">
            <span class="saved-place-icon">${icon}</span>
            <div>
              <div class="saved-place-name">${p.name}</div>
              ${p.activity ? `<div class="saved-place-activity">→ ${p.activity}</div>` : ''}
            </div>
          </div>
          <button class="saved-place-delete" data-place="${p.name}" title="Remove">×</button>
        </div>`;
    }).join('');

    // Delete handlers
    list.querySelectorAll('.saved-place-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm(`Remove "${btn.dataset.place}"?`)) {
          SmartDetect.removePlace(btn.dataset.place);
          renderSavedPlaces();
        }
      });
    });
  }

  // ===== IMPORT DATA =====
  function setupImport() {
    const btnImport = document.getElementById('btn-import');
    const fileInput = document.getElementById('import-file-input');
    if (!btnImport || !fileInput) return;

    btnImport.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          if (!data.segments && !data.allSegments) {
            alert('Invalid backup file. Missing segment data.');
            return;
          }
          if (confirm('This will merge imported data with your existing data. Existing entries for the same dates will be overwritten. Continue?')) {
            const imported = data.allSegments || data.segments || {};
            Object.keys(imported).forEach(dateKey => {
              if (!state.allSegments[dateKey]) {
                state.allSegments[dateKey] = [];
              }
              const existing = state.allSegments[dateKey].map(s => s.startTime);
              imported[dateKey].forEach(seg => {
                if (!existing.includes(seg.startTime)) {
                  state.allSegments[dateKey].push(seg);
                }
              });
            });
            state.totalSegments = Object.values(state.allSegments)
              .reduce((sum, daySegs) => sum + daySegs.length, 0);
            const todayKey = getTodayKey();
            state.segments = state.allSegments[todayKey] || [];
            saveState();
            updateDashboard();
            updateStreak();
            alert('Data imported successfully! (' + Object.keys(imported).length + ' days)');
          }
        } catch (err) {
          alert('Error reading file: ' + err.message);
        }
      };
      reader.readAsText(file);
      fileInput.value = '';
    });
  }

  // ===== THEME SYSTEM =====
  function setupTheme() {
    const savedTheme = state.settings.theme || 'dark';
    applyTheme(savedTheme);

    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.settings.theme = theme;
        saveState();
        applyTheme(theme);
      });
    });

    // Listen for system theme changes (for auto mode)
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
        if (state.settings.theme === 'auto') applyTheme('auto');
      });
    }
  }

  function applyTheme(theme) {
    let actual = theme;
    if (theme === 'auto') {
      actual = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', actual);

    // Update active button
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  }

  // ===== BATTERY MONITOR =====
  function setupBatteryMonitor() {
    const toggle = document.getElementById('toggle-battery-saver');
    if (toggle) {
      toggle.checked = state.settings.batterySaver;
      toggle.addEventListener('change', () => {
        state.settings.batterySaver = toggle.checked;
        saveState();
      });
    }

    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        updateBatteryUI(battery);
        battery.addEventListener('chargingchange', () => updateBatteryUI(battery));
        battery.addEventListener('levelchange', () => updateBatteryUI(battery));
      });
    } else {
      const statusEl = document.getElementById('battery-status');
      if (statusEl) {
        document.getElementById('battery-text').textContent = 'Battery API not available';
      }
    }
  }

  function updateBatteryUI(battery) {
    const icon = document.getElementById('battery-icon');
    const text = document.getElementById('battery-text');
    const statusEl = document.getElementById('battery-status');
    if (!icon || !text || !statusEl) return;

    const level = Math.round(battery.level * 100);
    const charging = battery.charging;

    statusEl.classList.remove('low', 'charging');
    if (charging) {
      icon.textContent = '⚡';
      text.textContent = `Battery: ${level}% (charging)`;
      statusEl.classList.add('charging');
    } else if (level <= 20) {
      icon.textContent = '🪫';
      text.textContent = `Battery: ${level}% — low power mode`;
      statusEl.classList.add('low');

      // Auto-throttle sensors when battery is low
      if (state.settings.batterySaver && typeof SmartDetect !== 'undefined') {
        SmartDetect.setBatterySaving && SmartDetect.setBatterySaving(true);
      }
    } else {
      icon.textContent = '🔋';
      text.textContent = `Battery: ${level}%`;
      if (typeof SmartDetect !== 'undefined') {
        SmartDetect.setBatterySaving && SmartDetect.setBatterySaving(false);
      }
    }
  }

  // ===== ANALYTICS SYSTEM =====
  let analyticsPeriod = 'week';

  function setupAnalyticsEvents() {
    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        analyticsPeriod = btn.dataset.period;
        updateAnalytics();
      });
    });
  }

  function getFilteredSegments() {
    const now = new Date();
    const allDates = Object.keys(state.allSegments).sort();
    let filtered = {};

    if (analyticsPeriod === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      allDates.forEach(d => {
        if (new Date(d) >= weekAgo) filtered[d] = state.allSegments[d];
      });
    } else if (analyticsPeriod === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);
      allDates.forEach(d => {
        if (new Date(d) >= monthAgo) filtered[d] = state.allSegments[d];
      });
    } else {
      filtered = { ...state.allSegments };
    }
    return filtered;
  }

  function updateAnalytics() {
    const data = getFilteredSegments();
    const allSegs = Object.values(data).flat();

    // Stats
    const totalSegs = allSegs.length;
    const daysCount = Object.keys(data).length || 1;
    const avgDaily = (totalSegs / daysCount).toFixed(1);
    const bestDay = Math.max(...Object.values(data).map(d => d.length), 0);

    document.getElementById('analytics-total-segments').textContent = totalSegs;
    document.getElementById('analytics-avg-daily').textContent = avgDaily;
    document.getElementById('analytics-best-day').textContent = bestDay;
    document.getElementById('analytics-streak').textContent = state.streak;

    drawMoodChart(data);
    drawActivityDonut(allSegs);
    drawSegmentsBarChart(data);
    renderTopActivities(allSegs);
  }

  // Chart colors palette
  const CHART_COLORS = [
    '#7c5cfc', '#36d1dc', '#f5a623', '#f25c5c', '#36d1a0',
    '#5b86e5', '#e877c0', '#ffd166', '#06d6a0', '#8b5cf6'
  ];

  function drawMoodChart(data) {
    const canvas = document.getElementById('mood-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth;
    const h = 180;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const feelingMap = { '😊': 5, '😌': 4, '🤔': 3, '😤': 2, '😰': 1, '😴': 3, '💪': 5, '🙏': 4, '😐': 3 };
    const dates = Object.keys(data).sort().slice(-14);
    if (!dates.length) {
      ctx.fillStyle = 'rgba(240,240,255,0.3)';
      ctx.font = '13px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet — start logging!', w / 2, h / 2);
      return;
    }

    const points = dates.map(d => {
      const segs = data[d] || [];
      const feelings = segs.flatMap(s => s.feelings || []);
      if (!feelings.length) return null;
      const avg = feelings.reduce((sum, f) => sum + (feelingMap[f] || 3), 0) / feelings.length;
      return avg;
    });

    const padding = { top: 20, right: 16, bottom: 30, left: 16 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    // Draw gridlines
    ctx.strokeStyle = 'rgba(124, 92, 252, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const y = padding.top + chartH - ((i - 1) / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Draw line
    const validPoints = [];
    points.forEach((p, i) => {
      if (p !== null) {
        const x = padding.left + (i / Math.max(dates.length - 1, 1)) * chartW;
        const y = padding.top + chartH - ((p - 1) / 4) * chartH;
        validPoints.push({ x, y });
      }
    });

    if (validPoints.length > 1) {
      // Gradient fill under line
      const grad = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
      grad.addColorStop(0, 'rgba(124, 92, 252, 0.25)');
      grad.addColorStop(1, 'rgba(124, 92, 252, 0)');

      ctx.beginPath();
      ctx.moveTo(validPoints[0].x, h - padding.bottom);
      validPoints.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(validPoints[validPoints.length - 1].x, h - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.moveTo(validPoints[0].x, validPoints[0].y);
      for (let i = 1; i < validPoints.length; i++) {
        const xm = (validPoints[i - 1].x + validPoints[i].x) / 2;
        ctx.bezierCurveTo(xm, validPoints[i - 1].y, xm, validPoints[i].y, validPoints[i].x, validPoints[i].y);
      }
      ctx.strokeStyle = '#7c5cfc';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Dots
      validPoints.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#7c5cfc';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      });
    }

    // Date labels
    ctx.fillStyle = 'rgba(240,240,255,0.4)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    const labelStep = Math.max(1, Math.floor(dates.length / 6));
    dates.forEach((d, i) => {
      if (i % labelStep === 0 || i === dates.length - 1) {
        const x = padding.left + (i / Math.max(dates.length - 1, 1)) * chartW;
        const label = new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        ctx.fillText(label, x, h - 8);
      }
    });
  }

  function drawActivityDonut(segments) {
    const canvas = document.getElementById('activity-donut');
    const legend = document.getElementById('activity-legend');
    if (!canvas || !legend) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 160;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const counts = {};
    segments.forEach(s => {
      const act = s.activity || 'Other';
      counts[act] = (counts[act] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const total = sorted.reduce((s, e) => s + e[1], 0);

    if (!total) {
      ctx.fillStyle = 'rgba(240,240,255,0.3)';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('No data', size / 2, size / 2 + 4);
      legend.innerHTML = '';
      return;
    }

    const cx = size / 2, cy = size / 2, r = 62, innerR = 40;
    let startAngle = -Math.PI / 2;

    sorted.forEach(([act, count], i) => {
      const sweep = (count / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, startAngle + sweep);
      ctx.arc(cx, cy, innerR, startAngle + sweep, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length];
      ctx.fill();
      startAngle += sweep;
    });

    // Center text
    ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'light' ? '#1a1a2e' : '#f0f0ff';
    ctx.font = 'bold 20px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText(total, cx, cy + 2);
    ctx.font = '10px Inter';
    ctx.fillStyle = 'rgba(240,240,255,0.5)';
    ctx.fillText('segments', cx, cy + 16);

    // Legend
    legend.innerHTML = sorted.map(([act, count], i) => `
      <div class="legend-item">
        <span class="legend-dot" style="background:${CHART_COLORS[i % CHART_COLORS.length]}"></span>
        <span class="legend-label">${act}</span>
        <span class="legend-value">${count}</span>
      </div>
    `).join('');
  }

  function drawSegmentsBarChart(data) {
    const canvas = document.getElementById('segments-bar-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth;
    const h = 160;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const dates = Object.keys(data).sort().slice(-14);
    if (!dates.length) {
      ctx.fillStyle = 'rgba(240,240,255,0.3)';
      ctx.font = '13px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet', w / 2, h / 2);
      return;
    }

    const values = dates.map(d => (data[d] || []).length);
    const maxVal = Math.max(...values, 1);
    const padding = { top: 14, right: 16, bottom: 30, left: 16 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const barW = Math.min(28, (chartW / dates.length) * 0.65);
    const gap = (chartW - barW * dates.length) / dates.length;

    values.forEach((val, i) => {
      const barH = (val / maxVal) * chartH;
      const x = padding.left + i * (barW + gap) + gap / 2;
      const y = padding.top + chartH - barH;

      // Bar gradient
      const grad = ctx.createLinearGradient(x, y, x, y + barH);
      grad.addColorStop(0, '#7c5cfc');
      grad.addColorStop(1, '#36d1dc');
      ctx.fillStyle = grad;

      // Rounded top
      const radius = Math.min(barW / 2, 6);
      ctx.beginPath();
      ctx.moveTo(x, y + barH);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.lineTo(x + barW - radius, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
      ctx.lineTo(x + barW, y + barH);
      ctx.closePath();
      ctx.fill();

      // Value on top
      if (val > 0) {
        ctx.fillStyle = 'rgba(240,240,255,0.6)';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(val, x + barW / 2, y - 4);
      }

      // Date label
      ctx.fillStyle = 'rgba(240,240,255,0.35)';
      ctx.font = '9px Inter';
      ctx.textAlign = 'center';
      const label = new Date(dates[i]).toLocaleDateString(undefined, { weekday: 'short' });
      ctx.fillText(label, x + barW / 2, h - 8);
    });
  }

  function renderTopActivities(segments) {
    const container = document.getElementById('top-activities-list');
    if (!container) return;

    const counts = {};
    segments.forEach(s => {
      const act = s.activity || 'Other';
      counts[act] = (counts[act] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    if (!sorted.length) {
      container.innerHTML = '<p class="analytics-empty">No activities logged yet</p>';
      return;
    }

    const medals = ['🥇', '🥈', '🥉', '4', '5'];
    container.innerHTML = sorted.map(([act, count], i) => `
      <div class="top-activity-item" style="animation-delay: ${i * 0.08}s">
        <span class="top-activity-rank">${medals[i]}</span>
        <span class="top-activity-name">${act}</span>
        <span class="top-activity-count">${count}×</span>
      </div>
    `).join('');
  }

  // Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { });
    });
  }

  // GO
  // Language Selector Fix
  document.addEventListener('DOMContentLoaded', () => {
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => setLanguage(e.target.value));
      if (typeof currentLang !== 'undefined') langSelect.value = currentLang;
    }
  });
  // Dynamic Re-render on Language Change
  window.addEventListener('language-changed', () => {
    renderReminderList();
    updateDashboard();
    updateDetectionStatus();
    updateLog();
  });
  document.addEventListener('DOMContentLoaded', init);
})();
