/**
 * CharacterCrossTalk - When Reader Is Quiet
 *
 * This system handles conversations between characters
 * when the reader steps back to observe. It creates
 * the feeling of a living world that continues
 * without constant reader input.
 *
 * It handles:
 * - Character-to-character dialogue
 * - Cross-talk timing (when to happen)
 * - Relationship dynamics between NPCs
 * - World-building moments
 * - Reader as observer vs participant
 *
 * Design Philosophy:
 * - Characters have relationships with each other, not just the reader
 * - Silence from the reader is an opportunity
 * - Overheard conversations feel authentic
 * - Sometimes watching is more engaging than doing
 * - Characters reveal things to each other they won't tell the reader
 */

// Cross-talk types
export const CROSSTALK_TYPES = {
  // Functional
  BANTER: 'banter',                   // Light, playful exchange
  DEBATE: 'debate',                   // Intellectual disagreement
  PLANNING: 'planning',               // Characters discussing what to do
  REMINISCING: 'reminiscing',         // Sharing memories

  // Emotional
  COMFORT: 'comfort',                 // One supporting another
  TENSION: 'tension',                 // Underlying conflict surfacing
  FLIRTATION: 'flirtation',           // Romantic subtext
  CONFESSION: 'confession',           // Revealing something personal

  // World-building
  EXPOSITION: 'exposition',           // Natural information sharing
  GOSSIP: 'gossip',                   // Talking about others
  LORE: 'lore',                       // History/backstory discussion

  // Plot-relevant
  SECRETS: 'secrets',                 // Things reader shouldn't know yet
  FORESHADOWING: 'foreshadowing',     // Hints at future
  SUBPLOT: 'subplot'                  // Side story advancement
};

// Relationship dynamics between characters
export const DYNAMICS = {
  ALLIES: 'allies',
  RIVALS: 'rivals',
  MENTOR_STUDENT: 'mentor_student',
  ROMANTIC: 'romantic',
  SIBLINGS: 'siblings',
  STRANGERS: 'strangers',
  FORMER_FRIENDS: 'former_friends',
  COWORKERS: 'coworkers',
  NEMESES: 'nemeses'
};

// Cross-talk triggers
export const TRIGGERS = {
  READER_SILENT: 'reader_silent',           // Reader hasn't responded
  NATURAL_PAUSE: 'natural_pause',           // Good moment for it
  TENSION_RELEASE: 'tension_release',       // After high tension
  SCENE_TRANSITION: 'scene_transition',     // Moving locations
  NEW_INFORMATION: 'new_information',       // Something to react to
  CHARACTER_ARRIVAL: 'character_arrival',   // Someone new joins
  READER_OBSERVING: 'reader_observing'      // Reader explicitly watching
};

/**
 * Creates the cross-talk system
 */
export function createCrossTalkSystem() {
  return {
    // Character relationships (separate from reader relationships)
    characterRelationships: {},  // { 'char1:char2': { dynamic, tension, history } }

    // Recent cross-talk history
    history: [],

    // Queued cross-talk (ready to trigger)
    queue: [],

    // Tracking
    lastCrossTalk: null,
    exchangesSinceCrossTalk: 0,

    // Stats
    stats: {
      totalCrossTalks: 0,
      byType: {}
    }
  };
}

/**
 * Sets up a relationship between two characters
 */
export function setCharacterRelationship(system, char1, char2, relationship) {
  const key = getRelationshipKey(char1, char2);

  system.characterRelationships[key] = {
    dynamic: relationship.dynamic || DYNAMICS.STRANGERS,
    tension: relationship.tension || 30,        // 0-100
    affection: relationship.affection || 50,    // 0-100
    history: relationship.history || [],
    sharedSecrets: relationship.sharedSecrets || [],
    topics: relationship.topics || []           // Things they talk about
  };

  return system.characterRelationships[key];
}

/**
 * Gets relationship key (alphabetically ordered for consistency)
 */
function getRelationshipKey(char1, char2) {
  return [char1, char2].sort().join(':');
}

/**
 * Gets relationship between two characters
 */
export function getCharacterRelationship(system, char1, char2) {
  const key = getRelationshipKey(char1, char2);
  return system.characterRelationships[key] || null;
}

/**
 * Checks if cross-talk should happen
 */
export function shouldCrossTalk(system, context) {
  // Don't spam cross-talk
  if (system.exchangesSinceCrossTalk < 4) {
    return { should: false, reason: 'too_soon' };
  }

  // Check for triggers
  const triggers = [];

  if (context.readerSilent && context.silentExchanges >= 2) {
    triggers.push(TRIGGERS.READER_SILENT);
  }
  if (context.naturalPause) {
    triggers.push(TRIGGERS.NATURAL_PAUSE);
  }
  if (context.tensionJustDropped) {
    triggers.push(TRIGGERS.TENSION_RELEASE);
  }
  if (context.sceneTransition) {
    triggers.push(TRIGGERS.SCENE_TRANSITION);
  }
  if (context.newInformation) {
    triggers.push(TRIGGERS.NEW_INFORMATION);
  }
  if (context.characterJustArrived) {
    triggers.push(TRIGGERS.CHARACTER_ARRIVAL);
  }
  if (context.readerObserving) {
    triggers.push(TRIGGERS.READER_OBSERVING);
  }

  if (triggers.length === 0) {
    return { should: false, reason: 'no_triggers' };
  }

  // Need at least 2 characters
  if (!context.characters || context.characters.length < 2) {
    return { should: false, reason: 'need_multiple_characters' };
  }

  return {
    should: true,
    triggers,
    suggestedType: suggestCrossTalkType(system, context, triggers)
  };
}

/**
 * Suggests what type of cross-talk would be appropriate
 */
function suggestCrossTalkType(system, context, triggers) {
  // High tension release -> comfort or banter
  if (triggers.includes(TRIGGERS.TENSION_RELEASE)) {
    return Math.random() > 0.5 ? CROSSTALK_TYPES.BANTER : CROSSTALK_TYPES.COMFORT;
  }

  // New information -> reaction/debate
  if (triggers.includes(TRIGGERS.NEW_INFORMATION)) {
    return CROSSTALK_TYPES.DEBATE;
  }

  // Character arrival -> introductions or catching up
  if (triggers.includes(TRIGGERS.CHARACTER_ARRIVAL)) {
    return CROSSTALK_TYPES.REMINISCING;
  }

  // Reader silent for a while -> planning or gossip
  if (triggers.includes(TRIGGERS.READER_SILENT)) {
    return Math.random() > 0.5 ? CROSSTALK_TYPES.PLANNING : CROSSTALK_TYPES.GOSSIP;
  }

  // Natural pause -> banter or subtle exposition
  if (triggers.includes(TRIGGERS.NATURAL_PAUSE)) {
    const options = [CROSSTALK_TYPES.BANTER, CROSSTALK_TYPES.EXPOSITION, CROSSTALK_TYPES.LORE];
    return options[Math.floor(Math.random() * options.length)];
  }

  // Default
  return CROSSTALK_TYPES.BANTER;
}

/**
 * Selects which characters should cross-talk
 */
export function selectCrossTalkParticipants(system, availableCharacters, context = {}) {
  if (availableCharacters.length < 2) return null;

  // Prioritize characters with existing relationships
  const pairs = [];
  for (let i = 0; i < availableCharacters.length; i++) {
    for (let j = i + 1; j < availableCharacters.length; j++) {
      const char1 = availableCharacters[i].name || availableCharacters[i];
      const char2 = availableCharacters[j].name || availableCharacters[j];
      const relationship = getCharacterRelationship(system, char1, char2);

      pairs.push({
        characters: [availableCharacters[i], availableCharacters[j]],
        hasRelationship: !!relationship,
        tension: relationship?.tension || 30,
        affection: relationship?.affection || 50,
        dynamic: relationship?.dynamic || DYNAMICS.STRANGERS
      });
    }
  }

  // Score pairs
  const scored = pairs.map(pair => {
    let score = 0;

    // Existing relationship is good
    if (pair.hasRelationship) score += 30;

    // Tension makes for interesting dialogue
    if (pair.tension > 60) score += 20;
    if (pair.tension < 30) score += 10; // Very low tension = comfort

    // Some dynamics are more interesting
    const interestingDynamics = [DYNAMICS.RIVALS, DYNAMICS.ROMANTIC, DYNAMICS.MENTOR_STUDENT];
    if (interestingDynamics.includes(pair.dynamic)) score += 25;

    // New character pairs are fresh
    if (!pair.hasRelationship) score += 15;

    return { ...pair, score };
  });

  // Pick highest scoring pair
  scored.sort((a, b) => b.score - a.score);

  return {
    characters: scored[0].characters,
    dynamic: scored[0].dynamic,
    relationship: scored[0].hasRelationship ? getCharacterRelationship(
      system,
      scored[0].characters[0].name || scored[0].characters[0],
      scored[0].characters[1].name || scored[0].characters[1]
    ) : null
  };
}

/**
 * Generates cross-talk content guidance
 */
export function getCrossTalkGuidance(system, participants, type, context = {}) {
  const char1 = participants.characters[0];
  const char2 = participants.characters[1];
  const relationship = participants.relationship;

  const guidance = {
    participants: {
      speaker1: char1.name || char1,
      speaker2: char2.name || char2
    },
    type,
    dynamic: participants.dynamic,
    relationship: relationship ? {
      tension: relationship.tension,
      affection: relationship.affection,
      sharedTopics: relationship.topics.slice(0, 3)
    } : null,
    suggestions: []
  };

  // Type-specific suggestions
  switch (type) {
    case CROSSTALK_TYPES.BANTER:
      guidance.suggestions.push(
        'Keep it light and quick',
        'Show their rapport through verbal sparring',
        'Let their personalities bounce off each other'
      );
      break;

    case CROSSTALK_TYPES.COMFORT:
      guidance.suggestions.push(
        'One character notices the other needs support',
        'Actions can speak louder than words',
        'Don\'t solve the problem, just be present'
      );
      break;

    case CROSSTALK_TYPES.TENSION:
      guidance.suggestions.push(
        'Let subtext do the heavy lifting',
        'Interrupted sentences and loaded pauses',
        'Things left unsaid are often loudest'
      );
      break;

    case CROSSTALK_TYPES.PLANNING:
      guidance.suggestions.push(
        'Characters discuss next steps naturally',
        'Disagreements reveal character',
        'Let reader overhear useful information'
      );
      break;

    case CROSSTALK_TYPES.REMINISCING:
      guidance.suggestions.push(
        'Reference shared past',
        'Reveal backstory naturally',
        'Show how relationship has evolved'
      );
      break;

    case CROSSTALK_TYPES.GOSSIP:
      guidance.suggestions.push(
        'Characters discuss others (possibly the reader)',
        'Different perspectives on same events',
        'Reveal how characters see the world'
      );
      break;

    case CROSSTALK_TYPES.EXPOSITION:
      guidance.suggestions.push(
        'Information through disagreement or teaching',
        'One character asks what reader might be wondering',
        'Keep it natural, not lecture-like'
      );
      break;

    case CROSSTALK_TYPES.CONFESSION:
      guidance.suggestions.push(
        'One character trusts the other with something personal',
        'Vulnerability creates intimacy',
        'Reader feels privileged to witness'
      );
      break;

    default:
      guidance.suggestions.push(
        'Let characters have their own moment',
        'Reveal something about their relationship',
        'Give reader reason to care about both'
      );
  }

  // Dynamic-specific adjustments
  if (participants.dynamic === DYNAMICS.RIVALS) {
    guidance.suggestions.push('Competitive edge even in friendly moments');
  } else if (participants.dynamic === DYNAMICS.MENTOR_STUDENT) {
    guidance.suggestions.push('Teaching moments, but student can surprise mentor');
  } else if (participants.dynamic === DYNAMICS.ROMANTIC) {
    guidance.suggestions.push('Subtext, stolen glances, things almost said');
  }

  return guidance;
}

/**
 * Records that cross-talk happened
 */
export function recordCrossTalk(system, crossTalk) {
  const {
    participants,
    type,
    summary
  } = crossTalk;

  const record = {
    participants: participants.map(c => c.name || c),
    type,
    summary,
    timestamp: Date.now()
  };

  system.history.push(record);
  system.lastCrossTalk = Date.now();
  system.exchangesSinceCrossTalk = 0;

  // Update relationship
  const [char1, char2] = record.participants;
  const key = getRelationshipKey(char1, char2);
  if (system.characterRelationships[key]) {
    system.characterRelationships[key].history.push({
      type,
      when: Date.now()
    });
    if (system.characterRelationships[key].history.length > 10) {
      system.characterRelationships[key].history =
        system.characterRelationships[key].history.slice(-8);
    }
  }

  // Keep history bounded
  if (system.history.length > 30) {
    system.history = system.history.slice(-25);
  }

  // Stats
  system.stats.totalCrossTalks++;
  system.stats.byType[type] = (system.stats.byType[type] || 0) + 1;

  return record;
}

/**
 * Increments exchanges counter
 */
export function incrementExchanges(system) {
  system.exchangesSinceCrossTalk++;
}

/**
 * Gets cross-talk context for AI prompting
 */
export function getCrossTalkContext(system, characters) {
  const context = {
    exchangesSinceLast: system.exchangesSinceCrossTalk,
    recentCrossTalk: system.history.slice(-3),
    characterDynamics: []
  };

  // Build dynamics between present characters
  for (let i = 0; i < characters.length; i++) {
    for (let j = i + 1; j < characters.length; j++) {
      const char1 = characters[i].name || characters[i];
      const char2 = characters[j].name || characters[j];
      const rel = getCharacterRelationship(system, char1, char2);

      if (rel) {
        context.characterDynamics.push({
          pair: [char1, char2],
          dynamic: rel.dynamic,
          tension: rel.tension,
          affection: rel.affection
        });
      }
    }
  }

  return context;
}

/**
 * Adds a topic to a relationship (things they can discuss)
 */
export function addRelationshipTopic(system, char1, char2, topic) {
  const key = getRelationshipKey(char1, char2);

  if (!system.characterRelationships[key]) {
    setCharacterRelationship(system, char1, char2, {});
  }

  const rel = system.characterRelationships[key];
  if (!rel.topics.includes(topic)) {
    rel.topics.push(topic);
    if (rel.topics.length > 10) {
      rel.topics = rel.topics.slice(-8);
    }
  }
}

/**
 * Adds a shared secret between characters
 */
export function addSharedSecret(system, char1, char2, secret) {
  const key = getRelationshipKey(char1, char2);

  if (!system.characterRelationships[key]) {
    setCharacterRelationship(system, char1, char2, {});
  }

  const rel = system.characterRelationships[key];
  rel.sharedSecrets.push({
    secret,
    addedAt: Date.now()
  });

  // Secrets increase affection slightly
  rel.affection = Math.min(100, rel.affection + 5);
}

/**
 * Updates relationship tension
 */
export function updateRelationshipTension(system, char1, char2, delta) {
  const key = getRelationshipKey(char1, char2);

  if (!system.characterRelationships[key]) {
    setCharacterRelationship(system, char1, char2, {});
  }

  const rel = system.characterRelationships[key];
  rel.tension = Math.max(0, Math.min(100, rel.tension + delta));
}

/**
 * Serializes system for storage
 */
export function serializeCrossTalk(system) {
  return JSON.stringify({
    characterRelationships: system.characterRelationships,
    history: system.history.slice(-20),
    stats: system.stats
  });
}

/**
 * Deserializes system from storage
 */
export function deserializeCrossTalk(data) {
  try {
    const parsed = JSON.parse(data);
    const system = createCrossTalkSystem();

    system.characterRelationships = parsed.characterRelationships || {};
    system.history = parsed.history || [];
    system.stats = parsed.stats || system.stats;

    return system;
  } catch {
    return null;
  }
}

export default {
  createCrossTalkSystem,
  setCharacterRelationship,
  getCharacterRelationship,
  shouldCrossTalk,
  selectCrossTalkParticipants,
  getCrossTalkGuidance,
  recordCrossTalk,
  incrementExchanges,
  getCrossTalkContext,
  addRelationshipTopic,
  addSharedSecret,
  updateRelationshipTension,
  serializeCrossTalk,
  deserializeCrossTalk,
  CROSSTALK_TYPES,
  DYNAMICS,
  TRIGGERS
};
