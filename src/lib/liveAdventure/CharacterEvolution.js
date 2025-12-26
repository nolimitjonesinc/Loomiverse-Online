/**
 * CharacterEvolution - Arcs Within Adventure
 *
 * This system tracks how characters change over the course
 * of an adventure. Not just big dramatic shifts, but the
 * subtle accumulation of moments that make a character
 * feel alive and growing.
 *
 * It handles:
 * - Growth tracking across dimensions
 * - Arc patterns (redemption, fall, coming-of-age)
 * - Moment detection (when growth happens)
 * - Transformation milestones
 * - Regression and setbacks (realistic arcs)
 *
 * Design Philosophy:
 * - Growth happens in moments, not montages
 * - Two steps forward, one step back feels real
 * - The reader should witness change, not be told about it
 * - Some arcs are subtle, and that's beautiful
 * - Characters resist change until they can't
 */

// Growth dimensions that can change
export const GROWTH_DIMENSIONS = {
  // Core traits
  COURAGE: 'courage',
  COMPASSION: 'compassion',
  WISDOM: 'wisdom',
  HONESTY: 'honesty',
  HUMILITY: 'humility',
  TRUST: 'trust',
  SELF_WORTH: 'self_worth',

  // Emotional
  EMOTIONAL_OPENNESS: 'emotional_openness',
  VULNERABILITY: 'vulnerability',
  HOPE: 'hope',
  FORGIVENESS: 'forgiveness',

  // Relational
  WILLINGNESS_TO_CONNECT: 'willingness_to_connect',
  LETTING_GO: 'letting_go',
  ACCEPTING_HELP: 'accepting_help',

  // Skills/knowledge (less common to change dramatically)
  SKILL_CONFIDENCE: 'skill_confidence',
  LEADERSHIP: 'leadership'
};

// Arc patterns
export const ARC_PATTERNS = {
  REDEMPTION: 'redemption',           // Bad to good
  FALL: 'fall',                       // Good to bad (tragic)
  CORRUPTION: 'corruption',           // Gradual moral decline
  COMING_OF_AGE: 'coming_of_age',     // Innocence to experience
  HEALING: 'healing',                 // Broken to whole
  UNMASKING: 'unmasking',             // False self to true self
  DISILLUSIONMENT: 'disillusionment', // Idealism to realism
  RECONNECTION: 'reconnection',       // Isolation to belonging
  EMPOWERMENT: 'empowerment',         // Powerless to capable
  ACCEPTANCE: 'acceptance',           // Resistance to peace
  TRANSFORMATION: 'transformation'     // Generic major change
};

// Growth catalysts (what causes change)
export const CATALYSTS = {
  // Positive growth triggers
  ACT_OF_COURAGE: 'act_of_courage',
  RECEIVED_KINDNESS: 'received_kindness',
  WITNESSED_EXAMPLE: 'witnessed_example',
  VULNERABLE_MOMENT: 'vulnerable_moment',
  SUCCESS_EXPERIENCE: 'success_experience',
  FORGIVENESS_GIVEN: 'forgiveness_given',
  FORGIVENESS_RECEIVED: 'forgiveness_received',
  TRUST_HONORED: 'trust_honored',
  CONNECTION_MADE: 'connection_made',

  // Negative growth triggers (setbacks)
  BETRAYAL_EXPERIENCED: 'betrayal_experienced',
  FAILURE_EXPERIENCE: 'failure_experience',
  REJECTION: 'rejection',
  LOSS: 'loss',
  SHAME_MOMENT: 'shame_moment',
  FEAR_RESPONSE: 'fear_response',

  // Neutral/complex
  CHALLENGE_FACED: 'challenge_faced',
  TRUTH_REVEALED: 'truth_revealed',
  CHOICE_MADE: 'choice_made',
  SACRIFICE_MADE: 'sacrifice_made'
};

// Resistance levels (how hard change is)
export const RESISTANCE = {
  OPEN: 1,          // Ready to change
  WILLING: 2,       // Accepts need to change
  RELUCTANT: 3,     // Fights but yields
  RESISTANT: 4,     // Strongly fights change
  ENTRENCHED: 5     // Core identity, very hard to shift
};

/**
 * Creates a character evolution tracker
 */
export function createEvolutionTracker(character) {
  // Determine initial state based on character psychology
  const initialState = {};
  for (const dim of Object.values(GROWTH_DIMENSIONS)) {
    initialState[dim] = {
      level: 50,              // 0-100 scale
      velocity: 0,            // Current direction (-10 to +10)
      resistance: RESISTANCE.RELUCTANT,
      lastChange: null,
      changeHistory: []
    };
  }

  // Adjust based on character psychology if available
  if (character.psychology) {
    const psych = character.psychology;

    // Map wounds to lower starting points
    if (psych.deepestWound) {
      const wound = psych.deepestWound.toLowerCase();
      if (wound.includes('abandon') || wound.includes('betray')) {
        initialState[GROWTH_DIMENSIONS.TRUST].level = 25;
        initialState[GROWTH_DIMENSIONS.TRUST].resistance = RESISTANCE.ENTRENCHED;
      }
      if (wound.includes('reject') || wound.includes('worth')) {
        initialState[GROWTH_DIMENSIONS.SELF_WORTH].level = 30;
        initialState[GROWTH_DIMENSIONS.SELF_WORTH].resistance = RESISTANCE.RESISTANT;
      }
      if (wound.includes('fail') || wound.includes('disappoint')) {
        initialState[GROWTH_DIMENSIONS.COURAGE].level = 35;
        initialState[GROWTH_DIMENSIONS.COURAGE].resistance = RESISTANCE.RESISTANT;
      }
    }

    // Map attachment style
    if (psych.attachmentStyle === 'avoidant') {
      initialState[GROWTH_DIMENSIONS.VULNERABILITY].level = 20;
      initialState[GROWTH_DIMENSIONS.VULNERABILITY].resistance = RESISTANCE.ENTRENCHED;
      initialState[GROWTH_DIMENSIONS.WILLINGNESS_TO_CONNECT].level = 35;
    } else if (psych.attachmentStyle === 'anxious') {
      initialState[GROWTH_DIMENSIONS.SELF_WORTH].level = 30;
      initialState[GROWTH_DIMENSIONS.LETTING_GO].level = 25;
    }
  }

  return {
    characterId: character.name || character.id,
    characterName: character.name,

    // Current state
    state: initialState,

    // Active arc (if detected)
    activeArc: null,
    potentialArcs: [],

    // Growth moments
    growthMoments: [],

    // Transformation milestones
    milestones: [],

    // Overall direction
    netDirection: 0,  // Positive = growing, negative = declining

    // Stats
    stats: {
      totalGrowth: 0,
      totalRegression: 0,
      momentsRecorded: 0,
      milestonesAchieved: 0
    }
  };
}

/**
 * Records a growth moment
 */
export function recordGrowthMoment(tracker, moment) {
  const {
    dimension,
    catalyst,
    magnitude = 5,      // How much change (-20 to +20)
    context = '',
    witnessed = false   // Did reader see this happen?
  } = moment;

  const state = tracker.state[dimension];
  if (!state) return tracker;

  // Calculate actual change based on resistance
  let actualChange = magnitude;
  if (magnitude > 0) {
    // Positive change is harder with high resistance
    actualChange = Math.round(magnitude / (state.resistance * 0.5));
  } else {
    // Negative change (regression) can happen more easily
    actualChange = Math.round(magnitude * (1 + (state.resistance * 0.1)));
  }

  // Apply change
  const previousLevel = state.level;
  state.level = Math.max(0, Math.min(100, state.level + actualChange));

  // Update velocity (moving average)
  state.velocity = (state.velocity * 0.7) + (actualChange * 0.3);

  // Record the moment
  const growthMoment = {
    dimension,
    catalyst,
    rawMagnitude: magnitude,
    actualChange,
    previousLevel,
    newLevel: state.level,
    context,
    witnessed,
    timestamp: Date.now()
  };

  state.changeHistory.push(growthMoment);
  state.lastChange = Date.now();

  // Keep history bounded
  if (state.changeHistory.length > 20) {
    state.changeHistory = state.changeHistory.slice(-15);
  }

  // Add to overall growth moments
  tracker.growthMoments.push(growthMoment);
  tracker.stats.momentsRecorded++;

  // Update stats
  if (actualChange > 0) {
    tracker.stats.totalGrowth += actualChange;
  } else {
    tracker.stats.totalRegression += Math.abs(actualChange);
  }

  // Update net direction
  updateNetDirection(tracker);

  // Check for milestones
  checkForMilestones(tracker, dimension, state);

  // Detect arc patterns
  detectArcPattern(tracker);

  return tracker;
}

/**
 * Updates the net direction of growth
 */
function updateNetDirection(tracker) {
  let totalVelocity = 0;
  let count = 0;

  for (const state of Object.values(tracker.state)) {
    totalVelocity += state.velocity;
    count++;
  }

  tracker.netDirection = count > 0 ? totalVelocity / count : 0;
}

/**
 * Checks for and records milestones
 */
function checkForMilestones(tracker, dimension, state) {
  const milestoneThresholds = {
    first_growth: { level: 55, direction: 'up' },
    significant_growth: { level: 70, direction: 'up' },
    breakthrough: { level: 85, direction: 'up' },
    first_setback: { level: 45, direction: 'down' },
    significant_regression: { level: 30, direction: 'down' },
    crisis_point: { level: 15, direction: 'down' }
  };

  for (const [milestoneName, threshold] of Object.entries(milestoneThresholds)) {
    const existingMilestone = tracker.milestones.find(m =>
      m.dimension === dimension && m.type === milestoneName
    );

    if (existingMilestone) continue;

    let achieved = false;
    if (threshold.direction === 'up' && state.level >= threshold.level) {
      achieved = true;
    } else if (threshold.direction === 'down' && state.level <= threshold.level) {
      achieved = true;
    }

    if (achieved) {
      tracker.milestones.push({
        type: milestoneName,
        dimension,
        level: state.level,
        timestamp: Date.now()
      });
      tracker.stats.milestonesAchieved++;
    }
  }
}

/**
 * Detects arc patterns from growth history
 */
function detectArcPattern(tracker) {
  // Analyze recent growth across all dimensions
  const recentGrowth = tracker.growthMoments.slice(-15);
  if (recentGrowth.length < 3) return;

  const patterns = {};

  // Check for redemption arc (multiple dimensions improving from low)
  const redemptionSignals = Object.entries(tracker.state).filter(([, state]) =>
    state.level >= 60 && state.changeHistory.some(h => h.previousLevel < 40)
  );
  if (redemptionSignals.length >= 2) {
    patterns[ARC_PATTERNS.REDEMPTION] = redemptionSignals.length * 20;
  }

  // Check for healing arc (vulnerability/trust improving)
  const healingDims = [GROWTH_DIMENSIONS.TRUST, GROWTH_DIMENSIONS.VULNERABILITY, GROWTH_DIMENSIONS.EMOTIONAL_OPENNESS];
  const healingGrowth = healingDims.filter(dim =>
    tracker.state[dim]?.velocity > 0 && tracker.state[dim]?.level > 50
  );
  if (healingGrowth.length >= 2) {
    patterns[ARC_PATTERNS.HEALING] = healingGrowth.length * 25;
  }

  // Check for coming of age (wisdom + courage growing)
  const comingOfAgeDims = [GROWTH_DIMENSIONS.WISDOM, GROWTH_DIMENSIONS.COURAGE, GROWTH_DIMENSIONS.SELF_WORTH];
  const comingOfAge = comingOfAgeDims.filter(dim =>
    tracker.state[dim]?.velocity > 0
  );
  if (comingOfAge.length >= 2) {
    patterns[ARC_PATTERNS.COMING_OF_AGE] = comingOfAge.length * 20;
  }

  // Check for fall/corruption (multiple dimensions declining)
  const fallingSignals = Object.entries(tracker.state).filter(([, state]) =>
    state.velocity < -2
  );
  if (fallingSignals.length >= 2) {
    patterns[ARC_PATTERNS.FALL] = fallingSignals.length * 20;
  }

  // Set active arc if confidence is high enough
  const highestPattern = Object.entries(patterns)
    .sort((a, b) => b[1] - a[1])[0];

  if (highestPattern && highestPattern[1] >= 40) {
    tracker.activeArc = {
      pattern: highestPattern[0],
      confidence: highestPattern[1],
      detectedAt: Date.now()
    };
  }

  // Store potential arcs
  tracker.potentialArcs = Object.entries(patterns)
    .filter(([, score]) => score >= 20)
    .map(([pattern, score]) => ({ pattern, score }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Reduces resistance after repeated growth
 */
export function reduceResistance(tracker, dimension) {
  const state = tracker.state[dimension];
  if (!state) return tracker;

  // Count recent positive growth
  const recentGrowth = state.changeHistory.slice(-5).filter(h => h.actualChange > 0);

  // After 3+ positive experiences, resistance can decrease
  if (recentGrowth.length >= 3) {
    state.resistance = Math.max(RESISTANCE.OPEN, state.resistance - 1);
  }

  return tracker;
}

/**
 * Increases resistance after setback (defensive response)
 */
export function increaseResistance(tracker, dimension) {
  const state = tracker.state[dimension];
  if (!state) return tracker;

  // Recent regression can increase resistance
  const recentRegression = state.changeHistory.slice(-3).filter(h => h.actualChange < 0);

  if (recentRegression.length >= 2) {
    state.resistance = Math.min(RESISTANCE.ENTRENCHED, state.resistance + 1);
  }

  return tracker;
}

/**
 * Gets evolution context for AI prompting
 */
export function getEvolutionContext(tracker) {
  const significantStates = Object.entries(tracker.state)
    .filter(([, state]) =>
      state.level < 30 || state.level > 70 || Math.abs(state.velocity) > 3
    )
    .map(([dimension, state]) => ({
      dimension,
      level: state.level,
      direction: state.velocity > 0 ? 'growing' : state.velocity < 0 ? 'declining' : 'stable',
      description: getStateDescription(state.level)
    }));

  return {
    characterName: tracker.characterName,
    overallDirection: tracker.netDirection > 1 ? 'positive growth'
                    : tracker.netDirection < -1 ? 'regression'
                    : 'stable',
    activeArc: tracker.activeArc?.pattern || null,
    significantStates,
    recentMilestones: tracker.milestones.slice(-3).map(m => m.type),
    stats: {
      growth: tracker.stats.totalGrowth,
      regression: tracker.stats.totalRegression,
      netChange: tracker.stats.totalGrowth - tracker.stats.totalRegression
    }
  };
}

/**
 * Gets human-readable state description
 */
function getStateDescription(level) {
  if (level >= 85) return 'very high';
  if (level >= 70) return 'high';
  if (level >= 55) return 'above average';
  if (level >= 45) return 'average';
  if (level >= 30) return 'below average';
  if (level >= 15) return 'low';
  return 'very low';
}

/**
 * Gets the most active growth dimension
 */
export function getMostActiveDimension(tracker) {
  let mostActive = null;
  let highestActivity = 0;

  for (const [dimension, state] of Object.entries(tracker.state)) {
    const activity = Math.abs(state.velocity) + (state.changeHistory.length * 0.5);
    if (activity > highestActivity) {
      highestActivity = activity;
      mostActive = {
        dimension,
        state,
        activity
      };
    }
  }

  return mostActive;
}

/**
 * Gets growth suggestions for story direction
 */
export function getGrowthSuggestions(tracker) {
  const suggestions = [];

  // Suggest opportunities based on current state
  for (const [dimension, state] of Object.entries(tracker.state)) {
    // Low levels with reducing resistance = ripe for growth moment
    if (state.level < 40 && state.resistance <= RESISTANCE.RELUCTANT) {
      suggestions.push({
        type: 'growth_opportunity',
        dimension,
        reason: `${dimension} is low but character is becoming more open`,
        suggestedCatalysts: getSuggestedCatalysts(dimension, 'positive')
      });
    }

    // High velocity = maintain momentum
    if (state.velocity > 5) {
      suggestions.push({
        type: 'maintain_momentum',
        dimension,
        reason: `${dimension} is growing rapidly`,
        suggestedCatalysts: getSuggestedCatalysts(dimension, 'positive')
      });
    }

    // Declining = maybe needs challenge or support
    if (state.velocity < -3) {
      suggestions.push({
        type: 'address_decline',
        dimension,
        reason: `${dimension} is declining - character needs support or confrontation`,
        suggestedCatalysts: getSuggestedCatalysts(dimension, 'recovery')
      });
    }
  }

  // Sort by urgency
  return suggestions.sort((a, b) => {
    const urgency = { address_decline: 3, maintain_momentum: 2, growth_opportunity: 1 };
    return urgency[b.type] - urgency[a.type];
  });
}

/**
 * Gets suggested catalysts for growth
 */
function getSuggestedCatalysts(dimension, type) {
  const catalystMap = {
    [GROWTH_DIMENSIONS.COURAGE]: {
      positive: [CATALYSTS.ACT_OF_COURAGE, CATALYSTS.SUCCESS_EXPERIENCE, CATALYSTS.WITNESSED_EXAMPLE],
      recovery: [CATALYSTS.CHALLENGE_FACED, CATALYSTS.RECEIVED_KINDNESS]
    },
    [GROWTH_DIMENSIONS.TRUST]: {
      positive: [CATALYSTS.TRUST_HONORED, CATALYSTS.CONNECTION_MADE, CATALYSTS.VULNERABLE_MOMENT],
      recovery: [CATALYSTS.RECEIVED_KINDNESS, CATALYSTS.FORGIVENESS_RECEIVED]
    },
    [GROWTH_DIMENSIONS.SELF_WORTH]: {
      positive: [CATALYSTS.SUCCESS_EXPERIENCE, CATALYSTS.RECEIVED_KINDNESS, CATALYSTS.CONNECTION_MADE],
      recovery: [CATALYSTS.WITNESSED_EXAMPLE, CATALYSTS.FORGIVENESS_RECEIVED]
    },
    [GROWTH_DIMENSIONS.VULNERABILITY]: {
      positive: [CATALYSTS.VULNERABLE_MOMENT, CATALYSTS.TRUST_HONORED, CATALYSTS.CONNECTION_MADE],
      recovery: [CATALYSTS.RECEIVED_KINDNESS, CATALYSTS.WITNESSED_EXAMPLE]
    }
  };

  return catalystMap[dimension]?.[type] || [CATALYSTS.CHOICE_MADE, CATALYSTS.CHALLENGE_FACED];
}

/**
 * Checks if a breakthrough moment is building
 */
export function isBreakthroughBuilding(tracker, dimension) {
  const state = tracker.state[dimension];
  if (!state) return false;

  // Breakthrough = sustained positive velocity toward a threshold
  return state.velocity > 3 &&
         state.level >= 60 && state.level < 85 &&
         state.changeHistory.slice(-3).every(h => h.actualChange > 0);
}

/**
 * Checks if a crisis is developing
 */
export function isCrisisDeveloping(tracker, dimension) {
  const state = tracker.state[dimension];
  if (!state) return false;

  // Crisis = sustained decline toward low threshold
  return state.velocity < -3 &&
         state.level <= 35 &&
         state.changeHistory.slice(-2).every(h => h.actualChange < 0);
}

/**
 * Serializes tracker for storage
 */
export function serializeEvolutionTracker(tracker) {
  return JSON.stringify({
    characterId: tracker.characterId,
    characterName: tracker.characterName,
    state: tracker.state,
    activeArc: tracker.activeArc,
    milestones: tracker.milestones,
    stats: tracker.stats
  });
}

/**
 * Deserializes tracker from storage
 */
export function deserializeEvolutionTracker(data, character) {
  try {
    const parsed = JSON.parse(data);
    const tracker = createEvolutionTracker(character);

    tracker.state = parsed.state || tracker.state;
    tracker.activeArc = parsed.activeArc;
    tracker.milestones = parsed.milestones || [];
    tracker.stats = parsed.stats || tracker.stats;

    return tracker;
  } catch {
    return null;
  }
}

export default {
  createEvolutionTracker,
  recordGrowthMoment,
  reduceResistance,
  increaseResistance,
  getEvolutionContext,
  getMostActiveDimension,
  getGrowthSuggestions,
  isBreakthroughBuilding,
  isCrisisDeveloping,
  serializeEvolutionTracker,
  deserializeEvolutionTracker,
  GROWTH_DIMENSIONS,
  ARC_PATTERNS,
  CATALYSTS,
  RESISTANCE
};
