/**
 * ReaderProfile - Understanding Who's Reading
 *
 * This system learns about the reader over time:
 * - Reading pace preferences
 * - Emotional comfort zones and edges
 * - Genre affinities
 * - Response patterns
 * - What makes them engage vs. disengage
 *
 * Design Philosophy:
 * - Learn through observation, not interrogation
 * - Preferences are probabilistic, not absolute
 * - People grow and change - profiles should too
 * - Privacy first - this is about better storytelling, not surveillance
 * - The reader should feel understood, not analyzed
 */

// Emotional comfort levels
export const COMFORT_LEVELS = {
  AVOIDS: 'avoids',           // Reader consistently skips or exits
  UNCOMFORTABLE: 'uncomfortable', // Shows signs of discomfort
  NEUTRAL: 'neutral',         // Neither seeks nor avoids
  ENJOYS: 'enjoys',           // Engages positively
  SEEKS: 'seeks'              // Actively pursues this content
};

// Content elements we track preferences for
export const CONTENT_ELEMENTS = {
  // Emotional tones
  ROMANCE: 'romance',
  VIOLENCE: 'violence',
  HORROR: 'horror',
  HUMOR: 'humor',
  TRAGEDY: 'tragedy',
  HOPE: 'hope',
  DARKNESS: 'darkness',
  WHIMSY: 'whimsy',

  // Pacing
  FAST_ACTION: 'fast_action',
  SLOW_BURN: 'slow_burn',
  DIALOGUE_HEAVY: 'dialogue_heavy',
  DESCRIPTION_HEAVY: 'description_heavy',

  // Complexity
  MORAL_AMBIGUITY: 'moral_ambiguity',
  CLEAR_GOOD_EVIL: 'clear_good_evil',
  COMPLEX_PLOTS: 'complex_plots',
  SIMPLE_NARRATIVES: 'simple_narratives',

  // Intimacy
  VULNERABILITY: 'vulnerability',
  EMOTIONAL_DEPTH: 'emotional_depth',
  SURFACE_LEVEL: 'surface_level',

  // Themes
  REDEMPTION: 'redemption',
  JUSTICE: 'justice',
  LOVE: 'love',
  LOSS: 'loss',
  GROWTH: 'growth',
  MYSTERY: 'mystery'
};

// Response pattern types
export const RESPONSE_PATTERNS = {
  VERBOSE: 'verbose',         // Long, detailed responses
  TERSE: 'terse',             // Short, direct responses
  ACTION_ORIENTED: 'action_oriented',
  DIALOGUE_ORIENTED: 'dialogue_oriented',
  EMOTIONAL: 'emotional',
  ANALYTICAL: 'analytical',
  PLAYFUL: 'playful',
  SERIOUS: 'serious'
};

/**
 * Creates a new Reader Profile
 */
export function createReaderProfile(readerId = null) {
  return {
    id: readerId || `reader_${Date.now()}`,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),

    // Content preferences (learned over time)
    contentPreferences: Object.fromEntries(
      Object.values(CONTENT_ELEMENTS).map(element => [element, {
        level: COMFORT_LEVELS.NEUTRAL,
        confidence: 0,        // 0-100, how sure we are
        dataPoints: 0,        // How many observations
        lastObserved: null
      }])
    ),

    // Response patterns
    responsePatterns: {
      averageLength: 0,
      averageResponseTime: 0,   // milliseconds
      preferredStyle: null,     // Most common pattern
      styleDistribution: {},    // { pattern: count }
      totalResponses: 0
    },

    // Pacing preferences
    pacingPreferences: {
      preferredTension: 50,     // 0-100, where they seem most engaged
      tensionTolerance: 30,     // How much variation they enjoy
      breathMomentFrequency: 'moderate', // 'rare', 'moderate', 'frequent'
      sessionLength: 'medium',  // 'short', 'medium', 'long'
      averageSessionMinutes: 0
    },

    // Genre affinities
    genreAffinities: {},        // { genre: { played: n, completed: n, rating: 0-100 } }

    // Character preferences
    characterPreferences: {
      preferredArchetypes: [],  // Character types they gravitate toward
      avoidedArchetypes: [],    // Character types they disengage from
      attachmentSpeed: 'moderate', // 'slow', 'moderate', 'fast'
      preferredRelationshipDepth: 'medium' // 'surface', 'medium', 'deep'
    },

    // Engagement signals
    engagementSignals: {
      positiveIndicators: [],   // Things that increase engagement
      negativeIndicators: [],   // Things that decrease engagement
      exitPoints: [],           // Where they tend to stop
      returnPoints: []          // What brings them back
    },

    // Session history (last N sessions for learning)
    recentSessions: [],         // Bounded list of session summaries

    // Emotional journey preferences
    emotionalPreferences: {
      comfortWithIntensity: 50, // 0-100
      needsResolution: true,    // Prefers stories that resolve
      toleratesAmbiguity: false,
      seeksCatharsis: false
    }
  };
}

/**
 * Observes a reader response and updates the profile
 */
export function observeResponse(profile, response, context) {
  const now = Date.now();
  const updated = { ...profile, lastUpdated: new Date().toISOString() };

  // Update response patterns
  const responseLength = response.length;
  const patterns = updated.responsePatterns;

  patterns.totalResponses++;
  patterns.averageLength = (
    (patterns.averageLength * (patterns.totalResponses - 1) + responseLength) /
    patterns.totalResponses
  );

  // Detect response style
  const style = detectResponseStyle(response);
  patterns.styleDistribution[style] = (patterns.styleDistribution[style] || 0) + 1;

  // Update preferred style
  const maxCount = Math.max(...Object.values(patterns.styleDistribution));
  patterns.preferredStyle = Object.entries(patterns.styleDistribution)
    .find(([, count]) => count === maxCount)?.[0] || null;

  // Update response time if context provides it
  if (context?.responseTimeMs) {
    const oldTotal = patterns.averageResponseTime * (patterns.totalResponses - 1);
    patterns.averageResponseTime = (oldTotal + context.responseTimeMs) / patterns.totalResponses;
  }

  return updated;
}

/**
 * Observes engagement signals from the session
 */
export function observeEngagement(profile, signal, context) {
  const updated = { ...profile, lastUpdated: new Date().toISOString() };
  const signals = updated.engagementSignals;

  switch (signal.type) {
    case 'positive':
      signals.positiveIndicators.push({
        trigger: signal.trigger,
        context: context?.emotionalBeat,
        timestamp: Date.now()
      });
      // Keep bounded
      if (signals.positiveIndicators.length > 50) {
        signals.positiveIndicators = signals.positiveIndicators.slice(-40);
      }
      break;

    case 'negative':
      signals.negativeIndicators.push({
        trigger: signal.trigger,
        context: context?.emotionalBeat,
        timestamp: Date.now()
      });
      if (signals.negativeIndicators.length > 50) {
        signals.negativeIndicators = signals.negativeIndicators.slice(-40);
      }
      break;

    case 'exit':
      signals.exitPoints.push({
        reason: signal.reason,
        tension: context?.tension,
        beat: context?.emotionalBeat,
        timestamp: Date.now()
      });
      if (signals.exitPoints.length > 20) {
        signals.exitPoints = signals.exitPoints.slice(-15);
      }
      break;

    case 'return':
      signals.returnPoints.push({
        afterDays: signal.afterDays,
        timestamp: Date.now()
      });
      if (signals.returnPoints.length > 20) {
        signals.returnPoints = signals.returnPoints.slice(-15);
      }
      break;
  }

  return updated;
}

/**
 * Updates content preference based on observation
 */
export function updateContentPreference(profile, element, observation) {
  const updated = { ...profile, lastUpdated: new Date().toISOString() };
  const pref = updated.contentPreferences[element];

  if (!pref) return updated;

  pref.dataPoints++;
  pref.lastObserved = Date.now();

  // Adjust level based on observation
  const levelOrder = [
    COMFORT_LEVELS.AVOIDS,
    COMFORT_LEVELS.UNCOMFORTABLE,
    COMFORT_LEVELS.NEUTRAL,
    COMFORT_LEVELS.ENJOYS,
    COMFORT_LEVELS.SEEKS
  ];

  const currentIndex = levelOrder.indexOf(pref.level);

  switch (observation) {
    case 'engaged':
      // Move toward ENJOYS/SEEKS
      if (currentIndex < levelOrder.length - 1) {
        pref.level = levelOrder[Math.min(currentIndex + 1, levelOrder.length - 1)];
      }
      pref.confidence = Math.min(100, pref.confidence + 5);
      break;

    case 'neutral':
      // Stay or move toward neutral
      pref.confidence = Math.min(100, pref.confidence + 2);
      break;

    case 'disengaged':
      // Move toward UNCOMFORTABLE/AVOIDS
      if (currentIndex > 0) {
        pref.level = levelOrder[Math.max(currentIndex - 1, 0)];
      }
      pref.confidence = Math.min(100, pref.confidence + 5);
      break;

    case 'skipped':
      // Strong signal toward avoidance
      pref.level = COMFORT_LEVELS.AVOIDS;
      pref.confidence = Math.min(100, pref.confidence + 10);
      break;

    case 'sought':
      // Strong signal toward seeking
      pref.level = COMFORT_LEVELS.SEEKS;
      pref.confidence = Math.min(100, pref.confidence + 10);
      break;
  }

  return updated;
}

/**
 * Records a completed session for learning
 */
export function recordSession(profile, sessionSummary) {
  const updated = { ...profile, lastUpdated: new Date().toISOString() };

  // Add to recent sessions
  updated.recentSessions.push({
    ...sessionSummary,
    timestamp: Date.now()
  });

  // Keep bounded
  if (updated.recentSessions.length > 20) {
    updated.recentSessions = updated.recentSessions.slice(-15);
  }

  // Update pacing preferences from session
  if (sessionSummary.durationMinutes) {
    const pacing = updated.pacingPreferences;
    const sessions = updated.recentSessions.length;
    pacing.averageSessionMinutes = (
      (pacing.averageSessionMinutes * (sessions - 1) + sessionSummary.durationMinutes) /
      sessions
    );

    // Categorize session length preference
    if (pacing.averageSessionMinutes < 10) {
      pacing.sessionLength = 'short';
    } else if (pacing.averageSessionMinutes < 30) {
      pacing.sessionLength = 'medium';
    } else {
      pacing.sessionLength = 'long';
    }
  }

  // Update genre affinity
  if (sessionSummary.genre) {
    const affinity = updated.genreAffinities[sessionSummary.genre] || {
      played: 0, completed: 0, rating: 50
    };
    affinity.played++;
    if (sessionSummary.completed) affinity.completed++;
    if (sessionSummary.rating) {
      affinity.rating = Math.round(
        (affinity.rating * (affinity.played - 1) + sessionSummary.rating) / affinity.played
      );
    }
    updated.genreAffinities[sessionSummary.genre] = affinity;
  }

  return updated;
}

/**
 * Gets content recommendation based on profile
 */
export function getContentRecommendation(profile, element) {
  const pref = profile.contentPreferences[element];
  if (!pref || pref.confidence < 20) {
    return { include: true, intensity: 'moderate', confidence: 'low' };
  }

  switch (pref.level) {
    case COMFORT_LEVELS.SEEKS:
      return { include: true, intensity: 'high', confidence: pref.confidence > 60 ? 'high' : 'medium' };
    case COMFORT_LEVELS.ENJOYS:
      return { include: true, intensity: 'moderate', confidence: pref.confidence > 60 ? 'high' : 'medium' };
    case COMFORT_LEVELS.NEUTRAL:
      return { include: true, intensity: 'light', confidence: 'medium' };
    case COMFORT_LEVELS.UNCOMFORTABLE:
      return { include: false, intensity: 'none', confidence: pref.confidence > 60 ? 'high' : 'medium' };
    case COMFORT_LEVELS.AVOIDS:
      return { include: false, intensity: 'none', confidence: pref.confidence > 60 ? 'high' : 'medium' };
    default:
      return { include: true, intensity: 'moderate', confidence: 'low' };
  }
}

/**
 * Gets suggested pacing based on profile
 */
export function getSuggestedPacing(profile) {
  const pacing = profile.pacingPreferences;
  const patterns = profile.responsePatterns;

  return {
    targetTension: pacing.preferredTension,
    tensionRange: [
      Math.max(0, pacing.preferredTension - pacing.tensionTolerance),
      Math.min(100, pacing.preferredTension + pacing.tensionTolerance)
    ],
    breathFrequency: pacing.breathMomentFrequency,
    dialogueVsNarration: patterns.preferredStyle === RESPONSE_PATTERNS.DIALOGUE_ORIENTED
      ? 'dialogue-heavy' : 'balanced',
    expectedSessionLength: pacing.sessionLength
  };
}

/**
 * Detects the style of a response
 */
function detectResponseStyle(response) {
  const length = response.length;
  const hasAction = /^\*|I\s+(walk|go|move|run|take)/i.test(response);
  const hasDialogue = /^["']|I\s+(say|tell|ask)/i.test(response);
  const hasEmotion = /feel|heart|love|hate|scared|happy/i.test(response);
  const hasQuestion = /\?$/.test(response);
  const hasHumor = /haha|lol|😂|😄|\bfunny\b/i.test(response);

  if (length < 20) return RESPONSE_PATTERNS.TERSE;
  if (length > 150) return RESPONSE_PATTERNS.VERBOSE;
  if (hasAction) return RESPONSE_PATTERNS.ACTION_ORIENTED;
  if (hasDialogue) return RESPONSE_PATTERNS.DIALOGUE_ORIENTED;
  if (hasEmotion) return RESPONSE_PATTERNS.EMOTIONAL;
  if (hasQuestion) return RESPONSE_PATTERNS.ANALYTICAL;
  if (hasHumor) return RESPONSE_PATTERNS.PLAYFUL;

  return RESPONSE_PATTERNS.SERIOUS;
}

/**
 * Gets a summary of the reader's preferences for AI context
 */
export function getProfileSummary(profile) {
  const preferredElements = Object.entries(profile.contentPreferences)
    .filter(([, pref]) => pref.level === COMFORT_LEVELS.SEEKS || pref.level === COMFORT_LEVELS.ENJOYS)
    .filter(([, pref]) => pref.confidence > 40)
    .map(([element]) => element);

  const avoidedElements = Object.entries(profile.contentPreferences)
    .filter(([, pref]) => pref.level === COMFORT_LEVELS.AVOIDS || pref.level === COMFORT_LEVELS.UNCOMFORTABLE)
    .filter(([, pref]) => pref.confidence > 40)
    .map(([element]) => element);

  const topGenres = Object.entries(profile.genreAffinities)
    .sort((a, b) => b[1].rating - a[1].rating)
    .slice(0, 3)
    .map(([genre]) => genre);

  return {
    enjoys: preferredElements,
    avoids: avoidedElements,
    topGenres,
    responseStyle: profile.responsePatterns.preferredStyle,
    sessionLength: profile.pacingPreferences.sessionLength,
    tensionPreference: profile.pacingPreferences.preferredTension > 60
      ? 'high-tension' : profile.pacingPreferences.preferredTension < 40
      ? 'low-tension' : 'moderate-tension'
  };
}

/**
 * Serializes profile for storage
 */
export function serializeProfile(profile) {
  return JSON.stringify(profile);
}

/**
 * Deserializes profile from storage
 */
export function deserializeProfile(data) {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export default {
  createReaderProfile,
  observeResponse,
  observeEngagement,
  updateContentPreference,
  recordSession,
  getContentRecommendation,
  getSuggestedPacing,
  getProfileSummary,
  serializeProfile,
  deserializeProfile,
  COMFORT_LEVELS,
  CONTENT_ELEMENTS,
  RESPONSE_PATTERNS
};
