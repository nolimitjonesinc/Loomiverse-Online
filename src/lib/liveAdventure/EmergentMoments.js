/**
 * EmergentMoments - Unplanned Magic
 *
 * This system detects when conditions align for something
 * special to happen. Not forced, not scripted - emergent.
 * The moments that make a story feel alive.
 *
 * It handles:
 * - Condition detection (when stars align)
 * - Moment catalysis (making magic happen)
 * - Serendipity tracking (lucky convergences)
 * - Pattern recognition (recurring opportunities)
 * - Surprise generation (unexpected but fitting)
 *
 * Design Philosophy:
 * - The best moments can't be planned
 * - Conditions create opportunities, not guarantees
 * - Some magic comes from collision, some from stillness
 * - Reader choices can unlock unexpected possibilities
 * - Let the story breathe and see what happens
 */

// Types of emergent moments
export const MOMENT_TYPES = {
  // Relationship moments
  UNEXPECTED_UNDERSTANDING: 'unexpected_understanding',
  ROLE_REVERSAL: 'role_reversal',
  SHARED_VULNERABILITY: 'shared_vulnerability',
  ACCIDENTAL_INTIMACY: 'accidental_intimacy',
  SURPRISING_ALLIANCE: 'surprising_alliance',

  // Plot moments
  SERENDIPITOUS_DISCOVERY: 'serendipitous_discovery',
  CALLBACK_CONVERGENCE: 'callback_convergence',
  PARALLEL_REALIZATION: 'parallel_realization',
  IRONIC_TWIST: 'ironic_twist',
  UNEXPECTED_CONSEQUENCE: 'unexpected_consequence',

  // Character moments
  OUT_OF_CHARACTER_GROWTH: 'out_of_character_growth',
  HIDDEN_DEPTH_REVEAL: 'hidden_depth_reveal',
  WEAKNESS_BECOMES_STRENGTH: 'weakness_becomes_strength',
  MIRROR_MOMENT: 'mirror_moment',

  // Atmospheric moments
  PERFECT_SILENCE: 'perfect_silence',
  TIMING_MAGIC: 'timing_magic',
  SYMBOLIC_ALIGNMENT: 'symbolic_alignment'
};

// Conditions that can trigger moments
export const CONDITIONS = {
  // Tension conditions
  HIGH_TENSION: 'high_tension',
  LOW_TENSION: 'low_tension',
  TENSION_SHIFT: 'tension_shift',

  // Emotional conditions
  EMOTIONAL_PEAK: 'emotional_peak',
  VULNERABILITY_PRESENT: 'vulnerability_present',
  CATHARSIS_NEAR: 'catharsis_near',

  // Character conditions
  CHARACTERS_ALONE: 'characters_alone',
  NEW_CHARACTER_PRESENT: 'new_character_present',
  ANTAGONIST_PRESENT: 'antagonist_present',
  BOND_THRESHOLD: 'bond_threshold',

  // Narrative conditions
  CALLBACK_AVAILABLE: 'callback_available',
  THREAD_RIPE: 'thread_ripe',
  PATTERN_DETECTED: 'pattern_detected',
  CHEKHOV_READY: 'chekhov_ready',

  // Reader conditions
  READER_ENGAGED: 'reader_engaged',
  READER_SURPRISED: 'reader_surprised',
  READER_CHOICE_UNUSUAL: 'reader_choice_unusual'
};

// Moment intensity
export const INTENSITY = {
  SUBTLE: 'subtle',       // Barely noticeable, plants seed
  NOTABLE: 'notable',     // Reader will remember
  SIGNIFICANT: 'significant', // Story-changing
  TRANSCENDENT: 'transcendent' // Peak experience
};

/**
 * Creates the emergent moments system
 */
export function createEmergentSystem() {
  return {
    // Current conditions
    activeConditions: new Set(),

    // Potential moments (conditions partially met)
    potentialMoments: [],

    // Triggered moments history
    triggeredMoments: [],

    // Recipes (condition combinations that create moments)
    recipes: initializeRecipes(),

    // Tracking
    lastCheck: null,
    momentsThisSession: 0,
    cooldown: 0,  // Exchanges until next moment can trigger

    // Stats
    stats: {
      conditionsChecked: 0,
      momentsPossible: 0,
      momentsTriggered: 0,
      byType: {}
    }
  };
}

/**
 * Initializes moment recipes
 */
function initializeRecipes() {
  return [
    // Unexpected Understanding
    {
      momentType: MOMENT_TYPES.UNEXPECTED_UNDERSTANDING,
      requiredConditions: [CONDITIONS.VULNERABILITY_PRESENT, CONDITIONS.CHARACTERS_ALONE],
      optionalConditions: [CONDITIONS.LOW_TENSION, CONDITIONS.BOND_THRESHOLD],
      minMatch: 2,
      intensity: INTENSITY.SIGNIFICANT,
      cooldown: 8,
      description: 'Characters connect in unexpected way'
    },

    // Role Reversal
    {
      momentType: MOMENT_TYPES.ROLE_REVERSAL,
      requiredConditions: [CONDITIONS.TENSION_SHIFT],
      optionalConditions: [CONDITIONS.HIGH_TENSION, CONDITIONS.PATTERN_DETECTED],
      minMatch: 2,
      intensity: INTENSITY.NOTABLE,
      cooldown: 6,
      description: 'Character takes unexpected role'
    },

    // Shared Vulnerability
    {
      momentType: MOMENT_TYPES.SHARED_VULNERABILITY,
      requiredConditions: [CONDITIONS.VULNERABILITY_PRESENT],
      optionalConditions: [CONDITIONS.EMOTIONAL_PEAK, CONDITIONS.CATHARSIS_NEAR, CONDITIONS.LOW_TENSION],
      minMatch: 3,
      intensity: INTENSITY.SIGNIFICANT,
      cooldown: 10,
      description: 'Multiple characters open up together'
    },

    // Serendipitous Discovery
    {
      momentType: MOMENT_TYPES.SERENDIPITOUS_DISCOVERY,
      requiredConditions: [CONDITIONS.READER_CHOICE_UNUSUAL],
      optionalConditions: [CONDITIONS.THREAD_RIPE, CONDITIONS.CHEKHOV_READY],
      minMatch: 2,
      intensity: INTENSITY.NOTABLE,
      cooldown: 5,
      description: 'Reader stumbles onto something meaningful'
    },

    // Callback Convergence
    {
      momentType: MOMENT_TYPES.CALLBACK_CONVERGENCE,
      requiredConditions: [CONDITIONS.CALLBACK_AVAILABLE],
      optionalConditions: [CONDITIONS.EMOTIONAL_PEAK, CONDITIONS.PATTERN_DETECTED, CONDITIONS.BOND_THRESHOLD],
      minMatch: 2,
      intensity: INTENSITY.SIGNIFICANT,
      cooldown: 8,
      description: 'Earlier moment pays off unexpectedly'
    },

    // Ironic Twist
    {
      momentType: MOMENT_TYPES.IRONIC_TWIST,
      requiredConditions: [CONDITIONS.PATTERN_DETECTED, CONDITIONS.THREAD_RIPE],
      optionalConditions: [CONDITIONS.HIGH_TENSION, CONDITIONS.READER_SURPRISED],
      minMatch: 2,
      intensity: INTENSITY.SIGNIFICANT,
      cooldown: 12,
      description: 'Setup pays off in opposite way'
    },

    // Out of Character Growth
    {
      momentType: MOMENT_TYPES.OUT_OF_CHARACTER_GROWTH,
      requiredConditions: [CONDITIONS.HIGH_TENSION],
      optionalConditions: [CONDITIONS.VULNERABILITY_PRESENT, CONDITIONS.CATHARSIS_NEAR],
      minMatch: 2,
      intensity: INTENSITY.NOTABLE,
      cooldown: 7,
      description: 'Character acts against type in meaningful way'
    },

    // Hidden Depth Reveal
    {
      momentType: MOMENT_TYPES.HIDDEN_DEPTH_REVEAL,
      requiredConditions: [CONDITIONS.CHARACTERS_ALONE],
      optionalConditions: [CONDITIONS.VULNERABILITY_PRESENT, CONDITIONS.LOW_TENSION, CONDITIONS.READER_ENGAGED],
      minMatch: 2,
      intensity: INTENSITY.NOTABLE,
      cooldown: 6,
      description: 'Character reveals unexpected facet'
    },

    // Mirror Moment
    {
      momentType: MOMENT_TYPES.MIRROR_MOMENT,
      requiredConditions: [CONDITIONS.PATTERN_DETECTED],
      optionalConditions: [CONDITIONS.EMOTIONAL_PEAK, CONDITIONS.CALLBACK_AVAILABLE],
      minMatch: 2,
      intensity: INTENSITY.SUBTLE,
      cooldown: 5,
      description: 'Reader sees parallel to their own life/choices'
    },

    // Perfect Silence
    {
      momentType: MOMENT_TYPES.PERFECT_SILENCE,
      requiredConditions: [CONDITIONS.EMOTIONAL_PEAK],
      optionalConditions: [CONDITIONS.LOW_TENSION, CONDITIONS.VULNERABILITY_PRESENT],
      minMatch: 2,
      intensity: INTENSITY.NOTABLE,
      cooldown: 8,
      description: 'Silence says everything'
    },

    // Timing Magic
    {
      momentType: MOMENT_TYPES.TIMING_MAGIC,
      requiredConditions: [CONDITIONS.TENSION_SHIFT, CONDITIONS.CALLBACK_AVAILABLE],
      optionalConditions: [CONDITIONS.NEW_CHARACTER_PRESENT, CONDITIONS.READER_SURPRISED],
      minMatch: 2,
      intensity: INTENSITY.NOTABLE,
      cooldown: 6,
      description: 'Something happens at perfect moment'
    },

    // Accidental Intimacy
    {
      momentType: MOMENT_TYPES.ACCIDENTAL_INTIMACY,
      requiredConditions: [CONDITIONS.LOW_TENSION, CONDITIONS.CHARACTERS_ALONE],
      optionalConditions: [CONDITIONS.VULNERABILITY_PRESENT, CONDITIONS.BOND_THRESHOLD],
      minMatch: 3,
      intensity: INTENSITY.NOTABLE,
      cooldown: 8,
      description: 'Unplanned closeness creates connection'
    },

    // Surprising Alliance
    {
      momentType: MOMENT_TYPES.SURPRISING_ALLIANCE,
      requiredConditions: [CONDITIONS.HIGH_TENSION],
      optionalConditions: [CONDITIONS.ANTAGONIST_PRESENT, CONDITIONS.THREAD_RIPE],
      minMatch: 2,
      intensity: INTENSITY.SIGNIFICANT,
      cooldown: 10,
      description: 'Unlikely characters unite'
    },

    // Weakness Becomes Strength
    {
      momentType: MOMENT_TYPES.WEAKNESS_BECOMES_STRENGTH,
      requiredConditions: [CONDITIONS.HIGH_TENSION, CONDITIONS.PATTERN_DETECTED],
      optionalConditions: [CONDITIONS.READER_CHOICE_UNUSUAL, CONDITIONS.CATHARSIS_NEAR],
      minMatch: 2,
      intensity: INTENSITY.SIGNIFICANT,
      cooldown: 10,
      description: 'Character flaw saves the day'
    }
  ];
}

/**
 * Sets a condition as active
 */
export function setCondition(system, condition, active = true) {
  if (active) {
    system.activeConditions.add(condition);
  } else {
    system.activeConditions.delete(condition);
  }
}

/**
 * Sets multiple conditions from context
 */
export function updateConditionsFromContext(system, context) {
  // Clear previous conditions
  system.activeConditions.clear();

  // Tension conditions
  if (context.tension >= 70) {
    setCondition(system, CONDITIONS.HIGH_TENSION);
  } else if (context.tension <= 30) {
    setCondition(system, CONDITIONS.LOW_TENSION);
  }
  if (context.tensionChanged && Math.abs(context.tensionChange) >= 15) {
    setCondition(system, CONDITIONS.TENSION_SHIFT);
  }

  // Emotional conditions
  if (context.emotionalIntensity >= 4) {
    setCondition(system, CONDITIONS.EMOTIONAL_PEAK);
  }
  if (context.vulnerabilityPresent) {
    setCondition(system, CONDITIONS.VULNERABILITY_PRESENT);
  }
  if (context.catharsisDebt >= 50) {
    setCondition(system, CONDITIONS.CATHARSIS_NEAR);
  }

  // Character conditions
  if (context.presentCharacters?.length === 1) {
    setCondition(system, CONDITIONS.CHARACTERS_ALONE);
  }
  if (context.newCharacterEntered) {
    setCondition(system, CONDITIONS.NEW_CHARACTER_PRESENT);
  }
  if (context.antagonistPresent) {
    setCondition(system, CONDITIONS.ANTAGONIST_PRESENT);
  }
  if (context.bondStrong) {
    setCondition(system, CONDITIONS.BOND_THRESHOLD);
  }

  // Narrative conditions
  if (context.callbackAvailable) {
    setCondition(system, CONDITIONS.CALLBACK_AVAILABLE);
  }
  if (context.threadRipe) {
    setCondition(system, CONDITIONS.THREAD_RIPE);
  }
  if (context.patternDetected) {
    setCondition(system, CONDITIONS.PATTERN_DETECTED);
  }
  if (context.chekhovReady) {
    setCondition(system, CONDITIONS.CHEKHOV_READY);
  }

  // Reader conditions
  if (context.readerEngagement >= 70) {
    setCondition(system, CONDITIONS.READER_ENGAGED);
  }
  if (context.readerSurprised) {
    setCondition(system, CONDITIONS.READER_SURPRISED);
  }
  if (context.unusualChoice) {
    setCondition(system, CONDITIONS.READER_CHOICE_UNUSUAL);
  }

  system.stats.conditionsChecked++;
}

/**
 * Checks for possible emergent moments
 */
export function checkForMoments(system) {
  if (system.cooldown > 0) {
    system.cooldown--;
    return [];
  }

  const possible = [];

  for (const recipe of system.recipes) {
    const match = checkRecipeMatch(system, recipe);
    if (match.matches) {
      possible.push({
        recipe,
        match,
        priority: calculatePriority(match, recipe)
      });
    }
  }

  system.stats.momentsPossible += possible.length;
  system.lastCheck = Date.now();

  // Sort by priority
  return possible.sort((a, b) => b.priority - a.priority);
}

/**
 * Checks if a recipe's conditions are met
 */
function checkRecipeMatch(system, recipe) {
  let requiredMet = 0;
  let optionalMet = 0;
  const metConditions = [];

  // Check required conditions
  for (const condition of recipe.requiredConditions) {
    if (system.activeConditions.has(condition)) {
      requiredMet++;
      metConditions.push(condition);
    }
  }

  // All required must be met
  if (requiredMet < recipe.requiredConditions.length) {
    return { matches: false };
  }

  // Check optional conditions
  for (const condition of recipe.optionalConditions) {
    if (system.activeConditions.has(condition)) {
      optionalMet++;
      metConditions.push(condition);
    }
  }

  // Total must meet minimum
  const totalMet = requiredMet + optionalMet;
  const matches = totalMet >= recipe.minMatch;

  return {
    matches,
    requiredMet,
    optionalMet,
    totalMet,
    metConditions
  };
}

/**
 * Calculates priority for a possible moment
 */
function calculatePriority(match, recipe) {
  let priority = 0;

  // Base priority from conditions met
  priority += match.totalMet * 10;

  // Intensity bonus
  const intensityBonus = {
    [INTENSITY.SUBTLE]: 5,
    [INTENSITY.NOTABLE]: 15,
    [INTENSITY.SIGNIFICANT]: 25,
    [INTENSITY.TRANSCENDENT]: 40
  };
  priority += intensityBonus[recipe.intensity] || 10;

  // Rarity bonus (higher cooldown = rarer = higher priority when available)
  priority += recipe.cooldown * 2;

  return priority;
}

/**
 * Triggers a moment (marks as happened)
 */
export function triggerMoment(system, momentType, details = {}) {
  const recipe = system.recipes.find(r => r.momentType === momentType);
  if (!recipe) return null;

  const moment = {
    type: momentType,
    intensity: recipe.intensity,
    description: recipe.description,
    details,
    conditions: Array.from(system.activeConditions),
    triggeredAt: Date.now()
  };

  system.triggeredMoments.push(moment);
  system.momentsThisSession++;
  system.cooldown = recipe.cooldown;

  // Update stats
  system.stats.momentsTriggered++;
  system.stats.byType[momentType] = (system.stats.byType[momentType] || 0) + 1;

  return moment;
}

/**
 * Gets suggestions for emergent moments
 */
export function getMomentSuggestions(system, maxSuggestions = 3) {
  const possible = checkForMoments(system);

  return possible.slice(0, maxSuggestions).map(p => ({
    type: p.recipe.momentType,
    intensity: p.recipe.intensity,
    description: p.recipe.description,
    conditionsMet: p.match.metConditions,
    priority: p.priority
  }));
}

/**
 * Gets the best moment opportunity right now
 */
export function getBestMomentOpportunity(system) {
  const possible = checkForMoments(system);
  if (possible.length === 0) return null;

  return {
    type: possible[0].recipe.momentType,
    intensity: possible[0].recipe.intensity,
    description: possible[0].recipe.description,
    shouldTrigger: possible[0].priority >= 50
  };
}

/**
 * Gets context for AI prompting
 */
export function getEmergentContext(system) {
  const suggestions = getMomentSuggestions(system);

  return {
    activeConditions: Array.from(system.activeConditions),
    possibleMoments: suggestions,
    recentMoments: system.triggeredMoments.slice(-3).map(m => ({
      type: m.type,
      intensity: m.intensity
    })),
    onCooldown: system.cooldown > 0,
    cooldownRemaining: system.cooldown
  };
}

/**
 * Adds a custom recipe
 */
export function addCustomRecipe(system, recipe) {
  const fullRecipe = {
    momentType: recipe.momentType,
    requiredConditions: recipe.requiredConditions || [],
    optionalConditions: recipe.optionalConditions || [],
    minMatch: recipe.minMatch || 2,
    intensity: recipe.intensity || INTENSITY.NOTABLE,
    cooldown: recipe.cooldown || 5,
    description: recipe.description || 'Custom moment'
  };

  system.recipes.push(fullRecipe);
  return fullRecipe;
}

/**
 * Checks if a specific moment type is possible
 */
export function isMomentPossible(system, momentType) {
  const recipe = system.recipes.find(r => r.momentType === momentType);
  if (!recipe) return false;

  const match = checkRecipeMatch(system, recipe);
  return match.matches;
}

/**
 * Gets history of triggered moments
 */
export function getMomentHistory(system, limit = 10) {
  return system.triggeredMoments
    .slice(-limit)
    .reverse()
    .map(m => ({
      type: m.type,
      intensity: m.intensity,
      when: m.triggeredAt
    }));
}

/**
 * Resets cooldown (for scene transitions, etc.)
 */
export function resetCooldown(system) {
  system.cooldown = 0;
}

/**
 * Serializes system for storage
 */
export function serializeEmergent(system) {
  return JSON.stringify({
    triggeredMoments: system.triggeredMoments.slice(-20),
    momentsThisSession: system.momentsThisSession,
    stats: system.stats
  });
}

/**
 * Deserializes system from storage
 */
export function deserializeEmergent(data) {
  try {
    const parsed = JSON.parse(data);
    const system = createEmergentSystem();

    system.triggeredMoments = parsed.triggeredMoments || [];
    system.momentsThisSession = parsed.momentsThisSession || 0;
    system.stats = parsed.stats || system.stats;

    return system;
  } catch {
    return null;
  }
}

export default {
  createEmergentSystem,
  setCondition,
  updateConditionsFromContext,
  checkForMoments,
  triggerMoment,
  getMomentSuggestions,
  getBestMomentOpportunity,
  getEmergentContext,
  addCustomRecipe,
  isMomentPossible,
  getMomentHistory,
  resetCooldown,
  serializeEmergent,
  deserializeEmergent,
  MOMENT_TYPES,
  CONDITIONS,
  INTENSITY
};
