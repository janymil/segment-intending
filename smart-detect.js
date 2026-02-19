/* ============================
   SMART DETECTION ENGINE
   Automatic activity-change detection for Segment Intending
   ============================ */

const SmartDetect = (function () {
    'use strict';

    // ===== CONFIG =====
    const CONFIG = {
        // Motion
        motionSampleInterval: 200,           // ms between samples
        motionWindowSize: 15,                // samples to average
        motionStillThreshold: 0.8,           // below = still
        motionWalkThreshold: 3.5,            // above = walking, below = still
        motionActiveThreshold: 8.0,          // above = vigorous activity
        motionStateChangeDelay: 3000,        // ms of consistent state before triggering

        // Location
        locationUpdateInterval: 30000,       // ms between checks
        geofenceRadius: 150,                 // meters to consider "at" a place
        significantMoveDistance: 500,         // meters to trigger "you've moved"

        // Screen return
        screenAwayThreshold: 5 * 60 * 1000,  // 5 min away = prompt on return

        // Inactivity
        inactivityThreshold: 90 * 60 * 1000, // 90 min without a segment

        // Noise
        noiseSampleInterval: 500,            // ms between noise readings
        noiseWindowSize: 10,                 // samples to average
        noiseQuietThreshold: 15,             // below = quiet environment
        noiseLoudThreshold: 45,              // above = noisy environment
        noiseChangeDelay: 8000,              // ms of consistent state

        // Patterns
        patternMatchWindow: 30,              // minutes window for pattern matching
    };

    // ===== STATE =====
    let state = {
        enabled: {
            motion: false,
            location: false,
            screen: false,
            inactivity: false,
            noise: false,
            patterns: false,
        },
        // Motion
        motionState: 'unknown',              // unknown | still | walking | active
        motionSamples: [],
        motionStateStart: 0,
        motionPending: null,
        motionHandler: null,

        // Location
        locationWatchId: null,
        lastPosition: null,
        savedPlaces: [],                     // [{name, lat, lng, activity}]
        currentPlace: null,
        locationInterval: null,

        // Screen
        screenHiddenAt: null,
        visibilityHandler: null,

        // Inactivity
        inactivityTimer: null,
        lastSegmentTime: Date.now(),

        // Noise
        noiseState: 'unknown',               // unknown | quiet | moderate | loud
        noiseStream: null,
        noiseContext: null,
        noiseAnalyser: null,
        noiseInterval: null,
        noiseSamples: [],
        noiseStateStart: 0,
        noisePending: null,

        // Patterns
        patternInterval: null,
    };

    let onDetection = null;  // callback: (type, data) => void

    // ===== PUBLIC API =====
    function init(callback) {
        onDetection = callback;
        loadSavedPlaces();
    }

    function setEnabled(module, enabled) {
        state.enabled[module] = enabled;
        if (enabled) {
            startModule(module);
        } else {
            stopModule(module);
        }
    }

    function isEnabled(module) {
        return state.enabled[module];
    }

    function startModule(module) {
        switch (module) {
            case 'motion': startMotion(); break;
            case 'location': startLocation(); break;
            case 'screen': startScreenDetection(); break;
            case 'inactivity': startInactivity(); break;
            case 'noise': startNoise(); break;
            case 'patterns': startPatterns(); break;
        }
    }

    function stopModule(module) {
        switch (module) {
            case 'motion': stopMotion(); break;
            case 'location': stopLocation(); break;
            case 'screen': stopScreenDetection(); break;
            case 'inactivity': stopInactivity(); break;
            case 'noise': stopNoise(); break;
            case 'patterns': stopPatterns(); break;
        }
    }

    function notifySegmentSet() {
        state.lastSegmentTime = Date.now();
        resetInactivity();
    }

    // ===== MODULE 1: MOTION DETECTION =====
    function startMotion() {
        if (state.motionHandler) return;

        // Check for API availability
        if (!('DeviceMotionEvent' in window)) {
            emit('motion_unavailable', { reason: 'DeviceMotion API not supported' });
            return;
        }

        // iOS 13+ requires permission
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission().then(response => {
                if (response === 'granted') {
                    attachMotionListener();
                } else {
                    emit('motion_unavailable', { reason: 'Permission denied' });
                }
            }).catch(() => {
                emit('motion_unavailable', { reason: 'Permission request failed' });
            });
        } else {
            attachMotionListener();
        }
    }

    function attachMotionListener() {
        state.motionState = 'unknown';
        state.motionSamples = [];
        state.motionStateStart = Date.now();

        let lastSample = 0;

        state.motionHandler = (event) => {
            const now = Date.now();
            if (now - lastSample < CONFIG.motionSampleInterval) return;
            lastSample = now;

            const acc = event.accelerationIncludingGravity || event.acceleration;
            if (!acc || acc.x === null) return;

            // Calculate magnitude (remove gravity ~9.8)
            const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
            // Remove gravity component (approximately)
            const netAccel = Math.abs(magnitude - 9.81);

            state.motionSamples.push(netAccel);
            if (state.motionSamples.length > CONFIG.motionWindowSize) {
                state.motionSamples.shift();
            }

            if (state.motionSamples.length >= CONFIG.motionWindowSize) {
                classifyMotion();
            }
        };

        window.addEventListener('devicemotion', state.motionHandler);
        emit('motion_started', {});
    }

    function classifyMotion() {
        const avg = state.motionSamples.reduce((a, b) => a + b, 0) / state.motionSamples.length;
        let newState;

        if (avg < CONFIG.motionStillThreshold) {
            newState = 'still';
        } else if (avg < CONFIG.motionWalkThreshold) {
            newState = 'walking';
        } else {
            newState = 'active';
        }

        if (newState !== state.motionState) {
            if (state.motionPending !== newState) {
                state.motionPending = newState;
                state.motionStateStart = Date.now();
            } else if (Date.now() - state.motionStateStart > CONFIG.motionStateChangeDelay) {
                const oldState = state.motionState;
                state.motionState = newState;
                state.motionPending = null;

                if (oldState !== 'unknown') {
                    const suggestions = getMotionSuggestion(oldState, newState);
                    emit('motion_change', {
                        from: oldState,
                        to: newState,
                        message: suggestions.message,
                        suggestedActivity: suggestions.activity,
                        confidence: avg
                    });
                }
            }
        } else {
            state.motionPending = null;
        }
    }

    function getMotionSuggestion(from, to) {
        const transitions = {
            'still_walking': {
                message: "You started moving! Where are you headed?",
                activity: "Walking"
            },
            'still_active': {
                message: "Activity detected! Are you exercising?",
                activity: "Exercise"
            },
            'walking_still': {
                message: "You've stopped — arrived somewhere new?",
                activity: null
            },
            'walking_active': {
                message: "Picking up the pace! Setting an exercise intention?",
                activity: "Exercise"
            },
            'active_still': {
                message: "Workout done? Time for a recovery intention.",
                activity: "Break"
            },
            'active_walking': {
                message: "Slowing down — cool-down walk?",
                activity: "Walking"
            },
        };
        return transitions[`${from}_${to}`] || {
            message: `Activity changed from ${from} to ${to}`,
            activity: null
        };
    }

    function stopMotion() {
        if (state.motionHandler) {
            window.removeEventListener('devicemotion', state.motionHandler);
            state.motionHandler = null;
        }
        state.motionState = 'unknown';
        state.motionSamples = [];
    }

    function getMotionState() {
        return state.motionState;
    }

    // ===== MODULE 2: LOCATION AWARENESS =====
    function startLocation() {
        if (!('geolocation' in navigator)) {
            emit('location_unavailable', { reason: 'Geolocation not supported' });
            return;
        }

        // Get initial position
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                state.lastPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                checkPlace(state.lastPosition);
            },
            (err) => {
                emit('location_unavailable', { reason: err.message });
            },
            { enableHighAccuracy: true }
        );

        // Watch for changes
        state.locationWatchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };

                if (state.lastPosition) {
                    const dist = haversineDistance(state.lastPosition, newPos);

                    if (dist > CONFIG.significantMoveDistance) {
                        emit('location_moved', {
                            distance: Math.round(dist),
                            message: `You've traveled ${Math.round(dist)}m — new segment?`,
                            from: state.lastPosition,
                            to: newPos
                        });
                    }
                }

                state.lastPosition = newPos;
                checkPlace(newPos);
            },
            () => { },
            { enableHighAccuracy: true, maximumAge: 30000 }
        );

        emit('location_started', {});
    }

    function checkPlace(pos) {
        let foundPlace = null;

        for (const place of state.savedPlaces) {
            const dist = haversineDistance(pos, place);
            if (dist < CONFIG.geofenceRadius) {
                foundPlace = place;
                break;
            }
        }

        if (foundPlace && (!state.currentPlace || state.currentPlace.name !== foundPlace.name)) {
            const previousPlace = state.currentPlace;
            state.currentPlace = foundPlace;
            emit('location_arrived', {
                place: foundPlace.name,
                activity: foundPlace.activity,
                message: `You've arrived at ${foundPlace.name}! Set your intention.`,
                suggestedActivity: foundPlace.activity,
                previousPlace: previousPlace?.name || null
            });
        } else if (!foundPlace && state.currentPlace) {
            const leftPlace = state.currentPlace;
            state.currentPlace = null;
            emit('location_left', {
                place: leftPlace.name,
                message: `You've left ${leftPlace.name}. What's next?`,
                suggestedActivity: 'Driving'
            });
        }
    }

    function haversineDistance(p1, p2) {
        const R = 6371000; // Earth radius in meters
        const dLat = (p2.lat - p1.lat) * Math.PI / 180;
        const dLng = (p2.lng - p1.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function stopLocation() {
        if (state.locationWatchId !== null) {
            navigator.geolocation.clearWatch(state.locationWatchId);
            state.locationWatchId = null;
        }
        if (state.locationInterval) {
            clearInterval(state.locationInterval);
            state.locationInterval = null;
        }
    }

    // Saved places management
    function addPlace(name, lat, lng, activity) {
        state.savedPlaces.push({ name, lat, lng, activity: activity || '' });
        persistPlaces();
        return state.savedPlaces;
    }

    function removePlace(name) {
        state.savedPlaces = state.savedPlaces.filter(p => p.name !== name);
        persistPlaces();
        return state.savedPlaces;
    }

    function getSavedPlaces() {
        return [...state.savedPlaces];
    }

    function saveCurrentAsPlace(name, activity) {
        if (state.lastPosition) {
            return addPlace(name, state.lastPosition.lat, state.lastPosition.lng, activity);
        }
        return null;
    }

    function persistPlaces() {
        try {
            localStorage.setItem('si_savedPlaces', JSON.stringify(state.savedPlaces));
        } catch (e) { }
    }

    function loadSavedPlaces() {
        try {
            const data = localStorage.getItem('si_savedPlaces');
            if (data) state.savedPlaces = JSON.parse(data);
        } catch (e) { }
    }

    function getCurrentPosition() {
        return state.lastPosition;
    }

    // ===== MODULE 3: SCREEN RETURN DETECTION =====
    function startScreenDetection() {
        if (state.visibilityHandler) return;

        state.visibilityHandler = () => {
            if (document.hidden) {
                state.screenHiddenAt = Date.now();
            } else {
                if (state.screenHiddenAt) {
                    const awayDuration = Date.now() - state.screenHiddenAt;
                    if (awayDuration > CONFIG.screenAwayThreshold) {
                        const mins = Math.round(awayDuration / 60000);
                        emit('screen_return', {
                            awayMinutes: mins,
                            message: `Welcome back! You were away for ${mins} min. New segment?`,
                            suggestedActivity: guessReturnActivity(mins)
                        });
                    }
                    state.screenHiddenAt = null;
                }
            }
        };

        document.addEventListener('visibilitychange', state.visibilityHandler);
        emit('screen_started', {});
    }

    function guessReturnActivity(mins) {
        if (mins > 60) return 'Break';          // Long break
        if (mins > 30) return null;             // Could be anything
        if (mins > 10) return 'Break';          // Short break
        return null;
    }

    function stopScreenDetection() {
        if (state.visibilityHandler) {
            document.removeEventListener('visibilitychange', state.visibilityHandler);
            state.visibilityHandler = null;
        }
    }

    // ===== MODULE 4: INACTIVITY NUDGE =====
    function startInactivity() {
        resetInactivity();
    }

    function resetInactivity() {
        if (state.inactivityTimer) clearTimeout(state.inactivityTimer);

        if (!state.enabled.inactivity) return;

        state.lastSegmentTime = Date.now();
        state.inactivityTimer = setTimeout(() => {
            emit('inactivity', {
                minutes: Math.round(CONFIG.inactivityThreshold / 60000),
                message: `It's been ${Math.round(CONFIG.inactivityThreshold / 60000)} minutes since your last intention. What are you doing now?`,
                suggestedActivity: null
            });

            // Re-trigger every 30 minutes after
            state.inactivityTimer = setInterval(() => {
                const elapsed = Date.now() - state.lastSegmentTime;
                const mins = Math.round(elapsed / 60000);
                emit('inactivity', {
                    minutes: mins,
                    message: `${mins} minutes without an intention. Pause and refocus?`,
                    suggestedActivity: null
                });
            }, 30 * 60 * 1000);

        }, CONFIG.inactivityThreshold);
    }

    function stopInactivity() {
        if (state.inactivityTimer) {
            clearTimeout(state.inactivityTimer);
            clearInterval(state.inactivityTimer);
            state.inactivityTimer = null;
        }
    }

    // ===== MODULE 5: NOISE LEVEL MONITORING =====
    async function startNoise() {
        if (state.noiseInterval) return;

        try {
            state.noiseStream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: false }
            });

            state.noiseContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = state.noiseContext.createMediaStreamSource(state.noiseStream);
            state.noiseAnalyser = state.noiseContext.createAnalyser();
            state.noiseAnalyser.fftSize = 256;
            state.noiseAnalyser.smoothingTimeConstant = 0.7;
            source.connect(state.noiseAnalyser);

            state.noiseState = 'unknown';
            state.noiseSamples = [];

            state.noiseInterval = setInterval(() => {
                const bufferLength = state.noiseAnalyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                state.noiseAnalyser.getByteFrequencyData(dataArray);

                // Calculate RMS volume
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) sum += dataArray[i] ** 2;
                const rms = Math.sqrt(sum / bufferLength);

                state.noiseSamples.push(rms);
                if (state.noiseSamples.length > CONFIG.noiseWindowSize) state.noiseSamples.shift();

                if (state.noiseSamples.length >= CONFIG.noiseWindowSize) {
                    classifyNoise();
                }
            }, CONFIG.noiseSampleInterval);

            emit('noise_started', {});
        } catch (err) {
            emit('noise_unavailable', { reason: err.message });
        }
    }

    function classifyNoise() {
        const avg = state.noiseSamples.reduce((a, b) => a + b, 0) / state.noiseSamples.length;
        let newState;

        if (avg < CONFIG.noiseQuietThreshold) {
            newState = 'quiet';
        } else if (avg < CONFIG.noiseLoudThreshold) {
            newState = 'moderate';
        } else {
            newState = 'loud';
        }

        if (newState !== state.noiseState && state.noiseState !== 'unknown') {
            if (state.noisePending !== newState) {
                state.noisePending = newState;
                state.noiseStateStart = Date.now();
            } else if (Date.now() - state.noiseStateStart > CONFIG.noiseChangeDelay) {
                const oldState = state.noiseState;
                state.noiseState = newState;
                state.noisePending = null;

                const suggestion = getNoiseSuggestion(oldState, newState);
                emit('noise_change', {
                    from: oldState,
                    to: newState,
                    level: Math.round(avg),
                    message: suggestion.message,
                    suggestedActivity: suggestion.activity
                });
            }
        } else if (newState === state.noiseState) {
            state.noisePending = null;
        }

        if (state.noiseState === 'unknown') state.noiseState = newState;
    }

    function getNoiseSuggestion(from, to) {
        const transitions = {
            'quiet_moderate': { message: "Your environment got noisier. New setting?", activity: null },
            'quiet_loud': { message: "It's getting loud! Are you in a social setting?", activity: "Social Event" },
            'moderate_quiet': { message: "It's quiet now. Time for focused work?", activity: "Deep Focus" },
            'moderate_loud': { message: "Noise level rising! Meeting or social time?", activity: "Meeting" },
            'loud_quiet': { message: "It's calm now. Perfect for reflection.", activity: "Break" },
            'loud_moderate': { message: "Things are calming down. What's next?", activity: null },
        };
        return transitions[`${from}_${to}`] || { message: `Environment changed from ${from} to ${to}`, activity: null };
    }

    function stopNoise() {
        if (state.noiseInterval) {
            clearInterval(state.noiseInterval);
            state.noiseInterval = null;
        }
        if (state.noiseStream) {
            state.noiseStream.getTracks().forEach(t => t.stop());
            state.noiseStream = null;
        }
        if (state.noiseContext) {
            state.noiseContext.close().catch(() => { });
            state.noiseContext = null;
        }
        state.noiseAnalyser = null;
        state.noiseState = 'unknown';
        state.noiseSamples = [];
    }

    function getNoiseLevel() {
        if (state.noiseSamples.length === 0) return 0;
        return Math.round(state.noiseSamples.reduce((a, b) => a + b, 0) / state.noiseSamples.length);
    }

    // ===== MODULE 6: TIME PATTERN LEARNING =====
    function startPatterns() {
        // Check every 15 minutes
        state.patternInterval = setInterval(() => {
            checkTimePatterns();
        }, 15 * 60 * 1000);

        // Also check on start after a delay
        setTimeout(checkTimePatterns, 10000);
        emit('patterns_started', {});
    }

    function checkTimePatterns() {
        const segments = getAllSegments();
        if (!segments || Object.keys(segments).length < 3) return; // Need 3+ days of data

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const dayOfWeek = now.getDay();

        // Build frequency map: what activities happen around this time?
        const activityCounts = {};
        let totalDays = 0;

        Object.entries(segments).forEach(([dateKey, daySegments]) => {
            totalDays++;
            daySegments.forEach(seg => {
                const segTime = new Date(seg.timestamp);
                const segMinutes = segTime.getHours() * 60 + segTime.getMinutes();

                // Within ±30 minute window of current time
                if (Math.abs(segMinutes - currentMinutes) <= CONFIG.patternMatchWindow) {
                    const activity = seg.context;
                    activityCounts[activity] = (activityCounts[activity] || 0) + 1;
                }
            });
        });

        // Find the most common activity at this time
        const sorted = Object.entries(activityCounts).sort((a, b) => b[1] - a[1]);
        if (sorted.length === 0) return;

        const [topActivity, count] = sorted[0];
        const frequency = count / totalDays;

        // Only suggest if activity happens >30% of days at this time
        if (frequency > 0.3 && count >= 3) {
            const hour = now.getHours();
            const timeLabel = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

            emit('pattern_match', {
                activity: topActivity,
                frequency: Math.round(frequency * 100),
                count: count,
                totalDays: totalDays,
                message: `You often do "${topActivity}" around this time (${Math.round(frequency * 100)}% of days). Set an intention?`,
                suggestedActivity: topActivity,
                timeOfDay: timeLabel
            });
        }
    }

    function getAllSegments() {
        try {
            const saved = localStorage.getItem('segmentIntending');
            if (!saved) return {};
            return JSON.parse(saved).allSegments || {};
        } catch (e) {
            return {};
        }
    }

    function stopPatterns() {
        if (state.patternInterval) {
            clearInterval(state.patternInterval);
            state.patternInterval = null;
        }
    }

    // ===== EMISSION =====
    function emit(type, data) {
        console.log(`[SmartDetect] ${type}:`, data);
        if (onDetection) {
            onDetection(type, data);
        }
    }

    // ===== STATUS =====
    function getStatus() {
        return {
            motion: {
                enabled: state.enabled.motion,
                state: state.motionState,
                available: 'DeviceMotionEvent' in window
            },
            location: {
                enabled: state.enabled.location,
                currentPlace: state.currentPlace?.name || null,
                lastPosition: state.lastPosition,
                savedPlaces: state.savedPlaces.length,
                available: 'geolocation' in navigator
            },
            screen: {
                enabled: state.enabled.screen,
                available: true
            },
            inactivity: {
                enabled: state.enabled.inactivity,
                minutesSinceSegment: Math.round((Date.now() - state.lastSegmentTime) / 60000),
                available: true
            },
            noise: {
                enabled: state.enabled.noise,
                state: state.noiseState,
                level: getNoiseLevel(),
                available: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
            },
            patterns: {
                enabled: state.enabled.patterns,
                available: true
            }
        };
    }

    // ===== PUBLIC INTERFACE =====
    return {
        init,
        setEnabled,
        isEnabled,
        notifySegmentSet,
        getMotionState,
        getNoiseLevel,
        getStatus,
        // Location management
        addPlace,
        removePlace,
        getSavedPlaces,
        saveCurrentAsPlace,
        getCurrentPosition,
        // For external pattern checking
        checkTimePatterns,
        CONFIG,
    };

})();
