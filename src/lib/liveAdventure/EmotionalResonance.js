/**
 * EmotionalResonance - Content That Hits Home
 *
 * This system ensures story content resonates emotionally with the reader.
 * It understands:
 * - How to craft moments that land
 * - The difference between felt and forced emotion
 * - When to push and when to hold back
 * - How to build toward catharsis
 *
 * Design Philosophy:
 * - Emotion is earned, not manufactured
 * - Vulnerability requires safety
 * - The reader's experience matters more than the writer's intention
 * - Sometimes the lightest touch hits hardest
 * - Catharsis needs build-up
 */

// Emotional tones available
export const EMOTIONAL_TONES = {
  // Positive spectrum
  JOY: 'joy',
  HOPE: 'hope',
  WONDER: 'wonder',
  LOVE: 'love',
  PRIDE: 'pride',
  RELIEF: 'relief',
  GRATITUDE: 'gratitude',
  BELONGING: 'belonging',
  TRIUMPH: 'triumph',

  // Negative spectrum
  SADNESS: 'sadness',
  FEAR: 'fear',
  ANGER: 'anger',
  GRIEF: 'grief',
  LONELINESS: 'loneliness',
  SHAME: 'shame',
  ANXIETY: 'anxiety',
  DREAD: 'dread',
  LOSS: 'loss',

  // Complex/mixed
  BITTERSWEETNESS: 'bittersweetness',
  NOSTALGIA: 'nostalgia',
  MELANCHOLY: 'melancholy',
  LONGING: 'longing',
  AMBIVALENCE: 'ambivalence',
  CATHARSIS: 'catharsis',

  // Neutral/transitional
  CURIOSITY: 'curiosity',
  ANTICIPATION: 'anticipation',
  TENSION: 'tension',
  STILLNESS: 'stillness'
};

// Resonance techniques
export const TECHNIQUES = {
  CONTRAST: 'contrast',           // Light makes dark darker
  CALLBACK: 'callback',           // Reference to earlier moment
  SENSORY_ANCHOR: 'sensory_anchor', // Ground in physical detail
  SILENCE: 'silence',             // Let the moment breathe
  UNDERSTATEMENT: 'understatement', // Say less, mean more
  PARALLEL: 'parallel',           // Echo earlier structure
  REVELATION: 'revelation',       // The thing finally named
  ACCUMULATION: 'accumulation',   // Build through repetition
  DEFAMILIARIZATION: 'defamiliarization' // Make familiar strange
};

// Emotional intensity levels
export const INTENSITY = {
  WHISPER: 1,     // Barely there, suggestive
  SUBTLE: 2,      // Present but understated
  MODERATE: 3,    // Clearly felt
  STRONG: 4,      // Powerful, moving
  OVERWHELMING: 5 // All-encompassing
};

/**
 * Creates an Emotional Resonance Engine
 */
export function createResonanceEngine(readerProfile = null) {
  return {
    readerProfile,

    // Current emotional journey
    emotionalArc: [],             // Timeline of emotional beats
    currentTone: EMOTIONAL_TONES.CURIOSITY,
    currentIntensity: INTENSITY.MODERATE,

    // Buildup tracking
    buildups: {},                 // { tone: { intensity, duration, payoffReady } }

    // Recent emotional peaks
    recentPeaks: [],              // Last N high-intensity moments

    // Catharsis tracking
    catharsisDebt: 0,             // How much emotional tension needs release
    lastCatharsis: null,          // When tension was last released

    // Callbacks available
    availableCallbacks: [],       // Moments that can be referenced

    // What we're building toward
    targetEmotions: []            // Emotional goals for this arc
  };
}

/**
 * Records an emotional moment and tracks the arc
 */
export function recordEmotionalMoment(engine, moment) {
  const { tone, intensity, technique, context } = moment;

  // Add to arc
  engine.emotionalArc.push({
    tone,
    intensity,
    technique,
    context,
    timestamp: Date.now()
  });

  // Keep bounded
  if (engine.emotionalArc.length > 50) {
    engine.emotionalArc = engine.emotionalArc.slice(-40);
  }

  // Update current state
  engine.currentTone = tone;
  engine.currentIntensity = intensity;

  // Track peaks
  if (intensity >= INTENSITY.STRONG) {
    engine.recentPeaks.push({
      tone,
      intensity,
      timestamp: Date.now()
    });
    if (engine.recentPeaks.length > 10) {
      engine.recentPeaks = engine.recentPeaks.slice(-8);
    }
  }

  // Update catharsis debt
  updateCatharsisDebt(engine, tone, intensity);

  // Check if this can be a callback later
  if (intensity >= INTENSITY.MODERATE) {
    engine.availableCallbacks.push({
      tone,
      context: context?.summary || tone,
      timestamp: Date.now()
    });
    if (engine.availableCallbacks.length > 15) {
      engine.availableCallbacks = engine.availableCallbacks.slice(-10);
    }
  }

  return engine;
}

/**
 * Updates catharsis debt based on emotional moment
 */
function updateCatharsisDebt(engine, tone, intensity) {
  // Negative or tense emotions add to debt
  const debtAdding = [
    EMOTIONAL_TONES.SADNESS, EMOTIONAL_TONES.FEAR, EMOTIONAL_TONES.ANGER,
    EMOTIONAL_TONES.GRIEF, EMOTIONAL_TONES.ANXIETY, EMOTIONAL_TONES.DREAD,
    EMOTIONAL_TONES.TENSION, EMOTIONAL_TONES.LONELINESS, EMOTIONAL_TONES.LOSS
  ];

  // Release emotions reduce debt
  const debtReducing = [
    EMOTIONAL_TONES.JOY, EMOTIONAL_TONES.RELIEF, EMOTIONAL_TONES.TRIUMPH,
    EMOTIONAL_TONES.CATHARSIS, EMOTIONAL_TONES.HOPE, EMOTIONAL_TONES.BELONGING
  ];

  if (debtAdding.includes(tone)) {
    engine.catharsisDebt += intensity * 2;
  } else if (debtReducing.includes(tone)) {
    engine.catharsisDebt = Math.max(0, engine.catharsisDebt - intensity * 3);
    if (tone === EMOTIONAL_TONES.CATHARSIS) {
      engine.lastCatharsis = Date.now();
      engine.catharsisDebt = 0;
    }
  }

  // Cap debt
  engine.catharsisDebt = Math.min(100, engine.catharsisDebt);
}

/**
 * Starts building toward an emotional payoff
 */
export function startBuildup(engine, targetTone, phases = 3) {
  engine.buildups[targetTone] = {
    intensity: 0,
    phases,
    currentPhase: 0,
    startTime: Date.now(),
    payoffReady: false
  };
}

/**
 * Advances a buildup toward payoff
 */
export function advanceBuildup(engine, targetTone) {
  const buildup = engine.buildups[targetTone];
  if (!buildup) return false;

  buildup.currentPhase++;
  buildup.intensity = (buildup.currentPhase / buildup.phases) * INTENSITY.STRONG;

  if (buildup.currentPhase >= buildup.phases) {
    buildup.payoffReady = true;
  }

  return buildup.payoffReady;
}

/**
 * Checks if payoff is ready for a buildup
 */
export function isPayoffReady(engine, targetTone) {
  return engine.buildups[targetTone]?.payoffReady || false;
}

/**
 * Triggers the payoff and clears the buildup
 */
export function triggerPayoff(engine, targetTone) {
  const buildup = engine.buildups[targetTone];
  if (!buildup?.payoffReady) return null;

  const payoff = {
    tone: targetTone,
    intensity: INTENSITY.OVERWHELMING,
    technique: TECHNIQUES.REVELATION,
    builtOver: buildup.phases
  };

  delete engine.buildups[targetTone];

  recordEmotionalMoment(engine, payoff);

  return payoff;
}

/**
 * Gets suggested emotional direction based on current state
 */
export function suggestEmotionalDirection(engine, readerProfile = null) {
  const profile = readerProfile || engine.readerProfile;
  const suggestions = [];

  // Check catharsis debt
  if (engine.catharsisDebt >= 60) {
    suggestions.push({
      direction: 'release',
      reason: 'Emotional tension needs release',
      suggestedTones: [EMOTIONAL_TONES.RELIEF, EMOTIONAL_TONES.CATHARSIS, EMOTIONAL_TONES.HOPE],
      urgency: 'high'
    });
  }

  // Check for emotional monotony
  const recentTones = engine.emotionalArc.slice(-5).map(m => m.tone);
  const uniqueTones = new Set(recentTones);
  if (uniqueTones.size <= 2) {
    suggestions.push({
      direction: 'variety',
      reason: 'Emotional palette needs variety',
      suggestedTones: getContrastingTones(engine.currentTone),
      urgency: 'medium'
    });
  }

  // Check for sustained high intensity
  const recentIntensities = engine.emotionalArc.slice(-5).map(m => m.intensity);
  const avgIntensity = recentIntensities.reduce((a, b) => a + b, 0) / recentIntensities.length;
  if (avgIntensity >= INTENSITY.STRONG) {
    suggestions.push({
      direction: 'breathe',
      reason: 'Need emotional breathing room',
      suggestedTones: [EMOTIONAL_TONES.STILLNESS, EMOTIONAL_TONES.NOSTALGIA],
      suggestedIntensity: INTENSITY.SUBTLE,
      urgency: 'medium'
    });
  }

  // Check ready buildups
  for (const [tone, buildup] of Object.entries(engine.buildups)) {
    if (buildup.payoffReady) {
      suggestions.push({
        direction: 'payoff',
        reason: `Buildup for ${tone} is ready`,
        suggestedTones: [tone],
        urgency: 'high'
      });
    }
  }

  // Reader profile adjustments
  if (profile) {
    const enjoys = profile.contentPreferences;
    // Could add profile-based suggestions here
  }

  return suggestions;
}

/**
 * Gets tones that would contrast with the current one
 */
function getContrastingTones(currentTone) {
  const contrasts = {
    [EMOTIONAL_TONES.JOY]: [EMOTIONAL_TONES.MELANCHOLY, EMOTIONAL_TONES.LONGING],
    [EMOTIONAL_TONES.SADNESS]: [EMOTIONAL_TONES.HOPE, EMOTIONAL_TONES.JOY],
    [EMOTIONAL_TONES.FEAR]: [EMOTIONAL_TONES.TRIUMPH, EMOTIONAL_TONES.RELIEF],
    [EMOTIONAL_TONES.ANGER]: [EMOTIONAL_TONES.STILLNESS, EMOTIONAL_TONES.GRATITUDE],
    [EMOTIONAL_TONES.TENSION]: [EMOTIONAL_TONES.RELIEF, EMOTIONAL_TONES.STILLNESS],
    [EMOTIONAL_TONES.WONDER]: [EMOTIONAL_TONES.DREAD, EMOTIONAL_TONES.LONELINESS],
    [EMOTIONAL_TONES.LOVE]: [EMOTIONAL_TONES.LOSS, EMOTIONAL_TONES.LONGING]
  };

  return contrasts[currentTone] || [EMOTIONAL_TONES.STILLNESS];
}

/**
 * Gets a callback opportunity (reference to earlier moment)
 */
export function getCallbackOpportunity(engine, currentContext) {
  if (engine.availableCallbacks.length === 0) return null;

  // Find a callback that would resonate with current context
  const relevant = engine.availableCallbacks.filter(cb => {
    // Simple relevance check - could be more sophisticated
    const ageMinutes = (Date.now() - cb.timestamp) / 60000;
    return ageMinutes >= 5 && ageMinutes <= 60; // Not too recent, not too old
  });

  if (relevant.length === 0) return null;

  // Return the most emotionally potent one
  return relevant[relevant.length - 1];
}

/**
 * Calculates emotional distance (for contrast)
 */
export function emotionalDistance(tone1, tone2) {
  const positive = [
    EMOTIONAL_TONES.JOY, EMOTIONAL_TONES.HOPE, EMOTIONAL_TONES.LOVE,
    EMOTIONAL_TONES.PRIDE, EMOTIONAL_TONES.TRIUMPH, EMOTIONAL_TONES.RELIEF
  ];
  const negative = [
    EMOTIONAL_TONES.SADNESS, EMOTIONAL_TONES.FEAR, EMOTIONAL_TONES.GRIEF,
    EMOTIONAL_TONES.ANGER, EMOTIONAL_TONES.DREAD, EMOTIONAL_TONES.LOSS
  ];

  const t1Pos = positive.includes(tone1);
  const t2Pos = positive.includes(tone2);
  const t1Neg = negative.includes(tone1);
  const t2Neg = negative.includes(tone2);

  if ((t1Pos && t2Neg) || (t1Neg && t2Pos)) return 1.0; // Maximum contrast
  if ((t1Pos && t2Pos) || (t1Neg && t2Neg)) return 0.3; // Similar valence
  return 0.6; // Mixed/neutral
}

/**
 * Gets recommended technique for the moment
 */
export function recommendTechnique(engine, targetTone, targetIntensity) {
  // High intensity moments benefit from buildup
  if (targetIntensity >= INTENSITY.STRONG) {
    if (engine.currentIntensity <= INTENSITY.SUBTLE) {
      return TECHNIQUES.CONTRAST;
    }
    if (engine.availableCallbacks.length > 0) {
      return TECHNIQUES.CALLBACK;
    }
    return TECHNIQUES.ACCUMULATION;
  }

  // After high intensity, give space
  if (engine.currentIntensity >= INTENSITY.STRONG && targetIntensity <= INTENSITY.MODERATE) {
    return TECHNIQUES.SILENCE;
  }

  // For subtle moments, understatement works
  if (targetIntensity <= INTENSITY.SUBTLE) {
    return TECHNIQUES.UNDERSTATEMENT;
  }

  // Default to sensory grounding
  return TECHNIQUES.SENSORY_ANCHOR;
}

/**
 * Gets the current emotional state summary for AI context
 */
export function getEmotionalContext(engine) {
  return {
    currentTone: engine.currentTone,
    currentIntensity: engine.currentIntensity,
    catharsisDebt: engine.catharsisDebt,
    needsRelease: engine.catharsisDebt >= 50,
    recentPeaks: engine.recentPeaks.slice(-3),
    readyPayoffs: Object.entries(engine.buildups)
      .filter(([, b]) => b.payoffReady)
      .map(([tone]) => tone),
    suggestions: suggestEmotionalDirection(engine).slice(0, 2)
  };
}

/**
 * Resets for a new scene/chapter
 */
export function resetForNewScene(engine) {
  engine.currentIntensity = INTENSITY.MODERATE;
  // Keep buildups and callbacks across scenes
  // Reset catharsis debt slightly
  engine.catharsisDebt = Math.max(0, engine.catharsisDebt - 10);
}

export default {
  createResonanceEngine,
  recordEmotionalMoment,
  startBuildup,
  advanceBuildup,
  isPayoffReady,
  triggerPayoff,
  suggestEmotionalDirection,
  getCallbackOpportunity,
  emotionalDistance,
  recommendTechnique,
  getEmotionalContext,
  resetForNewScene,
  EMOTIONAL_TONES,
  TECHNIQUES,
  INTENSITY
};
