/**
 * BreathSystem - Room to Feel
 *
 * This system creates deliberate pauses in the narrative -
 * moments where the reader can process, feel, and connect.
 * Not empty space, but resonant stillness.
 *
 * It handles:
 * - Breath moment timing
 * - Types of breathing room
 * - Sensory grounding
 * - Moment landing (letting things sit)
 * - Recovery after intensity
 *
 * Design Philosophy:
 * - Silence can be louder than words
 * - Readers need time to feel
 * - The pause after the revelation matters
 * - Not all breaths are the same
 * - Even action stories need to breathe
 */

// Types of breath moments
export const BREATH_TYPES = {
  // After intensity
  RECOVERY: 'recovery',           // After action/tension peak
  LANDING: 'landing',             // Let a moment settle
  PROCESSING: 'processing',       // Time to understand what happened

  // Atmospheric
  SENSORY: 'sensory',             // Grounding in physical detail
  AMBIENT: 'ambient',             // World continuing around characters
  TRANSITIONAL: 'transitional',   // Moving between scenes/moods

  // Emotional
  INTIMACY: 'intimacy',           // Quiet closeness
  SOLITUDE: 'solitude',           // Character alone with thoughts
  CONTEMPLATION: 'contemplation', // Reflecting on meaning

  // Structural
  CHAPTER_END: 'chapter_end',     // Natural pause point
  SCENE_SHIFT: 'scene_shift',     // Changing location/time
  RHYTHM_BREAK: 'rhythm_break'    // Intentional pace change
};

// Breath durations (relative)
export const DURATIONS = {
  BEAT: 'beat',           // Just a moment
  SHORT: 'short',         // Brief pause
  MEDIUM: 'medium',       // Standard breath
  LONG: 'long',           // Extended moment
  LINGERING: 'lingering'  // Let it really sit
};

// Sensory channels for grounding
export const SENSORY = {
  VISUAL: 'visual',       // What they see
  AUDITORY: 'auditory',   // What they hear
  TACTILE: 'tactile',     // What they feel
  OLFACTORY: 'olfactory', // What they smell
  KINESTHETIC: 'kinesthetic' // Body awareness
};

/**
 * Creates the breath system
 */
export function createBreathSystem() {
  return {
    // Breath tracking
    lastBreath: null,
    exchangesSinceBreath: 0,
    breathsThisScene: 0,

    // Intensity tracking (for recovery needs)
    recentIntensity: [],    // Last N intensity levels
    peakIntensity: 0,       // Highest recent intensity

    // Breath history
    history: [],

    // Pending breaths (queued for delivery)
    pending: [],

    // Current breath state
    isInBreath: false,
    currentBreathType: null,

    // Configuration
    config: {
      minExchangesBetweenBreaths: 4,
      maxExchangesBetweenBreaths: 12,
      intensityThresholdForRecovery: 70,
      preferredSensoryChannels: Object.values(SENSORY)
    },

    // Stats
    stats: {
      totalBreaths: 0,
      byType: {}
    }
  };
}

/**
 * Records intensity level for tracking
 */
export function recordIntensity(system, intensity) {
  system.recentIntensity.push({
    level: intensity,
    timestamp: Date.now()
  });

  // Keep last 10
  if (system.recentIntensity.length > 10) {
    system.recentIntensity = system.recentIntensity.slice(-10);
  }

  // Track peak
  if (intensity > system.peakIntensity) {
    system.peakIntensity = intensity;
  }

  system.exchangesSinceBreath++;
}

/**
 * Checks if a breath moment is needed
 */
export function needsBreath(system, context = {}) {
  const result = {
    needed: false,
    urgency: 'none',
    reasons: [],
    suggestedType: null,
    suggestedDuration: DURATIONS.MEDIUM
  };

  // Check exchange count
  if (system.exchangesSinceBreath >= system.config.maxExchangesBetweenBreaths) {
    result.needed = true;
    result.urgency = 'high';
    result.reasons.push('max_exchanges_reached');
    result.suggestedType = BREATH_TYPES.RHYTHM_BREAK;
  }

  // Check for recovery need after high intensity
  if (system.peakIntensity >= system.config.intensityThresholdForRecovery &&
      system.exchangesSinceBreath >= 2) {
    result.needed = true;
    result.urgency = result.urgency === 'high' ? 'high' : 'medium';
    result.reasons.push('recovery_needed');
    result.suggestedType = BREATH_TYPES.RECOVERY;
    result.suggestedDuration = DURATIONS.LONG;
  }

  // Check for landing moment (after revelation/emotional peak)
  if (context.justHadRevelation || context.emotionalPeak) {
    result.needed = true;
    result.urgency = 'high';
    result.reasons.push('landing_needed');
    result.suggestedType = BREATH_TYPES.LANDING;
    result.suggestedDuration = DURATIONS.MEDIUM;
  }

  // Check for scene transition
  if (context.sceneEnding || context.locationChange) {
    result.needed = true;
    result.urgency = 'medium';
    result.reasons.push('scene_transition');
    result.suggestedType = BREATH_TYPES.TRANSITIONAL;
  }

  // Check for intimacy opportunity
  if (context.charactersAlone && context.tensionLow && !context.actionNeeded) {
    if (system.exchangesSinceBreath >= system.config.minExchangesBetweenBreaths) {
      result.needed = true;
      result.urgency = 'low';
      result.reasons.push('intimacy_opportunity');
      result.suggestedType = BREATH_TYPES.INTIMACY;
    }
  }

  // Don't need breath if we just had one
  if (system.exchangesSinceBreath < system.config.minExchangesBetweenBreaths &&
      !result.reasons.includes('landing_needed')) {
    result.needed = false;
    result.urgency = 'none';
  }

  return result;
}

/**
 * Creates a breath moment
 */
export function createBreathMoment(system, type, options = {}) {
  const {
    duration = DURATIONS.MEDIUM,
    sensoryChannel = selectSensoryChannel(system),
    focus = null,
    characters = []
  } = options;

  const breath = {
    id: `breath_${Date.now()}`,
    type,
    duration,
    sensoryChannel,
    focus,
    characters,
    createdAt: Date.now()
  };

  // Add guidance based on type
  breath.guidance = getBreathGuidance(type, duration, sensoryChannel);

  return breath;
}

/**
 * Selects appropriate sensory channel
 */
function selectSensoryChannel(system) {
  // Vary channels to avoid repetition
  const recent = system.history.slice(-3).map(h => h.sensoryChannel);
  const preferred = system.config.preferredSensoryChannels;

  // Find channels not recently used
  const available = preferred.filter(c => !recent.includes(c));

  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }

  return preferred[Math.floor(Math.random() * preferred.length)];
}

/**
 * Gets guidance for creating the breath moment
 */
function getBreathGuidance(type, duration, sensoryChannel) {
  const guidance = {
    type,
    duration,
    sensoryChannel,
    suggestions: [],
    avoid: []
  };

  // Type-specific guidance
  switch (type) {
    case BREATH_TYPES.RECOVERY:
      guidance.suggestions.push(
        'Let characters catch their breath literally',
        'Show physical aftermath of intensity',
        'Moment of safety/relief'
      );
      guidance.avoid.push('New information', 'Action', 'Complex dialogue');
      break;

    case BREATH_TYPES.LANDING:
      guidance.suggestions.push(
        'Let the previous moment echo',
        'Characters process what just happened',
        'Simple, grounded details'
      );
      guidance.avoid.push('Moving on too quickly', 'Explaining', 'New plot');
      break;

    case BREATH_TYPES.SENSORY:
      guidance.suggestions.push(
        `Focus on ${sensoryChannel} details`,
        'Anchor reader in physical world',
        'Small, specific observations'
      );
      guidance.avoid.push('Abstract thoughts', 'Backstory', 'Dialogue heavy');
      break;

    case BREATH_TYPES.INTIMACY:
      guidance.suggestions.push(
        'Quiet closeness between characters',
        'Unspoken understanding',
        'Small gestures matter'
      );
      guidance.avoid.push('Big declarations', 'Conflict', 'Exposition');
      break;

    case BREATH_TYPES.CONTEMPLATION:
      guidance.suggestions.push(
        'Character reflects on meaning',
        'Connect current moment to larger themes',
        'Allow space for reader reflection too'
      );
      guidance.avoid.push('Action', 'Rushing forward', 'Too much dialogue');
      break;

    case BREATH_TYPES.AMBIENT:
      guidance.suggestions.push(
        'World continuing around characters',
        'Background details that feel alive',
        'Life going on as normal'
      );
      guidance.avoid.push('Plot-heavy content', 'Character deep dives');
      break;

    case BREATH_TYPES.TRANSITIONAL:
      guidance.suggestions.push(
        'Smooth movement between scenes',
        'Time passing naturally',
        'Setting the new mood'
      );
      guidance.avoid.push('Jarring jumps', 'Too much happens during transition');
      break;

    case BREATH_TYPES.SOLITUDE:
      guidance.suggestions.push(
        'Character alone with their thoughts',
        'Interior moment without narration dumps',
        'Stillness before the next beat'
      );
      guidance.avoid.push('Other characters', 'Dialogue', 'External action');
      break;

    default:
      guidance.suggestions.push(
        'Simple moment of pause',
        'Sensory grounding',
        'Let reader breathe'
      );
  }

  // Duration-specific adjustments
  if (duration === DURATIONS.BEAT) {
    guidance.suggestions.push('Very brief - just a sentence or two');
  } else if (duration === DURATIONS.LINGERING) {
    guidance.suggestions.push('Take your time - let it really settle');
  }

  // Sensory-specific suggestions
  switch (sensoryChannel) {
    case SENSORY.VISUAL:
      guidance.suggestions.push('What catches the eye, light and shadow');
      break;
    case SENSORY.AUDITORY:
      guidance.suggestions.push('Sounds present or notably absent');
      break;
    case SENSORY.TACTILE:
      guidance.suggestions.push('Textures, temperature, physical sensation');
      break;
    case SENSORY.OLFACTORY:
      guidance.suggestions.push('Scents that trigger memory or mood');
      break;
    case SENSORY.KINESTHETIC:
      guidance.suggestions.push('Body awareness, posture, breathing');
      break;
  }

  return guidance;
}

/**
 * Records that a breath happened
 */
export function recordBreath(system, breath) {
  system.history.push(breath);
  system.lastBreath = Date.now();
  system.exchangesSinceBreath = 0;
  system.breathsThisScene++;
  system.peakIntensity = 0; // Reset after recovery

  // Keep history bounded
  if (system.history.length > 30) {
    system.history = system.history.slice(-25);
  }

  // Stats
  system.stats.totalBreaths++;
  system.stats.byType[breath.type] = (system.stats.byType[breath.type] || 0) + 1;

  return breath;
}

/**
 * Starts a breath state (ongoing breath)
 */
export function startBreath(system, type) {
  system.isInBreath = true;
  system.currentBreathType = type;
}

/**
 * Ends a breath state
 */
export function endBreath(system) {
  system.isInBreath = false;
  system.currentBreathType = null;
}

/**
 * Queues a breath for upcoming delivery
 */
export function queueBreath(system, breath, afterExchanges = 0) {
  system.pending.push({
    breath,
    triggerAfter: afterExchanges,
    exchangesWaited: 0
  });
}

/**
 * Checks for pending breaths ready to deliver
 */
export function checkPendingBreaths(system) {
  const ready = [];
  const stillPending = [];

  for (const pending of system.pending) {
    pending.exchangesWaited++;
    if (pending.exchangesWaited >= pending.triggerAfter) {
      ready.push(pending.breath);
    } else {
      stillPending.push(pending);
    }
  }

  system.pending = stillPending;
  return ready;
}

/**
 * Gets breath context for AI prompting
 */
export function getBreathContext(system) {
  return {
    exchangesSinceBreath: system.exchangesSinceBreath,
    breathsThisScene: system.breathsThisScene,
    isInBreath: system.isInBreath,
    currentBreathType: system.currentBreathType,
    recentBreathTypes: system.history.slice(-3).map(h => h.type),
    recentSensoryChannels: system.history.slice(-3).map(h => h.sensoryChannel),
    peakIntensity: system.peakIntensity,
    pendingBreaths: system.pending.length
  };
}

/**
 * Gets sensory detail suggestions based on context
 */
export function getSensoryPrompts(channel, context = {}) {
  const prompts = {
    [SENSORY.VISUAL]: [
      'The way light falls',
      'Colors that stand out',
      'Movement or stillness',
      'Shadows and shapes',
      'Distance and perspective'
    ],
    [SENSORY.AUDITORY]: [
      'Background sounds',
      'Silence that speaks',
      'Rhythm or pattern',
      'Distant vs close sounds',
      'Voice qualities'
    ],
    [SENSORY.TACTILE]: [
      'Temperature on skin',
      'Textures touched',
      'Weight and pressure',
      'Air movement',
      'Ground beneath feet'
    ],
    [SENSORY.OLFACTORY]: [
      'Dominant scent',
      'Triggered memories',
      'Pleasant vs unpleasant',
      'Layers of smell',
      'Absence of expected scent'
    ],
    [SENSORY.KINESTHETIC]: [
      'Posture and stance',
      'Tension in muscles',
      'Breathing pattern',
      'Balance and movement',
      'Heart rate awareness'
    ]
  };

  // Adjust for context
  let suggestions = [...(prompts[channel] || prompts[SENSORY.VISUAL])];

  if (context.afterAction) {
    suggestions.unshift('Physical aftermath', 'Catching breath');
  }
  if (context.emotional) {
    suggestions.unshift('Physical manifestation of feeling');
  }

  return suggestions;
}

/**
 * Resets for new scene
 */
export function resetForNewScene(system) {
  system.breathsThisScene = 0;
  system.peakIntensity = 0;
  system.recentIntensity = [];
  // Keep exchangesSinceBreath for continuity
}

/**
 * Configures the breath system
 */
export function configureBreathSystem(system, config) {
  system.config = { ...system.config, ...config };
}

/**
 * Serializes system for storage
 */
export function serializeBreathSystem(system) {
  return JSON.stringify({
    history: system.history.slice(-15),
    config: system.config,
    stats: system.stats
  });
}

/**
 * Deserializes system from storage
 */
export function deserializeBreathSystem(data) {
  try {
    const parsed = JSON.parse(data);
    const system = createBreathSystem();

    system.history = parsed.history || [];
    system.config = { ...system.config, ...parsed.config };
    system.stats = parsed.stats || system.stats;

    return system;
  } catch {
    return null;
  }
}

export default {
  createBreathSystem,
  recordIntensity,
  needsBreath,
  createBreathMoment,
  recordBreath,
  startBreath,
  endBreath,
  queueBreath,
  checkPendingBreaths,
  getBreathContext,
  getSensoryPrompts,
  resetForNewScene,
  configureBreathSystem,
  serializeBreathSystem,
  deserializeBreathSystem,
  BREATH_TYPES,
  DURATIONS,
  SENSORY
};
