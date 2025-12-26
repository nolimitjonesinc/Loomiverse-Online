/**
 * HiddenThreads - Subtle Through-Lines
 *
 * This system tracks narrative threads that might not be
 * obvious yet but can become significant. It's the seed
 * planted in chapter one that blooms in chapter ten.
 *
 * It handles:
 * - Thread detection (patterns in reader/character choices)
 * - Thread weaving (connecting disparate elements)
 * - Revelation timing (when to surface a thread)
 * - Chekhov's gun management (introduced elements)
 * - Foreshadowing opportunities
 *
 * Design Philosophy:
 * - The best twists are obvious in hindsight
 * - Not every thread needs to resolve
 * - Some threads are character-driven, some are plot-driven
 * - The reader should feel smart when they notice
 * - Patience makes the payoff better
 */

// Thread types
export const THREAD_TYPES = {
  // Plot threads
  MYSTERY: 'mystery',               // Unanswered question
  CHEKHOV: 'chekhov',               // Introduced element to return
  FORESHADOWING: 'foreshadowing',   // Hints at future
  PARALLEL: 'parallel',             // Echoing structure
  IRONY: 'irony',                   // Setup for ironic payoff

  // Character threads
  SECRET: 'secret',                 // Hidden information
  UNSPOKEN: 'unspoken',             // What's not being said
  PATTERN: 'pattern',               // Recurring behavior
  GROWTH: 'growth',                 // Character arc thread
  RELATIONSHIP: 'relationship',     // Developing dynamic

  // Thematic threads
  MOTIF: 'motif',                   // Recurring image/symbol
  THEME: 'theme',                   // Thematic through-line
  CONTRAST: 'contrast'              // Opposing elements
};

// Thread states
export const THREAD_STATES = {
  DORMANT: 'dormant',       // Planted but not active
  ACTIVE: 'active',         // Currently relevant
  BUILDING: 'building',     // Accumulating significance
  RIPE: 'ripe',             // Ready for revelation
  REVEALED: 'revealed',     // Surfaced to reader
  RESOLVED: 'resolved',     // Concluded
  ABANDONED: 'abandoned'    // Didn't pan out
};

// Revelation styles
export const REVELATION_STYLES = {
  SUDDEN: 'sudden',         // Dramatic reveal
  GRADUAL: 'gradual',       // Slow dawning
  CALLBACK: 'callback',     // Reference to earlier
  ECHO: 'echo',             // Structural parallel
  INVERSION: 'inversion',   // Expectation subverted
  CONFIRMATION: 'confirmation' // Reader's suspicion confirmed
};

/**
 * Creates the hidden threads system
 */
export function createHiddenThreads() {
  return {
    // All threads
    threads: [],

    // Connections between threads
    connections: [],

    // Elements that have been introduced (Chekhov's inventory)
    introducedElements: [],

    // Patterns detected
    patterns: [],

    // Ready for revelation
    ripeQueue: [],

    // Stats
    stats: {
      threadsCreated: 0,
      threadsRevealed: 0,
      connectionsMade: 0
    }
  };
}

/**
 * Creates a new thread
 */
export function createThread(data) {
  const {
    type,
    content,
    elements = [],      // What's involved
    significance = 50,  // How important (0-100)
    patience = 5,       // Exchanges before can ripen
    characters = [],    // Characters involved
    hint = null         // Optional hint for foreshadowing
  } = data;

  return {
    id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type,
    content,
    elements,
    significance,
    patience,
    characters,
    hint,

    state: THREAD_STATES.DORMANT,
    mentions: 0,
    lastMentioned: null,
    createdAt: Date.now(),

    // Building progress
    buildProgress: 0,   // 0-100
    buildMoments: [],   // Moments that built this

    // Revelation tracking
    revealedAt: null,
    revelationStyle: null
  };
}

/**
 * Adds a thread to the system
 */
export function addThread(system, thread) {
  system.threads.push(thread);
  system.stats.threadsCreated++;

  // Add to introduced elements if Chekhov type
  if (thread.type === THREAD_TYPES.CHEKHOV) {
    thread.elements.forEach(element => {
      if (!system.introducedElements.some(e => e.name === element)) {
        system.introducedElements.push({
          name: element,
          threadId: thread.id,
          introducedAt: Date.now(),
          used: false
        });
      }
    });
  }

  return thread;
}

/**
 * Mentions/touches a thread (builds it)
 */
export function touchThread(system, threadId, context = {}) {
  const thread = system.threads.find(t => t.id === threadId);
  if (!thread) return null;

  thread.mentions++;
  thread.lastMentioned = Date.now();

  // Build progress based on context quality
  const buildAmount = context.significant ? 25 : 10;
  thread.buildProgress = Math.min(100, thread.buildProgress + buildAmount);

  // Record build moment
  thread.buildMoments.push({
    context: context.summary || 'mentioned',
    timestamp: Date.now()
  });

  // Update state
  if (thread.state === THREAD_STATES.DORMANT) {
    thread.state = THREAD_STATES.ACTIVE;
  }
  if (thread.buildProgress >= 75) {
    thread.state = THREAD_STATES.BUILDING;
  }

  // Check if ripe
  const ageExchanges = context.exchangesSinceCreation || thread.mentions;
  if (thread.buildProgress >= 100 && ageExchanges >= thread.patience) {
    thread.state = THREAD_STATES.RIPE;
    if (!system.ripeQueue.some(t => t.id === threadId)) {
      system.ripeQueue.push(thread);
    }
  }

  return thread;
}

/**
 * Reveals a thread
 */
export function revealThread(system, threadId, style = REVELATION_STYLES.GRADUAL) {
  const thread = system.threads.find(t => t.id === threadId);
  if (!thread) return null;

  thread.state = THREAD_STATES.REVEALED;
  thread.revealedAt = Date.now();
  thread.revelationStyle = style;

  // Remove from ripe queue
  system.ripeQueue = system.ripeQueue.filter(t => t.id !== threadId);

  system.stats.threadsRevealed++;

  return thread;
}

/**
 * Resolves a thread (complete conclusion)
 */
export function resolveThread(system, threadId, resolution) {
  const thread = system.threads.find(t => t.id === threadId);
  if (!thread) return null;

  thread.state = THREAD_STATES.RESOLVED;
  thread.resolution = resolution;
  thread.resolvedAt = Date.now();

  // Mark Chekhov elements as used
  thread.elements.forEach(element => {
    const introduced = system.introducedElements.find(e => e.name === element);
    if (introduced) introduced.used = true;
  });

  return thread;
}

/**
 * Abandons a thread (didn't work out)
 */
export function abandonThread(system, threadId) {
  const thread = system.threads.find(t => t.id === threadId);
  if (!thread) return null;

  thread.state = THREAD_STATES.ABANDONED;
  system.ripeQueue = system.ripeQueue.filter(t => t.id !== threadId);

  return thread;
}

/**
 * Connects two threads
 */
export function connectThreads(system, threadId1, threadId2, connectionType) {
  const thread1 = system.threads.find(t => t.id === threadId1);
  const thread2 = system.threads.find(t => t.id === threadId2);

  if (!thread1 || !thread2) return null;

  const connection = {
    id: `conn_${Date.now()}`,
    thread1Id: threadId1,
    thread2Id: threadId2,
    type: connectionType,
    createdAt: Date.now()
  };

  system.connections.push(connection);
  system.stats.connectionsMade++;

  // Boost both threads
  touchThread(system, threadId1, { significant: true });
  touchThread(system, threadId2, { significant: true });

  return connection;
}

/**
 * Detects potential threads from content
 */
export function detectPotentialThreads(system, content, context = {}) {
  const potentials = [];

  // Check for mystery setup (questions, uncertainty)
  const mysterySignals = /\b(wonder|mysterious|strange|curious|why|how did|what if|secret)\b/i;
  if (mysterySignals.test(content)) {
    potentials.push({
      type: THREAD_TYPES.MYSTERY,
      content: content.substring(0, 100),
      significance: 60
    });
  }

  // Check for foreshadowing language
  const foreshadowSignals = /\b(little did|would soon|someday|eventually|one day|if only)\b/i;
  if (foreshadowSignals.test(content)) {
    potentials.push({
      type: THREAD_TYPES.FORESHADOWING,
      content: content.substring(0, 100),
      significance: 70
    });
  }

  // Check for introduced objects/elements (Chekhov's gun)
  const objectSignals = /\b(noticed|picked up|found|discovered|carried|kept|had always)\b.*\b(a|an|the)\s+(\w+)/i;
  const objectMatch = content.match(objectSignals);
  if (objectMatch) {
    potentials.push({
      type: THREAD_TYPES.CHEKHOV,
      content: objectMatch[0],
      elements: [objectMatch[3]],
      significance: 50
    });
  }

  // Check for unspoken subtext
  const unspokenSignals = /\b(didn't say|left unsaid|wanted to say|almost said|swallowed|bit back)\b/i;
  if (unspokenSignals.test(content)) {
    potentials.push({
      type: THREAD_TYPES.UNSPOKEN,
      content: content.substring(0, 100),
      significance: 55
    });
  }

  // Check for recurring patterns (need history context)
  if (context.recentContent) {
    // Simple pattern detection - same words/concepts appearing
    const words = content.toLowerCase().split(/\s+/);
    const recentWords = context.recentContent.toLowerCase().split(/\s+/);
    const significantWords = words.filter(w =>
      w.length > 5 && recentWords.includes(w)
    );

    if (significantWords.length >= 2) {
      potentials.push({
        type: THREAD_TYPES.PATTERN,
        content: `Recurring: ${significantWords.join(', ')}`,
        elements: significantWords,
        significance: 45
      });
    }
  }

  return potentials;
}

/**
 * Gets threads that are ripe for revelation
 */
export function getRipeThreads(system) {
  return system.ripeQueue.sort((a, b) => b.significance - a.significance);
}

/**
 * Gets active threads involving a character
 */
export function getCharacterThreads(system, characterName) {
  return system.threads.filter(t =>
    t.characters.includes(characterName) &&
    ![THREAD_STATES.RESOLVED, THREAD_STATES.ABANDONED].includes(t.state)
  );
}

/**
 * Gets unused Chekhov elements (introduced but not used)
 */
export function getUnusedElements(system) {
  return system.introducedElements.filter(e => !e.used);
}

/**
 * Gets foreshadowing opportunities
 */
export function getForeshadowingOpportunities(system, currentContext = {}) {
  const opportunities = [];

  // Ripe threads can be hinted at
  for (const thread of system.ripeQueue) {
    if (thread.hint) {
      opportunities.push({
        threadId: thread.id,
        hint: thread.hint,
        significance: thread.significance
      });
    }
  }

  // Building threads can be subtly mentioned
  const buildingThreads = system.threads.filter(t =>
    t.state === THREAD_STATES.BUILDING && t.buildProgress >= 50
  );
  for (const thread of buildingThreads) {
    opportunities.push({
      threadId: thread.id,
      hint: thread.elements[0] || thread.content.substring(0, 30),
      significance: thread.significance * 0.7
    });
  }

  // Unused Chekhov elements should appear
  const unusedAge = 5 * 60000; // 5 minutes
  const oldUnused = system.introducedElements.filter(e =>
    !e.used && (Date.now() - e.introducedAt) > unusedAge
  );
  for (const element of oldUnused) {
    opportunities.push({
      element: element.name,
      threadId: element.threadId,
      hint: `The ${element.name} was still there`,
      significance: 40
    });
  }

  return opportunities.sort((a, b) => b.significance - a.significance);
}

/**
 * Gets thread context for AI prompting
 */
export function getThreadContext(system, maxThreads = 5) {
  const context = {
    activeThreads: [],
    ripeForRevelation: [],
    foreshadowingOpportunities: [],
    unusedElements: []
  };

  // Active threads (excluding dormant)
  const active = system.threads
    .filter(t => ![THREAD_STATES.DORMANT, THREAD_STATES.RESOLVED, THREAD_STATES.ABANDONED].includes(t.state))
    .sort((a, b) => b.buildProgress - a.buildProgress)
    .slice(0, maxThreads);

  context.activeThreads = active.map(t => ({
    type: t.type,
    summary: t.content.substring(0, 50),
    progress: t.buildProgress,
    characters: t.characters,
    isRipe: t.state === THREAD_STATES.RIPE
  }));

  // Ripe threads
  context.ripeForRevelation = system.ripeQueue.slice(0, 3).map(t => ({
    type: t.type,
    summary: t.content.substring(0, 50),
    significance: t.significance
  }));

  // Foreshadowing
  context.foreshadowingOpportunities = getForeshadowingOpportunities(system)
    .slice(0, 3)
    .map(o => o.hint);

  // Unused elements
  context.unusedElements = getUnusedElements(system).map(e => e.name);

  return context;
}

/**
 * Cleans up old threads
 */
export function cleanupThreads(system) {
  const now = Date.now();
  const maxAge = 60 * 60000; // 60 minutes

  // Abandon threads that have been dormant too long
  system.threads.forEach(t => {
    if (t.state === THREAD_STATES.DORMANT) {
      const age = now - t.createdAt;
      if (age > maxAge && t.mentions === 0) {
        t.state = THREAD_STATES.ABANDONED;
      }
    }
  });

  // Remove very old resolved/abandoned threads
  const maxResolvedAge = 2 * 60 * 60000; // 2 hours
  system.threads = system.threads.filter(t => {
    if (t.state === THREAD_STATES.RESOLVED && t.resolvedAt) {
      return (now - t.resolvedAt) < maxResolvedAge;
    }
    if (t.state === THREAD_STATES.ABANDONED) {
      return (now - t.createdAt) < maxAge;
    }
    return true;
  });
}

/**
 * Calculates revelation timing
 */
export function calculateRevelationTiming(thread, context = {}) {
  // Factors that affect when to reveal
  let score = 0;

  // Thread is ripe
  if (thread.state === THREAD_STATES.RIPE) score += 40;

  // High significance
  score += thread.significance * 0.3;

  // Been building well
  score += thread.buildProgress * 0.2;

  // Not too recent
  const ageMinutes = (Date.now() - thread.createdAt) / 60000;
  if (ageMinutes > 10) score += 10;
  if (ageMinutes > 30) score += 10;

  // Context factors
  if (context.highTension) score += 15;
  if (context.emotionalMoment) score += 20;
  if (context.sceneClimaxing) score += 25;
  if (context.breathMoment) score -= 20; // Don't reveal during calm

  return {
    readyToReveal: score >= 70,
    score,
    recommendedStyle: score >= 90 ? REVELATION_STYLES.SUDDEN
                    : score >= 80 ? REVELATION_STYLES.CONFIRMATION
                    : REVELATION_STYLES.GRADUAL
  };
}

/**
 * Serializes threads for storage
 */
export function serializeThreads(system) {
  return JSON.stringify({
    threads: system.threads,
    connections: system.connections,
    introducedElements: system.introducedElements,
    patterns: system.patterns,
    stats: system.stats
  });
}

/**
 * Deserializes threads from storage
 */
export function deserializeThreads(data) {
  try {
    const parsed = JSON.parse(data);
    const system = createHiddenThreads();

    system.threads = parsed.threads || [];
    system.connections = parsed.connections || [];
    system.introducedElements = parsed.introducedElements || [];
    system.patterns = parsed.patterns || [];
    system.stats = parsed.stats || system.stats;

    // Rebuild ripe queue
    system.ripeQueue = system.threads.filter(t => t.state === THREAD_STATES.RIPE);

    return system;
  } catch {
    return null;
  }
}

export default {
  createHiddenThreads,
  createThread,
  addThread,
  touchThread,
  revealThread,
  resolveThread,
  abandonThread,
  connectThreads,
  detectPotentialThreads,
  getRipeThreads,
  getCharacterThreads,
  getUnusedElements,
  getForeshadowingOpportunities,
  getThreadContext,
  cleanupThreads,
  calculateRevelationTiming,
  serializeThreads,
  deserializeThreads,
  THREAD_TYPES,
  THREAD_STATES,
  REVELATION_STYLES
};
