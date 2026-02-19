const translations = {
    en: {
        // General
        app_title: "Segment Intending",
        next: "Next",
        skip: "Skip",
        not_now: "Not now",
        get_started: "Get Started",
        cancel: "Cancel",
        save: "Save",
        delete: "Delete",
        edit: "Edit",
        close: "Close",

        // Onboarding
        ob_title_1: "Welcome to Segment Intending",
        ob_desc_1: "Master your day, one segment at a time. Stop living by default and start living by design.",
        ob_title_2: "Pause & Reset",
        ob_desc_2: "Before starting a new activity, take a moment to pause. Release the previous segment.",
        ob_title_3: "Live Intentionally",
        ob_desc_3: "Set a clear intention active for what you want to experience next. Watch your life change.",

        // Dashboard
        streak_title: "Current Streak",
        streak_unit: "Segments",
        greeting_morning: "Good morning",
        greeting_afternoon: "Good afternoon",
        greeting_evening: "Good evening",
        question_context: "What are you going to do?",
        question_context_hint: "Choose your next activity",
        question_intention: "What is your intention?",
        placeholder_intention: "I intend to...",
        btn_start_segment: "Start Segment",
        btn_pause_breath: "Pause & Breathe",

        // Categories
        cat_morning: "Morning",
        cat_work: "Work",
        cat_movement: "Body & Health",
        cat_selfcare: "Wellbeing",
        cat_social: "People",
        cat_evening: "Evening",
        cat_travel: "Travel",
        cat_custom: "Custom",

        // Active Screen
        current_segment: "Current Segment",
        intention_label: "Intention:",
        feeling_label: "Feeling:",
        btn_complete: "Complete Segment",

        // History
        history_title: "Your History",
        history_empty: "No segments yet. Start your first one!",
        btn_export: "Export CSV",
        btn_clear: "Clear Data",
        confirm_clear: "Are you sure you want to clear all your segment data? This cannot be undone.",

        // Settings
        settings_title: "Settings",
        settings_general: "General",
        settings_language: "Language",
        settings_pause: "Pause Duration",
        settings_desc_pause: "How long the breathing pause lasts between segments",
        settings_ai: "AI Assistant",
        settings_desc_ai: "Get smart suggestions for your intentions.",
        settings_smart: "Smart Detection",
        settings_desc_smart: "The app observes your environment and activity to remind you to set intentions.",

        // Sensors
        sensor_location: "Location Awareness",
        sensor_desc_location: "Detect when you arrive/leave saved places (home, work, gym).",
        sensor_motion: "Motion Detection",
        sensor_desc_motion: "Detect still, walking, and active transitions.",
        sensor_noise: "Ambient Noise",
        sensor_desc_noise: "Monitor noise level changes (quiet vs loud).",
        sensor_screen: "Screen Return",
        sensor_desc_screen: "Prompt when returning to app after 5+ min.",
        sensor_inactivity: "Inactivity Nudge",
        sensor_desc_inactivity: "Gentle nudge if no intention set for 90+ minutes.",
        sensor_patterns: "Pattern Learning",
        sensor_desc_patterns: "Suggest activities you usually do at this time.",
        live_status: "Live Status",

        // Saved Places
        saved_places_empty: "No saved places yet",
        btn_save_place: "Save current location as...",
        placeholder_place_name: "Name (e.g. Home, Office)",
        option_auto_suggest: "Auto-suggest activity (optional)",
        btn_confirm_save_place: "Save Place",

        // Reminders
        reminders_title: "Reminders",
        reminders_desc: "Set fixed reminders for routine activities.",
        no_reminders: "No reminders set yet",
        btn_add_reminder: "Add Reminder",
        perm_granted: "Notifications enabled",
        perm_denied: "Notifications blocked",
        perm_default: "Enable Notifications",

        // New Features
        settings_theme: "Appearance",
        settings_battery: "Battery Optimization",
        battery_saver: "Battery Saver",
        btn_import: "Import Data",
        theme_light: "Light",
        theme_dark: "Dark",
        theme_auto: "Auto",
        nav_analytics: "Analytics",
        analytics_title: "Analytics",
        import_desc: "Import your backup JSON file.",

        // Modal
        modal_new_reminder: "New Reminder",
        label_activity: "Activity",
        label_time: "Time",
        label_repeat: "Repeat",
        label_alerts: "Alerts",
        rep_every_day: "Every day",
        rep_weekdays: "Weekdays",
        rep_weekends: "Weekends",
        rep_once: "Once",
        alert_notif: "Notification",
        alert_sound: "Sound",
        alert_vib: "Vibration",
        modal_save: "Save Reminder",

        // Dynamic Strings (Smart Detect & App)
        smart_banner_title: "Activity detected",
        smart_msg_motion: "You started moving! Where are you headed?",
        smart_msg_location: "You've arrived! Set your intention.",
        smart_msg_noise: "Environment changed. New setting?",
        smart_msg_screen: "Welcome back! New segment?",
        smart_msg_inactivity: "It's been a while. Time to align?",
        smart_msg_pattern: "You usually do this now:",

        // Activities
        "Wake Up": "Wake Up",
        "Breakfast": "Breakfast",
        "Coffee": "Coffee",
        "Commute": "Commute",
        "Driving": "Driving",
        "Walking": "Walking",
        "Public Transport": "Public Transport",
        "Shower": "Shower",
        "Getting Ready": "Getting Ready",
        "Desk Work": "Desk Work",
        "Meeting": "Meeting",
        "Deep Focus": "Deep Focus",
        "Emails": "Emails / Admin",
        "Email/Admin": "Emails / Admin",
        "Phone Call": "Phone / Video Call",
        "Planning": "Planning",
        "Focus Block": "Focus Block",
        "Exercise": "Exercise",
        "Stretching": "Stretching",
        "Yoga": "Yoga",
        "Meditation": "Meditation",
        "Reading": "Reading",
        "Networking": "Networking",
        "Family Time": "Family Time",
        "Date Night": "Date Night",
        "Date": "Date / Romance",
        "Friends": "Friends",
        "Social Event": "Social Gathering",
        "Conversation": "Important Conversation",
        "Dinner": "Dinner",
        "Relaxing": "Relaxing",
        "Journaling": "Journaling",
        "Sleep": "Sleep",
        "Break": "Break",
        "Cooking": "Cooking",
        "Eating": "Eating a Meal",
        "Cleaning": "Cleaning",
        "Learning": "Learning",
        "Errands": "Errands",
        "Health Visit": "Health Appointment"
    },
    sk: {
        // General
        app_title: "Segment Intending",
        next: "Ďalej",
        skip: "Preskočiť",
        not_now: "Teraz nie",
        get_started: "Začať",
        cancel: "Zrušiť",
        save: "Uložiť",
        delete: "Vymazať",
        edit: "Upraviť",
        close: "Zavrieť",

        // Onboarding
        ob_title_1: "Vitajte v Segment Intending",
        ob_desc_1: "Ovládnite svoj deň, jeden segment za druhým. Prestaňte žiť automaticky a začnite žiť vedome.",
        ob_title_2: "Pauza a Reset",
        ob_desc_2: "Pred začatím novej aktivity sa zastavte. Uvoľnite sa z predchádzajúceho segmentu.",
        ob_title_3: "Žite so zámerom",
        ob_desc_3: "Stanovte si jasný zámer pre to, čo chcete zažiť. Sledujte, ako sa váš život mení.",

        // Dashboard
        streak_title: "Aktuálna séria",
        streak_unit: "Segmentov",
        greeting_morning: "Dobré ráno",
        greeting_afternoon: "Dobrý deň",
        greeting_evening: "Dobrý večer",
        question_context: "Čo idete robiť?",
        question_context_hint: "Vyberte si ďalšiu aktivitu",
        question_intention: "Aký je váš zámer?",
        placeholder_intention: "Mojím zámerom je...",
        btn_start_segment: "Začať segment",
        btn_pause_breath: "Pauza a Dýchanie",

        // Categories
        cat_morning: "Ráno",
        cat_work: "Práca",
        cat_movement: "Telo a Zdravie",
        cat_selfcare: "Relax",
        cat_social: "Ľudia",
        cat_evening: "Večer",
        cat_travel: "Cestovanie",
        cat_custom: "Vlastné",

        // Active Screen
        current_segment: "Aktuálny segment",
        intention_label: "Zámer:",
        feeling_label: "Pocit:",
        btn_complete: "Dokončiť segment",

        // History
        history_title: "História",
        history_empty: "Zatiaľ žiadne segmenty. Začnite prvý!",
        btn_export: "Exportovať CSV",
        btn_clear: "Vymazať dáta",
        confirm_clear: "Naozaj chcete vymazať všetky dáta? Táto akcia je nevratná.",

        // Settings
        settings_title: "Nastavenia",
        settings_general: "Všeobecné",
        settings_language: "Jazyk",
        settings_pause: "Trvanie pauzy",
        settings_desc_pause: "Ako dlho trvá dychová pauza medzi segmentmi",
        settings_ai: "AI Asistent",
        settings_desc_ai: "Inteligentné návrhy pre vaše zámery.",
        settings_smart: "Inteligentná detekcia",
        settings_desc_smart: "Aplikácia sleduje vaše prostredie a aktivitu pre pripomenutie zámerov.",

        // Sensors
        sensor_location: "Poloha",
        sensor_desc_location: "Zistí príchod/odchod z uložených miest (domov, práca).",
        sensor_motion: "Detekcia pohybu",
        sensor_desc_motion: "Rozpozná kľud, chôdzu a aktívny pohyb.",
        sensor_noise: "Okolitý hluk",
        sensor_desc_noise: "Sleduje zmeny úrovne hluku (ticho vs. hluk).",
        sensor_screen: "Návrat k obrazovke",
        sensor_desc_screen: "Výzva pri návrate do aplikácie po 5+ min.",
        sensor_inactivity: "Pripomienka nečinnosti",
        sensor_desc_inactivity: "Jemné upozornenie, ak nie je zadaný zámer 90+ minút.",
        sensor_patterns: "Učenie vzorcov",
        sensor_desc_patterns: "Navrhne aktivity, ktoré v tomto čase zvyčajne robíte.",
        live_status: "Stav senzorov",

        // New Features
        settings_theme: "Vzhľad",
        settings_battery: "Optimalizácia batérie",
        battery_saver: "Šetrič batérie",
        btn_import: "Importovať dáta",
        theme_light: "Svetlý",
        theme_dark: "Tmavý",
        theme_auto: "Automaticky",
        nav_analytics: "Analytika",
        analytics_title: "Analytika",
        import_desc: "Importovať zálohu zo súboru JSON.",

        // Saved Places
        saved_places_empty: "Žiadne uložené miesta",
        btn_save_place: "Uložiť aktuálnu polohu ako...",
        placeholder_place_name: "Názov (napr. Domov, Práca)",
        option_auto_suggest: "Automaticky navrhnúť aktivitu (nepovinné)",
        btn_confirm_save_place: "Uložiť miesto",

        // Reminders
        reminders_title: "Pripomienky",
        reminders_desc: "Nastavte si pevné časy pre rutinné aktivity.",
        no_reminders: "Žiadne pripomienky",
        btn_add_reminder: "Pridať pripomienku",
        perm_granted: "Oznámenia povolené",
        perm_denied: "Oznámenia blokované",
        perm_default: "Povoliť oznámenia",

        // Modal
        modal_new_reminder: "Nová pripomienka",
        label_activity: "Aktivita",
        label_time: "Čas",
        label_repeat: "Opakovanie",
        label_alerts: "Upozornenia",
        rep_every_day: "Každý deň",
        rep_weekdays: "Pracovné dni",
        rep_weekends: "Víkend",
        rep_once: "Raz",
        alert_notif: "Oznámenie",
        alert_sound: "Zvuk",
        alert_vib: "Vibrácia",
        modal_save: "Uložiť pripomienku",

        // Dynamic Strings
        smart_banner_title: "Detekovaná aktivita",
        smart_msg_motion: "Začali ste sa hýbať! Kam máte namierené?",
        smart_msg_location: "Ste na mieste! Nastavte si zámer.",
        smart_msg_noise: "Zmena prostredia. Nové nastavenie?",
        smart_msg_screen: "Vitajte späť! Nový segment?",
        smart_msg_inactivity: "Ubehlo veľa času. Čo tak sa zladiť?",
        smart_msg_pattern: "Teraz zvyknete robiť:",

        // Activities
        "Wake Up": "Prebúdzanie",
        "Breakfast": "Raňajky",
        "Coffee": "Káva",
        "Commute": "Dochádzanie",
        "Driving": "Šoférovanie",
        "Walking": "Chôdza",
        "Public Transport": "Hromadná doprava",
        "Shower": "Sprcha",
        "Getting Ready": "Príprava",
        "Desk Work": "Práca pri stole",
        "Meeting": "Stretnutie",
        "Deep Focus": "Sústredená práca",
        "Emails": "Emaily / Admin",
        "Email/Admin": "Emaily / Admin",
        "Phone Call": "Telefonát / Video",
        "Planning": "Plánovanie",
        "Focus Block": "Sústredená práca",
        "Exercise": "Cvičenie",
        "Stretching": "Strečing",
        "Yoga": "Joga",
        "Meditation": "Meditácia",
        "Reading": "Čítanie",
        "Networking": "Networking",
        "Family Time": "Rodina",
        "Date Night": "Rande",
        "Date": "Rande",
        "Friends": "Priatelia",
        "Social Event": "Spoločenská udalosť",
        "Conversation": "Rozhovor",
        "Dinner": "Večera",
        "Relaxing": "Oddych",
        "Journaling": "Denník",
        "Sleep": "Spánok",
        "Break": "Prestávka",
        "Cooking": "Varenie",
        "Eating": "Jedlo",
        "Cleaning": "Upratovanie",
        "Learning": "Učenie",
        "Errands": "Vybavovačky",
        "Health Visit": "Zdravotná návšteva"
    },
    es: {
        // General
        app_title: "Segment Intending",
        next: "Siguiente",
        skip: "Omitir",
        not_now: "Ahora no",
        get_started: "Empezar",
        cancel: "Cancelar",
        save: "Guardar",
        delete: "Eliminar",
        edit: "Editar",
        close: "Cerrar",

        // Onboarding
        ob_title_1: "Bienvenido a Segment Intending",
        ob_desc_1: "Domina tu día, un segmento a la vez. Deja de vivir por defecto y empieza a vivir por diseño.",
        ob_title_2: "Pausa y Reinicio",
        ob_desc_2: "Antes de iniciar una nueva actividad, haz una pausa. Libera el segmento anterior.",
        ob_title_3: "Vive con Intención",
        ob_desc_3: "Establece una intención clara de lo que quieres experimentar. Observa cómo cambia tu vida.",

        // Dashboard
        streak_title: "Racha actual",
        streak_unit: "Segmentos",
        greeting_morning: "Buenos días",
        greeting_afternoon: "Buenas tardes",
        greeting_evening: "Buenas noches",
        question_context: "¿Qué vas a hacer?",
        question_context_hint: "Elige tu próxima actividad",
        question_intention: "¿Cuál es tu intención?",
        placeholder_intention: "Tengo la intención de...",
        btn_start_segment: "Iniciar Segmento",
        btn_pause_breath: "Pausa y Respiración",

        // Categories
        cat_morning: "Mañana",
        cat_work: "Trabajo",
        cat_movement: "Cuerpo y Salud",
        cat_selfcare: "Bienestar",
        cat_social: "Social",
        cat_evening: "Noche",
        cat_travel: "Viaje",
        cat_custom: "Personalizado",

        // Active Screen
        current_segment: "Segmento Actual",
        intention_label: "Intención:",
        feeling_label: "Sentimiento:",
        btn_complete: "Completar Segmento",

        // History
        history_title: "Tu Historial",
        history_empty: "Aún no hay segmentos. ¡Comienza el primero!",
        btn_export: "Exportar CSV",
        btn_clear: "Borrar Datos",
        confirm_clear: "¿Estás seguro de que deseas borrar todos los datos?",

        // Settings
        settings_title: "Ajustes",
        settings_general: "General",
        settings_language: "Idioma",
        settings_pause: "Duración de Pausa",
        settings_desc_pause: "Duración de la respiración entre segmentos",
        settings_ai: "Asistente IA",
        settings_desc_ai: "Sugerencias inteligentes para tus intenciones.",
        settings_smart: "Detección Inteligente",
        settings_desc_smart: "La app observa tu entorno para recordarte establecer intenciones.",

        // New Features
        settings_theme: "Apariencia",
        settings_battery: "Optimización de batería",
        battery_saver: "Ahorro de batería",
        btn_import: "Importar datos",
        theme_light: "Claro",
        theme_dark: "Oscuro",
        theme_auto: "Automático",
        nav_analytics: "Analítica",
        analytics_title: "Analítica",
        import_desc: "Importar copia de seguridad JSON.",

        // Sensors
        sensor_location: "Ubicación",
        sensor_desc_location: "Detectar al llegar/salir de lugares guardados.",
        sensor_motion: "Detección de Movimiento",
        sensor_desc_motion: "Detectar quietud, caminata y actividad.",
        sensor_noise: "Ruido Ambiental",
        sensor_desc_noise: "Monitorear cambios de nivel de ruido.",
        sensor_screen: "Retorno a Pantalla",
        sensor_desc_screen: "Avisar al volver a la app tras 5+ min.",
        sensor_inactivity: "Aviso de Inactividad",
        sensor_desc_inactivity: "Aviso suave si no hay intención en 90+ min.",
        sensor_patterns: "Aprendizaje de Patrones",
        sensor_desc_patterns: "Sugerir actividades habituales a esta hora.",
        live_status: "Estado en vivo",

        // Saved Places
        saved_places_empty: "No hay lugares guardados",
        btn_save_place: "Guardar ubicación actual como...",
        placeholder_place_name: "Nombre (ej. Casa, Oficina)",
        option_auto_suggest: "Sugerir actividad automáticamente",
        btn_confirm_save_place: "Guardar Lugar",

        // Reminders
        reminders_title: "Recordatorios",
        reminders_desc: "Fija recordatorios para actividades rutinarias.",
        no_reminders: "Sin recordatorios",
        btn_add_reminder: "Añadir Recordatorio",
        perm_granted: "Notificaciones activas",
        perm_denied: "Notificaciones bloqueadas",
        perm_default: "Activar Notificaciones",

        // Modal
        modal_new_reminder: "Nuevo Recordatorio",
        label_activity: "Actividad",
        label_time: "Hora",
        label_repeat: "Repetir",
        label_alerts: "Alertas",
        rep_every_day: "Todos los días",
        rep_weekdays: "Días laborables",
        rep_weekends: "Fines de semana",
        rep_once: "Una vez",
        alert_notif: "Notificación",
        alert_sound: "Sonido",
        alert_vib: "Vibración",
        modal_save: "Guardar Recordatorio",

        // Dynamic Strings
        smart_banner_title: "Actividad detectada",
        smart_msg_motion: "¡Te estás moviendo! ¿A dónde vas?",
        smart_msg_location: "¡Has llegado! Establece tu intención.",
        smart_msg_noise: "Cambio de ambiente. ¿Nueva configuración?",
        smart_msg_screen: "¡Bienvenido! ¿Nuevo segmento?",
        smart_msg_inactivity: "Ha pasado un tiempo. ¿Alineamos?",
        smart_msg_pattern: "Sueles hacer esto ahora:",

        // Activities
        "Wake Up": "Despertar",
        "Breakfast": "Desayuno",
        "Coffee": "Café",
        "Commute": "Transporte",
        "Driving": "Conducir",
        "Walking": "Caminar",
        "Public Transport": "Transporte Público",
        "Shower": "Ducha",
        "Getting Ready": "Alistarse",
        "Desk Work": "Trabajo de escritorio",
        "Meeting": "Reunión",
        "Deep Focus": "Trabajo Profundo",
        "Emails": "Emails / Admin",
        "Email/Admin": "Emails / Admin",
        "Phone Call": "Llamada / Video",
        "Planning": "Planificación",
        "Focus Block": "Bloque de Foco",
        "Exercise": "Ejercicio",
        "Stretching": "Estiramiento",
        "Yoga": "Yoga",
        "Meditation": "Meditación",
        "Reading": "Lectura",
        "Networking": "Networking",
        "Family Time": "Tiempo en Familia",
        "Date Night": "Cita",
        "Date": "Cita",
        "Friends": "Amigos",
        "Social Event": "Evento Social",
        "Conversation": "Conversación Importante",
        "Dinner": "Cena",
        "Relaxing": "Relax",
        "Journaling": "Diario",
        "Sleep": "Dormir",
        "Break": "Descanso",
        "Cooking": "Cocinar",
        "Eating": "Comer",
        "Cleaning": "Limpieza",
        "Learning": "Aprendizaje",
        "Errands": "Recados",
        "Health Visit": "Cita Médica"
    }
};

// Current language state
let currentLang = 'en';

// Function to set language
function setLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        applyTranslations();
        document.documentElement.lang = lang;
        localStorage.setItem('segmentIntendLanguage', lang);
        window.dispatchEvent(new CustomEvent('language-changed', { detail: lang }));
    }
}

// Initialize language from localStorage
const storedLang = localStorage.getItem('segmentIntendLanguage');
if (storedLang && translations[storedLang]) {
    setLanguage(storedLang);
}

// Function to translate a key
function t(key) {
    return translations[currentLang][key] || translations['en'][key] || key;
}

// Apply translations to the DOM
function applyTranslations() {
    // 1. Elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            if (el.children.length === 0) {
                el.textContent = t(key);
            } else {
                // Special simple replacement for nodes with mixed content if structure is known
                const textNode = Array.from(el.childNodes).find(node => node.nodeType === 3 && node.textContent.trim().length > 0);
                if (textNode) {
                    textNode.textContent = t(key);
                } else {
                    // Fallback: replace content entirely if key exists
                    // el.textContent = t(key);
                }
            }
        }
    });

    // 2. Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) {
            el.placeholder = t(key);
        }
    });

    // 3. Activity Buttons (Special handling for Emoji + Text)
    document.querySelectorAll('.activity-btn').forEach(btn => {
        const activityKey = btn.dataset.activity;
        if (activityKey) {
            // Assume format "Emoji Text"
            // We want to replace Text part with t(activityKey)
            const translated = t(activityKey);
            // Find the emoji (usually first non-whitespace part or just preserve it)
            // If we can't easily parse, we just assume the translation file contains the text only, and we prepend the existing emoji if we can find it.
            // Or simpler: Just replace the text node.
            const textNode = Array.from(btn.childNodes).find(node => node.nodeType === 3 && node.textContent.trim().length > 1); // >1 to skip lone emoji if separate?
            // Actually activity-btn usually has emoji + text in one node if it's "☀️ Wake Up".
            // Let's try to just split by space.
            const originalText = btn.textContent.trim();
            const parts = originalText.split(' ');
            const emoji = parts[0];
            if (/\p{Extended_Pictographic}/u.test(emoji) || emoji.length < 3) {
                // Likely an emoji
                btn.textContent = emoji + ' ' + translated;
            } else {
                // Maybe no emoji found, just use translation
                btn.textContent = translated;
            }
        }
    });

    // 3b. Category Headers
    document.querySelectorAll('.category-header span').forEach(span => {
        // "🌅 Morning"
        const text = span.textContent.trim();
        const parts = text.split(' ');
        const emoji = parts[0];
        // Check if we have a key for the text part. 
        // The categories don't have IDs on the span.
        // But we have keys cat_morning, cat_work etc.
        // We can map by parent ID?
        const parent = span.parentElement;
        const toggle = parent.getAttribute('data-toggle'); // cat-morning
        if (toggle) {
            const key = toggle.replace('-', '_'); // cat_morning
            const translated = t(key);
            if (/\p{Extended_Pictographic}/u.test(emoji)) {
                span.textContent = emoji + ' ' + translated;
            } else {
                span.textContent = translated;
            }
        }
    });

    // Re-render components
    if (typeof renderReminderList === 'function') renderReminderList();
    if (typeof updateDashboard === 'function') updateDashboard();
    if (typeof updateDetectionStatus === 'function') updateDetectionStatus();
}
