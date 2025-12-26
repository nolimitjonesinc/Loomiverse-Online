/**
 * TensionManager - The Rhythm of Story
 *
 * This system manages pacing - the heartbeat of narrative.
 * Great stories breathe. They rise and fall. They know when
 * to push and when to let the reader rest.
 *
 * It handles:
 * - Tension curve (0-100 scale)
 * - Breath moments (necessary pauses)
 * - Peak management (avoiding fatigue)
 * - Genre-specific pacing
 * - Reader tolerance tracking
 * - Escalation patterns
 *
 * Design Philosophy:
 * - Constant tension is exhausting, not exciting
 * - The valleys make the peaks feel higher
 * - Different readers have different tolerances
 * - Genre sets expectations for pacing
 * - A good breath moment isn't boring, it's earned
 * - Anticipation is often better than the event
 */

// Tension levels
export const TENSION_LEVELS = {
  PEACEFUL: 10,      // Calm, safe, restorative
  RELAXED: 25,       // Low stakes, pleasant
  MODERATE: 40,      // Normal engagement
  ELEVATED: 55,      // Something's building
  TENSE: 70,         // Clear stakes, pressure
  HIGH: 85,          // Crisis mode
  PEAK: 95           // Maximum sustainable tension
};

// Pacing modes
export const PACING_MODES = {
  BREATH: 'breath',           // Deliberate lowering
  BUILDING: 'building',       // Gradual increase
  SUSTAINING: 'sustaining',   // Holding level
  RELEASING: 'releasing',     // Controlled decrease
  SPIKING: 'spiking',         // Sudden jump
  CRASHING: 'crashing'        // Rapid drop (catharsis)
};

// Tension event types
export const TENSION_EVENTS = {
  // Increases tension
  THREAT_INTRODUCED: { delta: 15, name: 'threat_introduced' },
  CONFLICT_ESCALATES: { delta: 10, name: 'conflict_escalates' },
  REVELATION: { delta: 12, name: 'revelation' },
  BETRAYAL: { delta: 20, name: 'betrayal' },
  DEADLINE_APPROACHES: { delta: 8, name: 'deadline_approaches' },
  DANGER_IMMINENT: { delta: 15, name: 'danger_imminent' },
  SECRET_DISCOVERED: { delta: 10, name: 'secret_discovered' },
  STAKES_RAISED: { delta: 12, name: 'stakes_raised' },

  // Decreases tension
  THREAT_RESOLVED: { delta: -20, name: 'threat_resolved' },
  MOMENT_OF_PEACE: { delta: -15, name: 'moment_of_peace' },
  COMIC_RELIEF: { delta: -10, name: 'comic_relief' },
  INTIMATE_MOMENT: { delta: -12, name: 'intimate_moment' },
  VICTORY: { delta: -18, name: 'victory' },
  SAFE_HAVEN: { delta: -15, name: 'safe_haven' },
  BONDING_MOMENT: { delta: -8, name: 'bonding_moment' },

  // Neutral/slight
  DIALOGUE: { delta: 2, name: 'dialogue' },
  EXPLORATION: { delta: 3, name: 'exploration' },
  REFLECTION: { delta: -5, name: 'reflection' }
};

// Genre pacing profiles
export const GENRE_PROFILES = {
  thriller: {
    targetTension: 65,
    peakFrequency: 'high',
    breathDuration: 'short',
    sustainedHighOk: true,
    preferredRange: [50, 90]
  },
  romance: {
    targetTension: 45,
    peakFrequency: 'medium',
    breathDuration: 'medium',
    sustainedHighOk: false,
    preferredRange: [25, 70]
  },
  horror: {
    targetTension: 55,
    peakFrequency: 'medium',
    breathDuration: 'long', // Horror needs room to dread
    sustainedHighOk: false, // Constant fear isn't scary
    preferredRange: [30, 85]
  },
  fantasy: {
    targetTension: 50,
    peakFrequency: 'medium',
    breathDuration: 'medium',
    sustainedHighOk: false,
    preferredRange: [20, 80]
  },
  mystery: {
    targetTension: 55,
    peakFrequency: 'low', // Mysteries build slowly
    breathDuration: 'long',
    sustainedHighOk: true, // Sustained curiosity is fine
    preferredRange: [35, 75]
  },
  action: {
    targetTension: 60,
    peakFrequency: 'high',
    breathDuration: 'short',
    sustainedHighOk: true,
    preferredRange: [40, 90]
  },
  literary: {
    targetTension: 40,
    peakFrequency: 'low',
    breathDuration: 'long',
    sustainedHighOk: false,
    preferredRange: [20, 65]
  },
  comedy: {
    targetTension: 35,
    peakFrequency: 'medium',
    breathDuration: 'short',
    sustainedHighOk: false,
    preferredRange: [15, 60]
  }
};

/**
 * Creates a tension manager
 */
export function createTensionManager(genre = 'fantasy') {
  const profile = GENRE_PROFILES[genre] || GENRE_PROFILES.fantasy;

  return {
    // Current state
    currentTension: profile.targetTension,
    currentMode: PACING_MODES.SUSTAINING,

    // Profile
    genre,
    profile,

    // History
    tensionHistory: [],         // Timeline of tension levels
    eventHistory: [],           // What caused changes
    peakHistory: [],            // When peaks occurred

    // Breath tracking
    exchangesSinceBreath: 0,
    lastBreathTime: null,
    breathsThisSession: 0,

    // Peak tracking
    exchangesSincePeak: 0,
    lastPeakTime: null,
    peaksThisSession: 0,

    // Fatigue detection
    sustainedHighCount: 0,      // Exchanges at high tension
    fatiguWarningIssued: false,

    // Reader adaptation
    readerTolerance: 50,        // 0-100, learned over time

    // Goals
    targetTension: profile.targetTension,
    tensionGoal: null           // { level, byExchange, reason }
  };
}

/**
 * Records a tension-affecting event
 */
export function recordTensionEvent(manager, event, context = {}) {
  const eventData = typeof event === 'string'
    ? TENSION_EVENTS[event] || { delta: 0, name: event }
    : event;

  const previousTension = manager.currentTension;

  // Apply tension change
  manager.currentTension = clampTension(
    manager.currentTension + eventData.delta
  );

  // Record in history
  manager.eventHistory.push({
    event: eventData.name,
    delta: eventData.delta,
    from: previousTension,
    to: manager.currentTension,
    timestamp: Date.now(),
    context
  });

  // Keep history bounded
  if (manager.eventHistory.length > 100) {
    manager.eventHistory = manager.eventHistory.slice(-80);
  }

  // Record tension level
  recordTensionLevel(manager, manager.currentTension);

  // Update mode based on change
  updateMode(manager, eventData.delta);

  // Track peaks
  if (manager.currentTension >= TENSION_LEVELS.HIGH) {
    manager.exchangesSincePeak = 0;
    if (manager.currentTension >= TENSION_LEVELS.PEAK) {
      manager.peakHistory.push({
        tension: manager.currentTension,
        timestamp: Date.now()
      });
      manager.peaksThisSession++;
      manager.lastPeakTime = Date.now();
    }
  }

  // Track sustained high
  if (manager.currentTension >= TENSION_LEVELS.TENSE) {
    manager.sustainedHighCount++;
  } else {
    manager.sustainedHighCount = 0;
  }

  // Track exchanges since breath/peak
  manager.exchangesSinceBreath++;
  manager.exchangesSincePeak++;

  return {
    previousTension,
    newTension: manager.currentTension,
    delta: eventData.delta,
    mode: manager.currentMode
  };
}

/**
 * Records tension level in history
 */
function recordTensionLevel(manager, tension) {
  manager.tensionHistory.push({
    tension,
    timestamp: Date.now()
  });

  if (manager.tensionHistory.length > 200) {
    manager.tensionHistory = manager.tensionHistory.slice(-150);
  }
}

/**
 * Updates the pacing mode based on change
 */
function updateMode(manager, delta) {
  if (delta >= 15) {
    manager.currentMode = PACING_MODES.SPIKING;
  } else if (delta >= 5) {
    manager.currentMode = PACING_MODES.BUILDING;
  } else if (delta <= -15) {
    manager.currentMode = PACING_MODES.CRASHING;
  } else if (delta <= -5) {
    manager.currentMode = PACING_MODES.RELEASING;
  } else if (delta < 0) {
    manager.currentMode = PACING_MODES.BREATH;
  } else {
    manager.currentMode = PACING_MODES.SUSTAINING;
  }
}

/**
 * Clamps tension to valid range
 */
function clampTension(tension) {
  return Math.max(0, Math.min(100, tension));
}

/**
 * Checks if a breath moment is needed
 */
export function needsBreathMoment(manager) {
  const profile = manager.profile;

  // Breath frequency based on profile
  const breathThreshold = profile.breathDuration === 'short' ? 12
    : profile.breathDuration === 'medium' ? 8
    : 5;

  // Check conditions
  const conditions = {
    tooLongSinceBreath: manager.exchangesSinceBreath >= breathThreshold,
    sustainedHigh: manager.sustainedHighCount >= 5 && !profile.sustainedHighOk,
    readerFatigued: manager.currentTension >= TENSION_LEVELS.HIGH &&
                    manager.sustainedHighCount >= 3,
    afterPeak: manager.currentTension >= TENSION_LEVELS.PEAK
  };

  const needs = conditions.tooLongSinceBreath ||
                conditions.sustainedHigh ||
                conditions.readerFatigued ||
                conditions.afterPeak;

  return {
    needed: needs,
    urgency: conditions.afterPeak ? 'high'
           : conditions.sustainedHigh ? 'medium'
           : 'low',
    reasons: Object.entries(conditions)
      .filter(([, v]) => v)
      .map(([k]) => k)
  };
}

/**
 * Records that a breath moment occurred
 */
export function recordBreathMoment(manager) {
  manager.exchangesSinceBreath = 0;
  manager.lastBreathTime = Date.now();
  manager.breathsThisSession++;
  manager.sustainedHighCount = 0;

  // Breath moments should lower tension
  recordTensionEvent(manager, {
    delta: -15,
    name: 'breath_moment'
  });
}

/**
 * Gets pacing recommendation
 */
export function getPacingRecommendation(manager) {
  const breath = needsBreathMoment(manager);
  const profile = manager.profile;
  const current = manager.currentTension;
  const target = manager.targetTension;

  // Priority 1: Breath if urgently needed
  if (breath.needed && breath.urgency === 'high') {
    return {
      action: 'breath',
      urgency: 'high',
      reason: 'Tension sustained too long - reader needs rest',
      suggestedEvent: 'MOMENT_OF_PEACE'
    };
  }

  // Priority 2: Stay in range
  const [min, max] = profile.preferredRange;
  if (current > max) {
    return {
      action: 'release',
      urgency: 'medium',
      reason: 'Tension above preferred range',
      suggestedEvent: current >= TENSION_LEVELS.HIGH ? 'THREAT_RESOLVED' : 'COMIC_RELIEF'
    };
  }
  if (current < min) {
    return {
      action: 'build',
      urgency: 'low',
      reason: 'Tension below preferred range',
      suggestedEvent: 'CONFLICT_ESCALATES'
    };
  }

  // Priority 3: Move toward target
  const diff = current - target;
  if (Math.abs(diff) > 15) {
    if (diff > 0) {
      return {
        action: 'release',
        urgency: 'low',
        reason: 'Moving toward target tension',
        suggestedEvent: 'BONDING_MOMENT'
      };
    } else {
      return {
        action: 'build',
        urgency: 'low',
        reason: 'Moving toward target tension',
        suggestedEvent: 'STAKES_RAISED'
      };
    }
  }

  // Priority 4: Breath if moderately needed
  if (breath.needed) {
    return {
      action: 'breath',
      urgency: 'medium',
      reason: breath.reasons.join(', '),
      suggestedEvent: 'INTIMATE_MOMENT'
    };
  }

  // Default: Sustain
  return {
    action: 'sustain',
    urgency: 'none',
    reason: 'Tension in good range',
    suggestedEvent: 'DIALOGUE'
  };
}

/**
 * Gets tension context for AI prompting
 */
export function getTensionContext(manager) {
  const breath = needsBreathMoment(manager);
  const recommendation = getPacingRecommendation(manager);

  return {
    currentTension: manager.currentTension,
    tensionLevel: getTensionLabel(manager.currentTension),
    mode: manager.currentMode,
    needsBreath: breath.needed,
    breathUrgency: breath.urgency,
    recommendation: recommendation.action,
    suggestedEvent: recommendation.suggestedEvent,
    exchangesSinceBreath: manager.exchangesSinceBreath,
    exchangesSincePeak: manager.exchangesSincePeak,
    sustainedHighCount: manager.sustainedHighCount
  };
}

/**
 * Gets human-readable tension label
 */
function getTensionLabel(tension) {
  if (tension >= TENSION_LEVELS.PEAK) return 'peak';
  if (tension >= TENSION_LEVELS.HIGH) return 'high';
  if (tension >= TENSION_LEVELS.TENSE) return 'tense';
  if (tension >= TENSION_LEVELS.ELEVATED) return 'elevated';
  if (tension >= TENSION_LEVELS.MODERATE) return 'moderate';
  if (tension >= TENSION_LEVELS.RELAXED) return 'relaxed';
  return 'peaceful';
}

/**
 * Sets a tension goal
 */
export function setTensionGoal(manager, targetLevel, exchanges, reason) {
  manager.tensionGoal = {
    level: targetLevel,
    byExchange: exchanges,
    reason,
    startedAt: Date.now(),
    startingTension: manager.currentTension
  };
}

/**
 * Gets progress toward tension goal
 */
export function getTensionGoalProgress(manager) {
  if (!manager.tensionGoal) return null;

  const current = manager.currentTension;
  const target = manager.tensionGoal.level;
  const start = manager.tensionGoal.startingTension;

  const totalDistance = Math.abs(target - start);
  const traveled = Math.abs(current - start);
  const progress = totalDistance > 0 ? (traveled / totalDistance) * 100 : 100;

  return {
    goal: manager.tensionGoal,
    progress: Math.min(100, progress),
    currentTension: current,
    targetTension: target,
    onTrack: (target > start && current > start) || (target < start && current < start)
  };
}

/**
 * Clears tension goal
 */
export function clearTensionGoal(manager) {
  manager.tensionGoal = null;
}

/**
 * Calculates average tension over recent history
 */
export function getAverageTension(manager, lastN = 10) {
  const recent = manager.tensionHistory.slice(-lastN);
  if (recent.length === 0) return manager.currentTension;

  return recent.reduce((sum, t) => sum + t.tension, 0) / recent.length;
}

/**
 * Gets tension volatility (how much it's been changing)
 */
export function getTensionVolatility(manager, lastN = 10) {
  const recent = manager.tensionHistory.slice(-lastN);
  if (recent.length < 2) return 0;

  let totalChange = 0;
  for (let i = 1; i < recent.length; i++) {
    totalChange += Math.abs(recent[i].tension - recent[i - 1].tension);
  }

  return totalChange / (recent.length - 1);
}

/**
 * Checks if we're in a tension spike
 */
export function isInSpike(manager) {
  return manager.currentMode === PACING_MODES.SPIKING ||
         (manager.currentTension >= TENSION_LEVELS.HIGH &&
          manager.sustainedHighCount < 2);
}

/**
 * Checks if we're in a lull
 */
export function isInLull(manager) {
  return manager.currentTension <= TENSION_LEVELS.RELAXED &&
         manager.exchangesSinceBreath < 3;
}

/**
 * Adapts to reader's tension tolerance
 */
export function adaptToReaderTolerance(manager, exitedDuringHighTension) {
  if (exitedDuringHighTension) {
    // Reader may have lower tolerance
    manager.readerTolerance = Math.max(20, manager.readerTolerance - 5);
  } else if (manager.currentTension >= TENSION_LEVELS.HIGH &&
             manager.sustainedHighCount >= 5) {
    // Reader seems comfortable with high tension
    manager.readerTolerance = Math.min(80, manager.readerTolerance + 2);
  }

  // Adjust preferred range based on tolerance
  if (manager.readerTolerance < 40) {
    // Lower tolerance - narrow the range
    manager.profile.preferredRange = [
      manager.profile.preferredRange[0],
      Math.min(manager.profile.preferredRange[1], TENSION_LEVELS.TENSE)
    ];
  } else if (manager.readerTolerance > 60) {
    // Higher tolerance - can sustain more
    manager.profile.sustainedHighOk = true;
  }
}

/**
 * Resets for new scene
 */
export function resetForNewScene(manager) {
  // Tension carries somewhat between scenes, but dampened
  manager.currentTension = Math.round(
    manager.currentTension * 0.7 + manager.targetTension * 0.3
  );
  manager.currentMode = PACING_MODES.SUSTAINING;
  manager.exchangesSinceBreath = 0;
  manager.sustainedHighCount = 0;
}

/**
 * Serializes manager for storage
 */
export function serializeTensionManager(manager) {
  return JSON.stringify({
    currentTension: manager.currentTension,
    currentMode: manager.currentMode,
    genre: manager.genre,
    tensionHistory: manager.tensionHistory.slice(-50),
    eventHistory: manager.eventHistory.slice(-30),
    peakHistory: manager.peakHistory,
    breathsThisSession: manager.breathsThisSession,
    peaksThisSession: manager.peaksThisSession,
    readerTolerance: manager.readerTolerance,
    targetTension: manager.targetTension
  });
}

/**
 * Deserializes manager from storage
 */
export function deserializeTensionManager(data) {
  try {
    const parsed = JSON.parse(data);
    const manager = createTensionManager(parsed.genre);

    manager.currentTension = parsed.currentTension;
    manager.currentMode = parsed.currentMode;
    manager.tensionHistory = parsed.tensionHistory || [];
    manager.eventHistory = parsed.eventHistory || [];
    manager.peakHistory = parsed.peakHistory || [];
    manager.breathsThisSession = parsed.breathsThisSession || 0;
    manager.peaksThisSession = parsed.peaksThisSession || 0;
    manager.readerTolerance = parsed.readerTolerance || 50;
    manager.targetTension = parsed.targetTension;

    return manager;
  } catch {
    return null;
  }
}

export default {
  createTensionManager,
  recordTensionEvent,
  needsBreathMoment,
  recordBreathMoment,
  getPacingRecommendation,
  getTensionContext,
  setTensionGoal,
  getTensionGoalProgress,
  clearTensionGoal,
  getAverageTension,
  getTensionVolatility,
  isInSpike,
  isInLull,
  adaptToReaderTolerance,
  resetForNewScene,
  serializeTensionManager,
  deserializeTensionManager,
  TENSION_LEVELS,
  PACING_MODES,
  TENSION_EVENTS,
  GENRE_PROFILES
};
