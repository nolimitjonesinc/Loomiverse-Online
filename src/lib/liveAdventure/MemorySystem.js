/**
 * MemorySystem - What Characters Remember
 *
 * This system gives characters memory - not just data storage,
 * but the kind of memory that makes relationships feel real.
 *
 * It tracks:
 * - What happened (events, conversations, revelations)
 * - How it felt (emotional coloring of memories)
 * - What it meant (significance to each character)
 * - Shared experiences (memories multiple characters have)
 * - Callbacks (moments that can be meaningfully referenced)
 *
 * Design Philosophy:
 * - Memory is subjective - same event, different meanings
 * - Some memories stick, most fade
 * - Emotional intensity cements memories
 * - Shared memories create bonds
 * - The best callbacks surprise the reader
 * - Characters should remember what matters
 */

// Memory types
export const MEMORY_TYPES = {
  // Dialogue memories
  CONVERSATION: 'conversation',     // What was said
  PROMISE: 'promise',               // Commitments made
  SECRET: 'secret',                 // Confidential information
  JOKE: 'joke',                     // Shared humor moments
  CONFESSION: 'confession',         // Vulnerable admissions

  // Action memories
  EVENT: 'event',                   // What happened
  CHOICE: 'choice',                 // Decisions reader made
  HELP: 'help',                     // Times someone helped
  HURT: 'hurt',                     // Times someone was hurt
  RESCUE: 'rescue',                 // Saved from danger

  // Emotional memories
  EMOTIONAL_PEAK: 'emotional_peak', // Intense feeling moments
  FIRST: 'first',                   // First time something happened
  TURNING_POINT: 'turning_point',   // Story direction changes

  // Sensory memories
  PLACE: 'place',                   // Location associations
  OBJECT: 'object',                 // Significant items
  SENSORY: 'sensory'                // Vivid sensory details
};

// Memory salience (how likely to be remembered)
export const SALIENCE = {
  FORGETTABLE: 1,     // Background noise
  MINOR: 2,           // Might remember
  NOTABLE: 3,         // Will likely remember
  SIGNIFICANT: 4,     // Definitely remembers
  UNFORGETTABLE: 5    // Core memory
};

// Emotional coloring of memories
export const MEMORY_VALENCE = {
  PAINFUL: 'painful',
  BITTERSWEET: 'bittersweet',
  NEUTRAL: 'neutral',
  WARM: 'warm',
  JOYFUL: 'joyful'
};

/**
 * Creates the memory system
 */
export function createMemorySystem() {
  return {
    // Individual character memories
    characterMemories: {},    // { characterId: [memories] }

    // Shared memories (multiple characters present)
    sharedMemories: [],       // [{ memory, witnesses: [ids] }]

    // Reader's memories (from their perspective)
    readerMemories: [],

    // Callback opportunities (memories ripe for reference)
    callbackQueue: [],

    // Memory triggers (what reminds of what)
    triggers: {},             // { trigger: [memoryIds] }

    // Recently accessed (for recency bias)
    recentlyAccessed: [],

    // Memory stats
    stats: {
      totalMemories: 0,
      callbacksUsed: 0,
      memoriesDecayed: 0
    }
  };
}

/**
 * Creates a new memory
 */
export function createMemory(data) {
  const {
    type,
    content,
    emotionalValence = MEMORY_VALENCE.NEUTRAL,
    salience = SALIENCE.NOTABLE,
    participants = [],
    location = null,
    trigger = null,
    context = {}
  } = data;

  return {
    id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type,
    content,                    // What happened (text description)
    emotionalValence,           // How it felt
    salience,                   // How memorable
    participants,               // Who was there
    location,                   // Where it happened
    trigger,                    // What might trigger recall
    context,                    // Additional context

    createdAt: Date.now(),
    lastAccessed: Date.now(),
    accessCount: 0,

    // Decay tracking
    currentSalience: salience,  // Can decay over time
    reinforcedCount: 0          // Times memory was reinforced
  };
}

/**
 * Stores a memory for a character
 */
export function storeMemory(system, characterId, memory) {
  if (!system.characterMemories[characterId]) {
    system.characterMemories[characterId] = [];
  }

  system.characterMemories[characterId].push(memory);
  system.stats.totalMemories++;

  // Add to trigger index
  if (memory.trigger) {
    if (!system.triggers[memory.trigger]) {
      system.triggers[memory.trigger] = [];
    }
    system.triggers[memory.trigger].push({
      memoryId: memory.id,
      characterId
    });
  }

  // Add participant triggers
  memory.participants.forEach(participant => {
    const trigger = `person:${participant}`;
    if (!system.triggers[trigger]) {
      system.triggers[trigger] = [];
    }
    system.triggers[trigger].push({
      memoryId: memory.id,
      characterId
    });
  });

  // Check if this is callback-worthy
  if (memory.salience >= SALIENCE.SIGNIFICANT) {
    addToCallbackQueue(system, memory, characterId);
  }

  // Keep bounded
  if (system.characterMemories[characterId].length > 100) {
    decayOldMemories(system, characterId);
  }

  return memory;
}

/**
 * Stores a shared memory (multiple characters witnessed it)
 */
export function storeSharedMemory(system, memory, witnesses) {
  system.sharedMemories.push({
    memory,
    witnesses: [...witnesses],
    createdAt: Date.now()
  });

  // Also store individual copies for each witness
  witnesses.forEach(characterId => {
    const personalCopy = { ...memory, sharedWith: witnesses.filter(w => w !== characterId) };
    storeMemory(system, characterId, personalCopy);
  });

  // Shared memories often make good callbacks
  addToCallbackQueue(system, memory, witnesses[0]);

  return memory;
}

/**
 * Stores a memory from the reader's perspective
 */
export function storeReaderMemory(system, memory) {
  system.readerMemories.push(memory);

  // Keep bounded
  if (system.readerMemories.length > 50) {
    system.readerMemories = system.readerMemories
      .sort((a, b) => b.currentSalience - a.currentSalience)
      .slice(0, 40);
  }

  return memory;
}

/**
 * Adds a memory to the callback queue
 */
function addToCallbackQueue(system, memory, characterId) {
  system.callbackQueue.push({
    memoryId: memory.id,
    characterId,
    memory,
    addedAt: Date.now(),
    priority: calculateCallbackPriority(memory)
  });

  // Keep queue bounded
  if (system.callbackQueue.length > 30) {
    system.callbackQueue = system.callbackQueue
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 25);
  }
}

/**
 * Calculates how good a memory would be as a callback
 */
function calculateCallbackPriority(memory) {
  let priority = memory.salience * 10;

  // Emotional memories make better callbacks
  if (memory.emotionalValence === MEMORY_VALENCE.PAINFUL ||
      memory.emotionalValence === MEMORY_VALENCE.JOYFUL) {
    priority += 20;
  }

  // Certain types are more callback-worthy
  const highPriorityTypes = [
    MEMORY_TYPES.PROMISE,
    MEMORY_TYPES.SECRET,
    MEMORY_TYPES.CONFESSION,
    MEMORY_TYPES.FIRST,
    MEMORY_TYPES.TURNING_POINT
  ];
  if (highPriorityTypes.includes(memory.type)) {
    priority += 15;
  }

  return priority;
}

/**
 * Retrieves relevant memories for a character
 */
export function getRelevantMemories(system, characterId, context) {
  const memories = system.characterMemories[characterId] || [];

  // Find memories triggered by context
  const triggered = [];

  // Check for person triggers
  if (context.mentionedCharacters) {
    context.mentionedCharacters.forEach(name => {
      const trigger = `person:${name}`;
      if (system.triggers[trigger]) {
        system.triggers[trigger]
          .filter(t => t.characterId === characterId)
          .forEach(t => {
            const mem = findMemoryById(system, characterId, t.memoryId);
            if (mem) triggered.push(mem);
          });
      }
    });
  }

  // Check for topic triggers
  if (context.topic) {
    if (system.triggers[context.topic]) {
      system.triggers[context.topic]
        .filter(t => t.characterId === characterId)
        .forEach(t => {
          const mem = findMemoryById(system, characterId, t.memoryId);
          if (mem) triggered.push(mem);
        });
    }
  }

  // Check for location triggers
  if (context.location) {
    const locationMemories = memories.filter(m =>
      m.location === context.location
    );
    triggered.push(...locationMemories);
  }

  // Add recent high-salience memories
  const recentImportant = memories
    .filter(m => m.currentSalience >= SALIENCE.SIGNIFICANT)
    .slice(-5);

  // Combine and deduplicate
  const all = [...triggered, ...recentImportant];
  const unique = all.filter((m, i, arr) =>
    arr.findIndex(x => x.id === m.id) === i
  );

  // Mark as accessed
  unique.forEach(m => {
    m.lastAccessed = Date.now();
    m.accessCount++;
  });

  // Update recently accessed
  system.recentlyAccessed = unique.map(m => m.id).slice(-10);

  return unique.slice(0, 5); // Return top 5 most relevant
}

/**
 * Finds a memory by ID
 */
function findMemoryById(system, characterId, memoryId) {
  const memories = system.characterMemories[characterId] || [];
  return memories.find(m => m.id === memoryId);
}

/**
 * Gets a callback opportunity
 */
export function getCallbackOpportunity(system, characterId, context = {}) {
  // Filter callbacks for this character
  const available = system.callbackQueue.filter(cb =>
    cb.characterId === characterId
  );

  if (available.length === 0) return null;

  // Check for contextual matches
  const contextual = available.filter(cb => {
    const mem = cb.memory;

    // Location match
    if (context.location && mem.location === context.location) {
      return true;
    }

    // Emotional match (similar valence)
    if (context.emotionalTone && mem.emotionalValence === context.emotionalTone) {
      return true;
    }

    // Enough time has passed (at least 5 minutes)
    const ageMinutes = (Date.now() - mem.createdAt) / 60000;
    if (ageMinutes >= 5 && ageMinutes <= 60) {
      return true;
    }

    return false;
  });

  // Return best contextual match, or highest priority if no context match
  const result = contextual.length > 0
    ? contextual.sort((a, b) => b.priority - a.priority)[0]
    : available.sort((a, b) => b.priority - a.priority)[0];

  return result?.memory || null;
}

/**
 * Uses a callback (removes from queue, reinforces memory)
 */
export function useCallback(system, memoryId, characterId) {
  // Remove from queue
  system.callbackQueue = system.callbackQueue.filter(cb =>
    cb.memoryId !== memoryId
  );

  // Reinforce the memory
  const mem = findMemoryById(system, characterId, memoryId);
  if (mem) {
    mem.reinforcedCount++;
    mem.currentSalience = Math.min(SALIENCE.UNFORGETTABLE, mem.currentSalience + 1);
    mem.lastAccessed = Date.now();
  }

  system.stats.callbacksUsed++;

  return mem;
}

/**
 * Decays old, unused memories
 */
function decayOldMemories(system, characterId) {
  const memories = system.characterMemories[characterId] || [];
  const now = Date.now();

  memories.forEach(mem => {
    const ageHours = (now - mem.createdAt) / 3600000;
    const hoursSinceAccess = (now - mem.lastAccessed) / 3600000;

    // Memories decay if old and not accessed
    if (ageHours > 24 && hoursSinceAccess > 12) {
      // But not if they're reinforced or unforgettable
      if (mem.reinforcedCount === 0 && mem.salience < SALIENCE.UNFORGETTABLE) {
        mem.currentSalience = Math.max(SALIENCE.FORGETTABLE, mem.currentSalience - 1);
      }
    }
  });

  // Remove forgettable memories that are old
  const beforeCount = memories.length;
  system.characterMemories[characterId] = memories.filter(m =>
    m.currentSalience > SALIENCE.FORGETTABLE ||
    (Date.now() - m.createdAt) < 3600000 // Keep memories less than 1 hour old
  );

  const removed = beforeCount - system.characterMemories[characterId].length;
  system.stats.memoriesDecayed += removed;
}

/**
 * Gets shared memories between characters
 */
export function getSharedMemoriesBetween(system, characterIds) {
  return system.sharedMemories.filter(sm =>
    characterIds.every(id => sm.witnesses.includes(id))
  ).map(sm => sm.memory);
}

/**
 * Checks if a character remembers something specific
 */
export function characterRemembers(system, characterId, searchTerm) {
  const memories = system.characterMemories[characterId] || [];

  return memories.some(m =>
    m.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.context?.keywords || []).some(k =>
      k.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
}

/**
 * Gets memory context for AI prompting
 */
export function getMemoryContext(system, characterId, limit = 5) {
  const memories = system.characterMemories[characterId] || [];

  // Get most significant recent memories
  const significant = memories
    .filter(m => m.currentSalience >= SALIENCE.NOTABLE)
    .sort((a, b) => {
      // Sort by combination of salience and recency
      const aScore = a.currentSalience * 10 + (1 / ((Date.now() - a.lastAccessed) / 3600000));
      const bScore = b.currentSalience * 10 + (1 / ((Date.now() - b.lastAccessed) / 3600000));
      return bScore - aScore;
    })
    .slice(0, limit);

  return significant.map(m => ({
    type: m.type,
    what: m.content,
    how: m.emotionalValence,
    importance: getSalienceLabel(m.currentSalience),
    sharedWith: m.sharedWith || []
  }));
}

/**
 * Gets salience as readable label
 */
function getSalienceLabel(salience) {
  switch (salience) {
    case SALIENCE.UNFORGETTABLE: return 'core memory';
    case SALIENCE.SIGNIFICANT: return 'important';
    case SALIENCE.NOTABLE: return 'remembers';
    case SALIENCE.MINOR: return 'vaguely recalls';
    default: return 'barely remembers';
  }
}

/**
 * Creates a promise memory (special type for tracking commitments)
 */
export function recordPromise(system, fromCharacter, toCharacter, promise, context = {}) {
  const memory = createMemory({
    type: MEMORY_TYPES.PROMISE,
    content: promise,
    emotionalValence: MEMORY_VALENCE.WARM,
    salience: SALIENCE.SIGNIFICANT,
    participants: [fromCharacter, toCharacter].filter(Boolean),
    trigger: 'promise',
    context: {
      ...context,
      promisedBy: fromCharacter,
      promisedTo: toCharacter,
      fulfilled: false,
      keywords: ['promise', 'commitment', promise.split(' ').slice(0, 3).join(' ')]
    }
  });

  // Store for both parties
  storeMemory(system, fromCharacter, memory);
  if (toCharacter && toCharacter !== fromCharacter) {
    storeMemory(system, toCharacter, { ...memory, id: memory.id + '_copy' });
  }

  return memory;
}

/**
 * Marks a promise as fulfilled
 */
export function fulfillPromise(system, promiseId) {
  // Find in all character memories
  for (const [charId, memories] of Object.entries(system.characterMemories)) {
    const promise = memories.find(m =>
      m.id === promiseId || m.id === promiseId + '_copy'
    );
    if (promise && promise.context) {
      promise.context.fulfilled = true;
      promise.emotionalValence = MEMORY_VALENCE.JOYFUL;
      promise.currentSalience = SALIENCE.UNFORGETTABLE; // Kept promises are memorable
    }
  }
}

/**
 * Gets unfulfilled promises for a character
 */
export function getUnfulfilledPromises(system, characterId) {
  const memories = system.characterMemories[characterId] || [];

  return memories.filter(m =>
    m.type === MEMORY_TYPES.PROMISE &&
    m.context?.fulfilled === false
  );
}

/**
 * Records a secret shared between characters
 */
export function recordSecret(system, sharer, recipient, secret, context = {}) {
  const memory = createMemory({
    type: MEMORY_TYPES.SECRET,
    content: secret,
    emotionalValence: MEMORY_VALENCE.WARM,
    salience: SALIENCE.SIGNIFICANT,
    participants: [sharer, recipient].filter(Boolean),
    trigger: 'secret',
    context: {
      ...context,
      sharedBy: sharer,
      sharedWith: recipient,
      betrayed: false,
      keywords: ['secret', 'trust', 'confidential']
    }
  });

  // Store for both parties
  storeMemory(system, sharer, memory);
  if (recipient && recipient !== sharer) {
    storeMemory(system, recipient, { ...memory, id: memory.id + '_copy' });
  }

  return memory;
}

/**
 * Records a "first" moment (first laugh, first fight, etc.)
 */
export function recordFirst(system, characterId, firstType, description, context = {}) {
  const memory = createMemory({
    type: MEMORY_TYPES.FIRST,
    content: `First ${firstType}: ${description}`,
    emotionalValence: context.valence || MEMORY_VALENCE.WARM,
    salience: SALIENCE.UNFORGETTABLE, // Firsts are always memorable
    participants: context.participants || [],
    trigger: `first_${firstType}`,
    context: {
      ...context,
      firstType,
      keywords: ['first', firstType, 'milestone']
    }
  });

  return storeMemory(system, characterId, memory);
}

/**
 * Gets all "firsts" for the relationship
 */
export function getFirsts(system, characterId) {
  const memories = system.characterMemories[characterId] || [];
  return memories.filter(m => m.type === MEMORY_TYPES.FIRST);
}

/**
 * Serializes memory system for storage
 */
export function serializeMemorySystem(system) {
  return JSON.stringify({
    characterMemories: system.characterMemories,
    sharedMemories: system.sharedMemories,
    readerMemories: system.readerMemories,
    callbackQueue: system.callbackQueue,
    triggers: system.triggers,
    stats: system.stats
  });
}

/**
 * Deserializes memory system from storage
 */
export function deserializeMemorySystem(data) {
  try {
    const parsed = JSON.parse(data);
    return {
      ...createMemorySystem(),
      ...parsed,
      recentlyAccessed: []
    };
  } catch {
    return null;
  }
}

export default {
  createMemorySystem,
  createMemory,
  storeMemory,
  storeSharedMemory,
  storeReaderMemory,
  getRelevantMemories,
  getCallbackOpportunity,
  useCallback,
  getSharedMemoriesBetween,
  characterRemembers,
  getMemoryContext,
  recordPromise,
  fulfillPromise,
  getUnfulfilledPromises,
  recordSecret,
  recordFirst,
  getFirsts,
  serializeMemorySystem,
  deserializeMemorySystem,
  MEMORY_TYPES,
  SALIENCE,
  MEMORY_VALENCE
};
