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
      aiApiKey: ''
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
    settings: document.getElementById('screen-settings')
  };

  // ===== INIT =====
  function init() {
    loadState();
    setupEventListeners();

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
    // 1. Browser Notification
    if (reminder.alerts.notification && 'Notification' in window && Notification.permission === 'granted') {
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

    // 2. Sound
    if (reminder.alerts.sound) {
      playReminderSound();
    }

    // 3. Vibration
    if (reminder.alerts.vibration && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
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

  // Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { });
    });
  }

  // GO
  document.addEventListener('DOMContentLoaded', init);
})();
