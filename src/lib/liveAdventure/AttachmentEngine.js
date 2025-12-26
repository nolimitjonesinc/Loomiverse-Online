/**
 * AttachmentEngine - Building Bonds That Matter
 *
 * This system tracks and develops emotional connections between
 * the reader and story characters. It understands:
 * - How bonds form and deepen
 * - What strengthens vs. strains relationships
 * - The difference between trust, affection, and familiarity
 * - When relationships reach meaningful thresholds
 *
 * Design Philosophy:
 * - Attachment is earned, not assigned
 * - Small moments matter as much as big ones
 * - Relationships have texture, not just numbers
 * - Characters should feel like they care back
 * - Some bonds form quickly, others need time
 */

// Attachment styles (how the reader tends to bond)
export const ATTACHMENT_STYLES = {
  SECURE: 'secure',           // Comfortable with closeness, trusts easily
  CAUTIOUS: 'cautious',       // Needs time, values consistency
  GUARDED: 'guarded',         // Slow to trust, protects self
  EAGER: 'eager',             // Quick to attach, seeks connection
  SELECTIVE: 'selective'      // Bonds deeply but with few
};

// Bond types
export const BOND_TYPES = {
  TRUST: 'trust',             // Reliability, honesty, dependability
  AFFECTION: 'affection',     // Warmth, caring, fondness
  RESPECT: 'respect',         // Admiration, esteem
  INTIMACY: 'intimacy',       // Emotional closeness, vulnerability
  LOYALTY: 'loyalty',         // Commitment, dedication
  TENSION: 'tension'          // Conflict, unresolved issues (negative)
};

// Relationship milestones
export const MILESTONES = {
  FIRST_MEETING: 'first_meeting',
  FIRST_LAUGH: 'first_laugh',
  FIRST_CONFLICT: 'first_conflict',
  FIRST_TRUST: 'first_trust',
  SHARED_SECRET: 'shared_secret',
  PROTECTED_EACH_OTHER: 'protected_each_other',
  VULNERABLE_MOMENT: 'vulnerable_moment',
  FORGIVENESS: 'forgiveness',
  DEEP_CONVERSATION: 'deep_conversation',
  CRISIS_TOGETHER: 'crisis_together'
};

// Interaction impact levels
export const IMPACT_LEVELS = {
  TRIVIAL: 0.5,
  MINOR: 1,
  MODERATE: 2,
  SIGNIFICANT: 4,
  MAJOR: 8,
  PROFOUND: 15
};

/**
 * Creates a new attachment bond with a character
 */
export function createBond(characterId, characterName) {
  return {
    characterId,
    characterName,
    createdAt: Date.now(),

    // Core bond dimensions
    dimensions: {
      [BOND_TYPES.TRUST]: 50,       // 0-100
      [BOND_TYPES.AFFECTION]: 50,
      [BOND_TYPES.RESPECT]: 50,
      [BOND_TYPES.INTIMACY]: 30,    // Starts lower - must be earned
      [BOND_TYPES.LOYALTY]: 40,     // Builds over time
      [BOND_TYPES.TENSION]: 0       // Starts at 0
    },

    // Composite scores
    overallBond: 50,
    bondStrength: 'acquaintance', // acquaintance, friendly, close, bonded, profound

    // Interaction history
    interactionCount: 0,
    positiveInteractions: 0,
    negativeInteractions: 0,
    lastInteraction: null,

    // Milestones achieved
    milestones: {},  // { milestone: { achieved: true, timestamp, context } }

    // Memorable moments
    memories: [],    // Significant shared experiences

    // Current state
    currentDynamic: 'neutral', // positive, neutral, strained, conflicted
    unresolvedIssues: [],      // Things that need to be addressed

    // Character's feelings toward reader (reciprocal)
    characterFeels: {
      trust: 50,
      affection: 50,
      interest: 50
    }
  };
}

/**
 * Creates an Attachment Engine instance
 */
export function createAttachmentEngine() {
  return {
    bonds: {},                    // { characterId: bond }
    readerAttachmentStyle: ATTACHMENT_STYLES.SECURE,
    totalBondsFormed: 0,
    deepestBond: null,           // Character with strongest connection
    bondHistory: []              // Timeline of bond changes
  };
}

/**
 * Records an interaction and updates the bond
 */
export function recordInteraction(engine, characterId, interaction) {
  // Create bond if doesn't exist
  if (!engine.bonds[characterId]) {
    engine.bonds[characterId] = createBond(characterId, interaction.characterName || characterId);
    engine.totalBondsFormed++;
  }

  const bond = engine.bonds[characterId];
  bond.interactionCount++;
  bond.lastInteraction = Date.now();

  // Calculate impact multiplier based on reader's attachment style
  const styleMultiplier = getStyleMultiplier(engine.readerAttachmentStyle, interaction.type);

  // Apply interaction effects
  const effects = calculateInteractionEffects(interaction, styleMultiplier);

  // Update dimensions
  for (const [dimension, change] of Object.entries(effects.dimensionChanges)) {
    if (bond.dimensions[dimension] !== undefined) {
      bond.dimensions[dimension] = clamp(
        bond.dimensions[dimension] + change,
        0, 100
      );
    }
  }

  // Track positive/negative
  if (effects.valence > 0) {
    bond.positiveInteractions++;
  } else if (effects.valence < 0) {
    bond.negativeInteractions++;
  }

  // Check for milestone achievements
  checkMilestones(bond, interaction, effects);

  // Add to memories if significant
  if (effects.memorable) {
    bond.memories.push({
      summary: interaction.summary || interaction.type,
      timestamp: Date.now(),
      emotionalTone: effects.emotionalTone,
      impact: effects.impactLevel
    });
    // Keep bounded
    if (bond.memories.length > 20) {
      bond.memories = bond.memories.slice(-15);
    }
  }

  // Update composite scores
  updateCompositeScores(bond);

  // Update character's reciprocal feelings
  updateCharacterFeelings(bond, interaction, effects);

  // Update engine-level tracking
  updateDeepestBond(engine);

  // Record in history
  engine.bondHistory.push({
    characterId,
    interaction: interaction.type,
    timestamp: Date.now(),
    bondChange: effects.valence
  });
  if (engine.bondHistory.length > 100) {
    engine.bondHistory = engine.bondHistory.slice(-80);
  }

  return { bond, effects };
}

/**
 * Gets multiplier based on reader's attachment style
 */
function getStyleMultiplier(style, interactionType) {
  const multipliers = {
    [ATTACHMENT_STYLES.SECURE]: { positive: 1.0, negative: 0.8 },
    [ATTACHMENT_STYLES.CAUTIOUS]: { positive: 0.7, negative: 1.2 },
    [ATTACHMENT_STYLES.GUARDED]: { positive: 0.5, negative: 1.5 },
    [ATTACHMENT_STYLES.EAGER]: { positive: 1.5, negative: 0.6 },
    [ATTACHMENT_STYLES.SELECTIVE]: { positive: 1.2, negative: 1.0 }
  };

  const styleMultiplier = multipliers[style] || multipliers[ATTACHMENT_STYLES.SECURE];
  return interactionType === 'positive' ? styleMultiplier.positive : styleMultiplier.negative;
}

/**
 * Calculates the effects of an interaction
 */
function calculateInteractionEffects(interaction, styleMultiplier) {
  const { type, context, intensity = 'moderate' } = interaction;

  // Base impact
  const impactLevel = IMPACT_LEVELS[intensity.toUpperCase()] || IMPACT_LEVELS.MODERATE;
  const adjustedImpact = impactLevel * styleMultiplier;

  // Default dimension changes
  const dimensionChanges = {};
  let valence = 0;
  let emotionalTone = 'neutral';
  let memorable = false;

  // Interaction type effects
  switch (type) {
    case 'helped':
    case 'saved':
    case 'protected':
      dimensionChanges[BOND_TYPES.TRUST] = adjustedImpact * 1.5;
      dimensionChanges[BOND_TYPES.AFFECTION] = adjustedImpact;
      dimensionChanges[BOND_TYPES.LOYALTY] = adjustedImpact;
      dimensionChanges[BOND_TYPES.TENSION] = -adjustedImpact;
      valence = adjustedImpact;
      emotionalTone = 'grateful';
      memorable = impactLevel >= IMPACT_LEVELS.SIGNIFICANT;
      break;

    case 'shared_secret':
    case 'vulnerable_moment':
    case 'opened_up':
      dimensionChanges[BOND_TYPES.INTIMACY] = adjustedImpact * 2;
      dimensionChanges[BOND_TYPES.TRUST] = adjustedImpact;
      dimensionChanges[BOND_TYPES.AFFECTION] = adjustedImpact * 0.5;
      valence = adjustedImpact;
      emotionalTone = 'intimate';
      memorable = true;
      break;

    case 'laughed_together':
    case 'shared_joy':
      dimensionChanges[BOND_TYPES.AFFECTION] = adjustedImpact * 1.5;
      dimensionChanges[BOND_TYPES.TENSION] = -adjustedImpact * 0.5;
      valence = adjustedImpact;
      emotionalTone = 'joyful';
      memorable = impactLevel >= IMPACT_LEVELS.MODERATE;
      break;

    case 'disagreement':
    case 'conflict':
      dimensionChanges[BOND_TYPES.TENSION] = adjustedImpact * 1.5;
      dimensionChanges[BOND_TYPES.TRUST] = -adjustedImpact * 0.3;
      valence = -adjustedImpact * 0.5;
      emotionalTone = 'tense';
      memorable = impactLevel >= IMPACT_LEVELS.MODERATE;
      break;

    case 'betrayal':
    case 'lied':
      dimensionChanges[BOND_TYPES.TRUST] = -adjustedImpact * 3;
      dimensionChanges[BOND_TYPES.TENSION] = adjustedImpact * 2;
      dimensionChanges[BOND_TYPES.LOYALTY] = -adjustedImpact * 2;
      valence = -adjustedImpact * 2;
      emotionalTone = 'hurt';
      memorable = true;
      break;

    case 'forgave':
    case 'reconciled':
      dimensionChanges[BOND_TYPES.TRUST] = adjustedImpact;
      dimensionChanges[BOND_TYPES.TENSION] = -adjustedImpact * 2;
      dimensionChanges[BOND_TYPES.LOYALTY] = adjustedImpact * 1.5;
      dimensionChanges[BOND_TYPES.INTIMACY] = adjustedImpact;
      valence = adjustedImpact * 1.5;
      emotionalTone = 'healing';
      memorable = true;
      break;

    case 'impressed':
    case 'admired':
      dimensionChanges[BOND_TYPES.RESPECT] = adjustedImpact * 2;
      dimensionChanges[BOND_TYPES.AFFECTION] = adjustedImpact * 0.5;
      valence = adjustedImpact;
      emotionalTone = 'admiring';
      break;

    case 'disappointed':
      dimensionChanges[BOND_TYPES.RESPECT] = -adjustedImpact;
      dimensionChanges[BOND_TYPES.TRUST] = -adjustedImpact * 0.5;
      valence = -adjustedImpact;
      emotionalTone = 'disappointed';
      break;

    case 'casual_positive':
    case 'friendly':
      dimensionChanges[BOND_TYPES.AFFECTION] = adjustedImpact * 0.5;
      dimensionChanges[BOND_TYPES.TENSION] = -adjustedImpact * 0.2;
      valence = adjustedImpact * 0.5;
      emotionalTone = 'warm';
      break;

    case 'neutral':
    default:
      // Small familiarity boost
      dimensionChanges[BOND_TYPES.TRUST] = adjustedImpact * 0.1;
      valence = 0;
      emotionalTone = 'neutral';
      break;
  }

  return {
    dimensionChanges,
    valence,
    emotionalTone,
    memorable,
    impactLevel
  };
}

/**
 * Checks and records milestone achievements
 */
function checkMilestones(bond, interaction, effects) {
  const { type } = interaction;

  const milestoneChecks = {
    [MILESTONES.FIRST_MEETING]: bond.interactionCount === 1,
    [MILESTONES.FIRST_LAUGH]: type === 'laughed_together' && !bond.milestones[MILESTONES.FIRST_LAUGH],
    [MILESTONES.FIRST_CONFLICT]: (type === 'conflict' || type === 'disagreement') && !bond.milestones[MILESTONES.FIRST_CONFLICT],
    [MILESTONES.FIRST_TRUST]: bond.dimensions[BOND_TYPES.TRUST] >= 70 && !bond.milestones[MILESTONES.FIRST_TRUST],
    [MILESTONES.SHARED_SECRET]: type === 'shared_secret' && !bond.milestones[MILESTONES.SHARED_SECRET],
    [MILESTONES.PROTECTED_EACH_OTHER]: (type === 'protected' || type === 'saved') && !bond.milestones[MILESTONES.PROTECTED_EACH_OTHER],
    [MILESTONES.VULNERABLE_MOMENT]: type === 'vulnerable_moment' && !bond.milestones[MILESTONES.VULNERABLE_MOMENT],
    [MILESTONES.FORGIVENESS]: type === 'forgave' && !bond.milestones[MILESTONES.FORGIVENESS],
    [MILESTONES.DEEP_CONVERSATION]: type === 'opened_up' && !bond.milestones[MILESTONES.DEEP_CONVERSATION]
  };

  for (const [milestone, achieved] of Object.entries(milestoneChecks)) {
    if (achieved) {
      bond.milestones[milestone] = {
        achieved: true,
        timestamp: Date.now(),
        context: interaction.context || null
      };
    }
  }
}

/**
 * Updates composite bond scores
 */
function updateCompositeScores(bond) {
  const dims = bond.dimensions;

  // Calculate overall bond (weighted average)
  bond.overallBond = Math.round(
    (dims[BOND_TYPES.TRUST] * 0.25 +
     dims[BOND_TYPES.AFFECTION] * 0.25 +
     dims[BOND_TYPES.RESPECT] * 0.15 +
     dims[BOND_TYPES.INTIMACY] * 0.20 +
     dims[BOND_TYPES.LOYALTY] * 0.15) -
    (dims[BOND_TYPES.TENSION] * 0.2)
  );

  // Determine bond strength category
  if (bond.overallBond >= 85) {
    bond.bondStrength = 'profound';
  } else if (bond.overallBond >= 70) {
    bond.bondStrength = 'bonded';
  } else if (bond.overallBond >= 55) {
    bond.bondStrength = 'close';
  } else if (bond.overallBond >= 40) {
    bond.bondStrength = 'friendly';
  } else {
    bond.bondStrength = 'acquaintance';
  }

  // Determine current dynamic
  if (dims[BOND_TYPES.TENSION] >= 50) {
    bond.currentDynamic = 'conflicted';
  } else if (dims[BOND_TYPES.TENSION] >= 30) {
    bond.currentDynamic = 'strained';
  } else if (bond.overallBond >= 60) {
    bond.currentDynamic = 'positive';
  } else {
    bond.currentDynamic = 'neutral';
  }
}

/**
 * Updates character's reciprocal feelings
 */
function updateCharacterFeelings(bond, interaction, effects) {
  const feelings = bond.characterFeels;
  const valence = effects.valence;

  // Characters respond to how they're treated
  if (valence > 0) {
    feelings.trust = clamp(feelings.trust + valence * 0.3, 0, 100);
    feelings.affection = clamp(feelings.affection + valence * 0.4, 0, 100);
    feelings.interest = clamp(feelings.interest + valence * 0.2, 0, 100);
  } else if (valence < 0) {
    feelings.trust = clamp(feelings.trust + valence * 0.4, 0, 100);
    feelings.affection = clamp(feelings.affection + valence * 0.3, 0, 100);
    // Interest might actually increase with conflict
    feelings.interest = clamp(feelings.interest + Math.abs(valence) * 0.1, 0, 100);
  }
}

/**
 * Updates tracking of deepest bond
 */
function updateDeepestBond(engine) {
  let deepest = null;
  let highestBond = 0;

  for (const [charId, bond] of Object.entries(engine.bonds)) {
    if (bond.overallBond > highestBond) {
      highestBond = bond.overallBond;
      deepest = charId;
    }
  }

  engine.deepestBond = deepest;
}

/**
 * Gets the current bond with a character
 */
export function getBond(engine, characterId) {
  return engine.bonds[characterId] || null;
}

/**
 * Gets bond summary for AI context
 */
export function getBondSummary(bond) {
  if (!bond) return 'No prior relationship';

  const dims = bond.dimensions;
  const feels = bond.characterFeels;

  let summary = `Relationship: ${bond.bondStrength} (${bond.currentDynamic})`;

  if (dims[BOND_TYPES.TRUST] >= 70) summary += ', trusts deeply';
  else if (dims[BOND_TYPES.TRUST] <= 30) summary += ', wary/distrusting';

  if (dims[BOND_TYPES.AFFECTION] >= 70) summary += ', deep affection';
  if (dims[BOND_TYPES.INTIMACY] >= 60) summary += ', emotionally close';
  if (dims[BOND_TYPES.TENSION] >= 40) summary += ', tension present';

  // Milestones
  const milestoneCount = Object.keys(bond.milestones).length;
  if (milestoneCount > 3) summary += `, ${milestoneCount} shared milestones`;

  // Character's feelings
  if (feels.affection >= 70) summary += `. Character cares deeply for reader`;
  if (feels.trust <= 30) summary += `. Character is guarded`;

  return summary;
}

/**
 * Gets a list of shared memories with a character
 */
export function getSharedMemories(bond, limit = 5) {
  if (!bond || !bond.memories) return [];
  return bond.memories.slice(-limit);
}

/**
 * Checks if a milestone has been achieved
 */
export function hasMilestone(bond, milestone) {
  return bond?.milestones?.[milestone]?.achieved || false;
}

/**
 * Adds an unresolved issue to the relationship
 */
export function addUnresolvedIssue(engine, characterId, issue) {
  const bond = engine.bonds[characterId];
  if (!bond) return;

  bond.unresolvedIssues.push({
    issue,
    addedAt: Date.now()
  });

  // Keep bounded
  if (bond.unresolvedIssues.length > 5) {
    bond.unresolvedIssues = bond.unresolvedIssues.slice(-5);
  }
}

/**
 * Resolves an issue in the relationship
 */
export function resolveIssue(engine, characterId, issueIndex) {
  const bond = engine.bonds[characterId];
  if (!bond || !bond.unresolvedIssues[issueIndex]) return;

  bond.unresolvedIssues.splice(issueIndex, 1);

  // Resolving issues improves relationship
  bond.dimensions[BOND_TYPES.TENSION] = clamp(bond.dimensions[BOND_TYPES.TENSION] - 10, 0, 100);
  bond.dimensions[BOND_TYPES.TRUST] = clamp(bond.dimensions[BOND_TYPES.TRUST] + 5, 0, 100);

  updateCompositeScores(bond);
}

/**
 * Utility: clamp a value between min and max
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default {
  createAttachmentEngine,
  createBond,
  recordInteraction,
  getBond,
  getBondSummary,
  getSharedMemories,
  hasMilestone,
  addUnresolvedIssue,
  resolveIssue,
  ATTACHMENT_STYLES,
  BOND_TYPES,
  MILESTONES,
  IMPACT_LEVELS
};
