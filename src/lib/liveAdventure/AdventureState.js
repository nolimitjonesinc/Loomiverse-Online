/**
 * AdventureState - The living memory of a Live Adventure
 *
 * This is the central state machine that tracks everything about the current
 * adventure: where you are, who's with you, what's happened, and the emotional
 * texture of the moment.
 *
 * Design Philosophy:
 * - State should tell a story by itself
 * - Every piece of data serves immersion
 * - Memory is selective (like human memory)
 * - Emotional context is as important as factual context
 */

// Tension levels that drive pacing
export const TENSION_LEVELS = {
  PEACEFUL: 0,      // Quiet moments, reflection, rest
  CALM: 20,         // Normal conversation, exploration
  ENGAGING: 40,     // Active scenes, interesting developments
  TENSE: 60,        // Conflict brewing, stakes rising
  INTENSE: 80,      // Peak action, critical decisions
  CLIMACTIC: 100    // The moment everything hinges on
};

// Emotional beats - the texture of the current moment
export const EMOTIONAL_BEATS = {
  WONDER: 'wonder',           // Discovery, awe, beauty
  TENSION: 'tension',         // Anticipation, fear, uncertainty
  WARMTH: 'warmth',           // Connection, comfort, belonging
  MELANCHOLY: 'melancholy',   // Loss, nostalgia, bittersweet
  TRIUMPH: 'triumph',         // Victory, achievement, relief
  INTIMACY: 'intimacy',       // Vulnerable moments, trust
  MYSTERY: 'mystery',         // Curiosity, secrets, questions
  HUMOR: 'humor',             // Lightness, play, laughter
  DREAD: 'dread',             // Approaching darkness, foreboding
  HOPE: 'hope',               // Possibility, new beginnings
  REFLECTION: 'reflection',   // Processing, understanding, growth
  BREATH: 'breath'            // The pause between - pure presence
};

// Scene types that inform how agents behave
export const SCENE_TYPES = {
  DIALOGUE: 'dialogue',       // Characters talking, relationship building
  ACTION: 'action',           // Physical conflict, chase, danger
  EXPLORATION: 'exploration', // Discovering new spaces, investigation
  DECISION: 'decision',       // A choice that matters
  REVELATION: 'revelation',   // Something important is learned
  TRANSITION: 'transition',   // Moving between scenes
  BREATH: 'breath'            // A moment to just... be
};

/**
 * Creates a new Adventure State
 */
export function createAdventureState(storyBible, readerName = 'You') {
  return {
    // Core identity
    id: `adventure_${Date.now()}`,
    storyBible,
    readerName,
    startedAt: new Date().toISOString(),

    // Current scene
    scene: {
      type: SCENE_TYPES.DIALOGUE,
      location: null,           // { name, description, mood, sensoryDetails }
      timeOfDay: 'day',         // morning, day, evening, night
      weather: null,            // { type, intensity, mood }
      ambiance: null            // Brief atmospheric description
    },

    // Characters present
    presentCharacters: [],      // Array of character objects from StoryBible
    speakingCharacter: null,    // Who is currently "speaking" or focused

    // Emotional texture
    tension: TENSION_LEVELS.CALM,
    emotionalBeat: EMOTIONAL_BEATS.WONDER,
    mood: 'neutral',            // Overall scene mood

    // Story tracking
    chapterNumber: 1,
    sceneNumber: 1,
    totalExchanges: 0,          // Back-and-forth count

    // Memory systems
    recentEvents: [],           // Last 10 significant events
    pendingThreads: [],         // Unresolved story elements
    foreshadowing: [],          // Seeds planted for later

    // Reader relationship tracking
    relationships: {},          // { characterId: { trust, affection, tension, history } }

    // Conversation history (for context)
    conversationHistory: [],    // Last N exchanges for AI context

    // Flags and states
    awaitingResponse: false,    // Is reader expected to respond?
    questionPending: null,      // What question was asked?
    lastSpeaker: null,          // 'narrator' | 'character' | 'reader'

    // Discovery tracking
    secretsUnlocked: [],        // Hidden content found
    emotionalMilestones: [],    // Significant emotional moments

    // Meta
    sessionCount: 1,            // How many sessions on this adventure
    lastPlayedAt: new Date().toISOString()
  };
}

/**
 * Updates the current scene
 */
export function updateScene(state, sceneUpdate) {
  return {
    ...state,
    scene: {
      ...state.scene,
      ...sceneUpdate
    }
  };
}

/**
 * Adds a character to the current scene
 */
export function addCharacterToScene(state, character) {
  if (state.presentCharacters.find(c => c.name === character.name)) {
    return state; // Already present
  }

  // Initialize relationship if new
  const relationships = { ...state.relationships };
  if (!relationships[character.name]) {
    relationships[character.name] = {
      trust: 50,        // 0-100
      affection: 50,    // 0-100
      tension: 0,       // 0-100
      familiarity: 0,   // 0-100, grows over time
      history: [],      // Significant shared moments
      lastInteraction: null
    };
  }

  return {
    ...state,
    presentCharacters: [...state.presentCharacters, character],
    relationships
  };
}

/**
 * Removes a character from the current scene
 */
export function removeCharacterFromScene(state, characterName) {
  return {
    ...state,
    presentCharacters: state.presentCharacters.filter(c => c.name !== characterName),
    speakingCharacter: state.speakingCharacter?.name === characterName
      ? null
      : state.speakingCharacter
  };
}

/**
 * Sets the currently speaking/focused character
 */
export function setSpeakingCharacter(state, character) {
  return {
    ...state,
    speakingCharacter: character,
    lastSpeaker: 'character'
  };
}

/**
 * Updates tension level with smooth transitions
 */
export function updateTension(state, newTension, reason = null) {
  const clampedTension = Math.max(0, Math.min(100, newTension));

  const recentEvents = reason
    ? [...state.recentEvents, {
        type: 'tension_change',
        from: state.tension,
        to: clampedTension,
        reason,
        timestamp: Date.now()
      }].slice(-10)
    : state.recentEvents;

  return {
    ...state,
    tension: clampedTension,
    recentEvents
  };
}

/**
 * Sets the emotional beat of the current moment
 */
export function setEmotionalBeat(state, beat, mood = null) {
  return {
    ...state,
    emotionalBeat: beat,
    mood: mood || state.mood
  };
}

/**
 * Records a significant event
 */
export function recordEvent(state, event) {
  const eventWithTimestamp = {
    ...event,
    timestamp: Date.now(),
    sceneNumber: state.sceneNumber,
    chapterNumber: state.chapterNumber
  };

  return {
    ...state,
    recentEvents: [...state.recentEvents, eventWithTimestamp].slice(-10)
  };
}

/**
 * Adds to conversation history (for AI context)
 */
export function addToConversation(state, entry) {
  // entry: { speaker: 'narrator'|'character'|'reader', character?: object, content: string, type: string }
  const conversationEntry = {
    ...entry,
    timestamp: Date.now()
  };

  return {
    ...state,
    conversationHistory: [...state.conversationHistory, conversationEntry].slice(-20),
    totalExchanges: state.totalExchanges + 1,
    lastSpeaker: entry.speaker
  };
}

/**
 * Updates relationship with a character
 */
export function updateRelationship(state, characterName, changes) {
  const current = state.relationships[characterName] || {
    trust: 50, affection: 50, tension: 0, familiarity: 0, history: []
  };

  const updated = {
    trust: Math.max(0, Math.min(100, (current.trust || 50) + (changes.trust || 0))),
    affection: Math.max(0, Math.min(100, (current.affection || 50) + (changes.affection || 0))),
    tension: Math.max(0, Math.min(100, (current.tension || 0) + (changes.tension || 0))),
    familiarity: Math.max(0, Math.min(100, (current.familiarity || 0) + (changes.familiarity || 0))),
    history: changes.moment
      ? [...current.history, { moment: changes.moment, timestamp: Date.now() }].slice(-10)
      : current.history,
    lastInteraction: Date.now()
  };

  return {
    ...state,
    relationships: {
      ...state.relationships,
      [characterName]: updated
    }
  };
}

/**
 * Adds a story thread to track
 */
export function addPendingThread(state, thread) {
  return {
    ...state,
    pendingThreads: [...state.pendingThreads, {
      ...thread,
      introducedAt: state.sceneNumber,
      introducedChapter: state.chapterNumber
    }]
  };
}

/**
 * Resolves a story thread
 */
export function resolveThread(state, threadId) {
  return {
    ...state,
    pendingThreads: state.pendingThreads.map(t =>
      t.id === threadId ? { ...t, resolved: true, resolvedAt: state.sceneNumber } : t
    )
  };
}

/**
 * Plants foreshadowing for later payoff
 */
export function plantForeshadowing(state, seed) {
  return {
    ...state,
    foreshadowing: [...state.foreshadowing, {
      ...seed,
      plantedAt: state.sceneNumber,
      chapter: state.chapterNumber,
      triggered: false
    }]
  };
}

/**
 * Triggers a foreshadowing payoff
 */
export function triggerForeshadowing(state, seedId) {
  return {
    ...state,
    foreshadowing: state.foreshadowing.map(f =>
      f.id === seedId ? { ...f, triggered: true, triggeredAt: state.sceneNumber } : f
    )
  };
}

/**
 * Marks reader as awaiting a response
 */
export function setAwaitingResponse(state, question = null) {
  return {
    ...state,
    awaitingResponse: true,
    questionPending: question
  };
}

/**
 * Clears awaiting response state
 */
export function clearAwaitingResponse(state) {
  return {
    ...state,
    awaitingResponse: false,
    questionPending: null
  };
}

/**
 * Advances to next scene
 */
export function advanceScene(state) {
  return {
    ...state,
    sceneNumber: state.sceneNumber + 1
  };
}

/**
 * Advances to next chapter
 */
export function advanceChapter(state) {
  return {
    ...state,
    chapterNumber: state.chapterNumber + 1,
    sceneNumber: 1
  };
}

/**
 * Records an emotional milestone
 */
export function recordEmotionalMilestone(state, milestone) {
  return {
    ...state,
    emotionalMilestones: [...state.emotionalMilestones, {
      ...milestone,
      timestamp: Date.now(),
      chapter: state.chapterNumber,
      scene: state.sceneNumber
    }]
  };
}

/**
 * Unlocks a secret/hidden content
 */
export function unlockSecret(state, secret) {
  if (state.secretsUnlocked.find(s => s.id === secret.id)) {
    return state; // Already unlocked
  }

  return {
    ...state,
    secretsUnlocked: [...state.secretsUnlocked, {
      ...secret,
      unlockedAt: Date.now(),
      chapter: state.chapterNumber
    }]
  };
}

/**
 * Gets the context window for AI prompts
 * Returns a summary of recent state for injection into prompts
 */
export function getContextWindow(state) {
  const recentConversation = state.conversationHistory.slice(-6).map(entry => {
    if (entry.speaker === 'narrator') {
      return `[Narrator]: ${entry.content}`;
    } else if (entry.speaker === 'character') {
      return `[${entry.character?.name || 'Character'}]: ${entry.content}`;
    } else {
      return `[${state.readerName}]: ${entry.content}`;
    }
  }).join('\n');

  const presentNames = state.presentCharacters.map(c => c.name).join(', ');

  const relationshipSummary = Object.entries(state.relationships)
    .filter(([name]) => state.presentCharacters.find(c => c.name === name))
    .map(([name, rel]) => {
      const feelings = [];
      if (rel.trust > 70) feelings.push('trusts deeply');
      else if (rel.trust < 30) feelings.push('distrusts');
      if (rel.affection > 70) feelings.push('cares for');
      if (rel.tension > 50) feelings.push('tension with');
      return feelings.length ? `${name}: ${feelings.join(', ')}` : null;
    })
    .filter(Boolean)
    .join('; ');

  return {
    scene: {
      location: state.scene.location?.name || 'Unknown location',
      description: state.scene.location?.description || '',
      timeOfDay: state.scene.timeOfDay,
      weather: state.scene.weather?.type || null,
      ambiance: state.scene.ambiance
    },
    characters: presentNames || 'No one',
    tension: state.tension,
    emotionalBeat: state.emotionalBeat,
    recentConversation,
    relationships: relationshipSummary || 'New acquaintances',
    pendingQuestion: state.questionPending,
    readerName: state.readerName
  };
}

/**
 * Serializes state for persistence
 */
export function serializeState(state) {
  return JSON.stringify(state);
}

/**
 * Deserializes state from storage
 */
export function deserializeState(serialized) {
  try {
    return JSON.parse(serialized);
  } catch {
    return null;
  }
}

export default {
  createAdventureState,
  updateScene,
  addCharacterToScene,
  removeCharacterFromScene,
  setSpeakingCharacter,
  updateTension,
  setEmotionalBeat,
  recordEvent,
  addToConversation,
  updateRelationship,
  addPendingThread,
  resolveThread,
  plantForeshadowing,
  triggerForeshadowing,
  setAwaitingResponse,
  clearAwaitingResponse,
  advanceScene,
  advanceChapter,
  recordEmotionalMilestone,
  unlockSecret,
  getContextWindow,
  serializeState,
  deserializeState,
  TENSION_LEVELS,
  EMOTIONAL_BEATS,
  SCENE_TYPES
};
