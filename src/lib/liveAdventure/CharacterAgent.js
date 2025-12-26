/**
 * CharacterAgent - Giving Characters Real Presence
 *
 * Each character in a Live Adventure is run by a Character Agent that:
 * - Maintains consistent voice and personality
 * - Remembers past interactions with the reader
 * - Reacts authentically based on their psychology
 * - Has opinions, moods, and evolving feelings
 * - Can surprise us while staying true to themselves
 *
 * Design Philosophy:
 * - Characters are people, not plot devices
 * - Voice is more than word choice - it's rhythm, pause, what's unsaid
 * - Relationships are mutual - they have feelings about the reader too
 * - Consistency is not rigidity - people are complex
 * - Small moments reveal character as much as big ones
 */

import { updateRelationship, getContextWindow } from './AdventureState.js';

// Response styles that characters can adopt
export const RESPONSE_STYLES = {
  DIRECT: 'direct',           // Straight to the point
  EVASIVE: 'evasive',         // Deflecting, avoiding
  EMOTIONAL: 'emotional',     // Feeling-driven response
  ANALYTICAL: 'analytical',   // Thinking through
  PLAYFUL: 'playful',         // Light, teasing
  GUARDED: 'guarded',         // Careful, protective
  VULNERABLE: 'vulnerable',   // Open, exposed
  AGGRESSIVE: 'aggressive',   // Confrontational
  SUPPORTIVE: 'supportive',   // Encouraging, helpful
  CRYPTIC: 'cryptic'          // Mysterious, hinting
};

// Reaction types for quick character responses
export const REACTION_TYPES = {
  AGREEMENT: 'agreement',
  DISAGREEMENT: 'disagreement',
  CURIOSITY: 'curiosity',
  CONCERN: 'concern',
  AMUSEMENT: 'amusement',
  FRUSTRATION: 'frustration',
  AFFECTION: 'affection',
  SUSPICION: 'suspicion',
  SURPRISE: 'surprise',
  THOUGHTFULNESS: 'thoughtfulness'
};

/**
 * Creates a Character Agent for a specific character
 */
export function createCharacterAgent(character, aiProvider) {
  return {
    character,
    aiProvider,

    // Character's current emotional state (can shift during conversation)
    currentMood: 'neutral',
    moodIntensity: 50,

    // Internal thoughts (what they're thinking but not saying)
    internalState: {
      currentConcern: null,
      hiddenAgenda: null,
      unspokenFeeling: null
    },

    // Conversation memory within this session
    sessionMemory: [],

    // Response generation settings
    settings: {
      verbosity: character.psychology?.speech_patterns?.verbosity || 'moderate',
      formality: character.psychology?.speech_patterns?.formality || 'casual',
      emotionalOpenness: getEmotionalOpenness(character)
    }
  };
}

/**
 * Derives emotional openness from character psychology
 */
function getEmotionalOpenness(character) {
  const psychology = character.psychology || {};
  const attachment = psychology.attachment_style?.style || 'secure';

  switch (attachment) {
    case 'secure': return 0.7;
    case 'anxious': return 0.8;
    case 'avoidant': return 0.3;
    case 'disorganized': return 0.5;
    default: return 0.5;
  }
}

/**
 * Generates a character's spoken response
 */
export async function generateResponse(agent, state, context, direction) {
  const { character, aiProvider } = agent;
  const relationship = state.relationships[character.name] || {
    trust: 50, affection: 50, tension: 0, familiarity: 0
  };

  const systemPrompt = buildCharacterSystemPrompt(character, relationship, agent);
  const userPrompt = buildCharacterUserPrompt(state, context, direction, agent);

  try {
    const response = await aiProvider.generate(systemPrompt, userPrompt, {
      temperature: 0.85,
      maxTokens: 300
    });

    // Update agent's internal state based on what they said
    updateAgentState(agent, response, direction);

    return {
      speaker: 'character',
      character,
      content: response.trim(),
      mood: agent.currentMood,
      style: detectResponseStyle(response)
    };
  } catch (error) {
    console.error(`[CharacterAgent:${character.name}] Generation error:`, error);
    return generateFallbackResponse(agent, direction);
  }
}

/**
 * Builds the system prompt that defines the character's voice
 */
function buildCharacterSystemPrompt(character, relationship, agent) {
  const psychology = character.psychology || {};
  const traits = character.traits || [];
  const speechPatterns = psychology.speech_patterns || {};

  // Build personality description
  let personalityDesc = '';
  if (traits.length > 0) {
    personalityDesc = `Core traits: ${traits.join(', ')}.`;
  }

  // Attachment style influences how they relate
  const attachmentGuidance = getAttachmentGuidance(psychology.attachment_style?.style);

  // Verbal tics and speech patterns
  const verbalTics = speechPatterns.verbal_tics
    ? `Speech patterns: ${speechPatterns.verbal_tics.join(', ')}.`
    : '';

  // Core beliefs that shape reactions
  const beliefs = psychology.core_beliefs
    ? Object.entries(psychology.core_beliefs)
        .slice(0, 3)
        .map(([belief, strength]) => `Believes: "${belief}" (${strength}%)`)
        .join('. ')
    : '';

  // Emotional climate
  const emotional = psychology.emotional_climate?.baseline_affect
    ? `Baseline mood: ${psychology.emotional_climate.baseline_affect}.`
    : '';

  return `You are ${character.name}, a character in an interactive story.

IDENTITY:
${personalityDesc}
${emotional}
Role: ${character.role || 'supporting character'}

PSYCHOLOGY:
${attachmentGuidance}
${beliefs}

VOICE:
${verbalTics}
- Speak naturally in 1-3 sentences usually (not monologues)
- Match the energy of what's happening
- Use *asterisks* for actions/expressions: *sighs*, *looks away*
- You can trail off... or be interrupted-
- Short responses are often better than long ones

RELATIONSHIP WITH READER:
- Trust: ${relationship.trust}/100
- Affection: ${relationship.affection}/100
- Tension: ${relationship.tension}/100
- Familiarity: ${relationship.familiarity}/100
${relationship.history?.length > 0
  ? `Shared history: ${relationship.history.slice(-2).map(h => h.moment).join('; ')}`
  : 'You just met.'}

CURRENT STATE:
- Mood: ${agent.currentMood}
${agent.internalState.currentConcern
  ? `- Worried about: ${agent.internalState.currentConcern}`
  : ''}
${agent.internalState.unspokenFeeling
  ? `- Feeling (unspoken): ${agent.internalState.unspokenFeeling}`
  : ''}

Stay in character. React authentically to what's happening. You have your own feelings and opinions.`;
}

/**
 * Gets guidance based on attachment style
 */
function getAttachmentGuidance(attachmentStyle) {
  switch (attachmentStyle) {
    case 'secure':
      return 'You\'re comfortable with closeness. You can be vulnerable and trust others, while maintaining healthy boundaries.';
    case 'anxious':
      return 'You seek closeness and can worry about rejection. You might need reassurance and are attuned to others\' emotions.';
    case 'avoidant':
      return 'You value independence and can be uncomfortable with too much closeness. You might deflect emotional topics.';
    case 'disorganized':
      return 'You have complex feelings about closeness - wanting it but also fearing it. Your responses might seem contradictory.';
    default:
      return 'You relate to others in your own unique way.';
  }
}

/**
 * Builds the user prompt with current context
 */
function buildCharacterUserPrompt(state, context, direction, agent) {
  let prompt = `SCENE: ${context.scene.location}
PRESENT: ${context.characters}
TENSION: ${state.tension}/100
MOOD: ${state.emotionalBeat}

RECENT CONVERSATION:
${context.recentConversation || '(Conversation just started)'}`;

  if (direction.context) {
    prompt += `\n\nCONTEXT: ${direction.context}`;
  }

  if (direction.type === 'responding to reader') {
    prompt += '\n\nRespond to what the reader just said/did.';
  } else if (direction.notes) {
    prompt += `\n\nNOTES: ${direction.notes}`;
  }

  if (state.questionPending) {
    prompt += `\n\n(They were asked: "${state.questionPending}")`;
  }

  prompt += `\n\nWhat do you say/do? (Stay in character, 1-3 sentences usually)`;

  return prompt;
}

/**
 * Generates a quick reaction without full AI call
 */
export function generateQuickReaction(agent, reactionType, intensity = 'moderate') {
  const { character } = agent;
  const reactions = getReactionLibrary(character);

  const options = reactions[reactionType] || reactions.neutral;
  const selected = options[Math.floor(Math.random() * options.length)];

  return {
    speaker: 'character',
    character,
    content: selected,
    mood: reactionType,
    isQuickReaction: true
  };
}

/**
 * Gets a library of quick reactions based on character voice
 */
function getReactionLibrary(character) {
  // Base reactions that get flavored by character
  const baseReactions = {
    agreement: [
      '*nods*',
      '*nods slowly*',
      '"Yeah."',
      '"Right."',
      '"Exactly."',
      '*a small nod*'
    ],
    disagreement: [
      '*shakes head*',
      '"I don\'t think so."',
      '*frowns*',
      '"That\'s not..."',
      '"No."'
    ],
    curiosity: [
      '*tilts head*',
      '"Hmm?"',
      '"What do you mean?"',
      '*raises an eyebrow*',
      '"Tell me more."'
    ],
    concern: [
      '*frowns slightly*',
      '"Are you okay?"',
      '"What\'s wrong?"',
      '*concerned look*',
      '"Hey..."'
    ],
    amusement: [
      '*laughs softly*',
      '*smirks*',
      '*chuckles*',
      '"Hah."',
      '*grins*'
    ],
    frustration: [
      '*sighs*',
      '*runs hand through hair*',
      '"Come on..."',
      '*exhales sharply*',
      '"Seriously?"'
    ],
    affection: [
      '*smiles warmly*',
      '*soft expression*',
      '*reaches out briefly*',
      '"Hey."',
      '*gentle look*'
    ],
    suspicion: [
      '*narrows eyes*',
      '"Wait..."',
      '*studies you*',
      '"Something\'s off."',
      '*skeptical look*'
    ],
    surprise: [
      '*blinks*',
      '"What?"',
      '*eyes widen*',
      '"...oh."',
      '*caught off guard*'
    ],
    thoughtfulness: [
      '*considers*',
      '*pauses*',
      '"Hmm..."',
      '*looks away, thinking*',
      '"Let me think..."'
    ],
    neutral: [
      '*looks at you*',
      '*waits*',
      '"..."',
      '*quiet*'
    ]
  };

  return baseReactions;
}

/**
 * Updates the agent's internal state after generating a response
 */
function updateAgentState(agent, response, direction) {
  // Update mood based on response content
  if (response.includes('*laughs*') || response.includes('*smiles*') || response.includes('*grins*')) {
    agent.currentMood = 'positive';
  } else if (response.includes('*frowns*') || response.includes('*sighs*') || response.includes('worried')) {
    agent.currentMood = 'concerned';
  } else if (response.includes('*angry*') || response.includes('*frustrated*')) {
    agent.currentMood = 'frustrated';
  }

  // Add to session memory
  agent.sessionMemory.push({
    response: response.slice(0, 100),
    context: direction.context,
    timestamp: Date.now()
  });

  // Keep memory bounded
  if (agent.sessionMemory.length > 20) {
    agent.sessionMemory = agent.sessionMemory.slice(-15);
  }
}

/**
 * Detects the style of a response
 */
function detectResponseStyle(response) {
  const lower = response.toLowerCase();

  if (response.length < 20) return RESPONSE_STYLES.DIRECT;
  if (lower.includes('...') && lower.includes('maybe')) return RESPONSE_STYLES.EVASIVE;
  if (lower.includes('feel') || lower.includes('heart')) return RESPONSE_STYLES.EMOTIONAL;
  if (lower.includes('*laughs*') || lower.includes('*smirks*')) return RESPONSE_STYLES.PLAYFUL;
  if (lower.includes('but') && lower.includes('...')) return RESPONSE_STYLES.GUARDED;

  return RESPONSE_STYLES.DIRECT;
}

/**
 * Generates a fallback response when AI fails
 */
function generateFallbackResponse(agent, direction) {
  const { character } = agent;
  const fallbacks = [
    `*${character.name} pauses thoughtfully*`,
    `*${character.name} considers for a moment*`,
    `"..." *${character.name} seems to be thinking*`,
    `*${character.name} looks at you*`
  ];

  return {
    speaker: 'character',
    character,
    content: fallbacks[Math.floor(Math.random() * fallbacks.length)],
    mood: 'thoughtful',
    isFallback: true
  };
}

/**
 * Generates an entrance line for when character joins scene
 */
export async function generateEntrance(agent, state, context, entranceType = 'natural') {
  const { character, aiProvider } = agent;

  const systemPrompt = buildCharacterSystemPrompt(
    character,
    state.relationships[character.name] || { trust: 50, affection: 50, tension: 0, familiarity: 0 },
    agent
  );

  const entrancePrompts = {
    natural: `You're entering the scene naturally. Greet or acknowledge those present briefly.`,
    dramatic: `You're making a dramatic entrance. Something important has happened or you have news.`,
    quiet: `You enter quietly, perhaps observing before speaking.`,
    urgent: `You burst in urgently. Something requires immediate attention.`
  };

  const userPrompt = `SCENE: ${context.scene.location}
ALREADY PRESENT: ${context.characters}
TENSION: ${state.tension}/100

${entrancePrompts[entranceType] || entrancePrompts.natural}

How do you enter/what do you say? (Brief, 1-2 sentences)`;

  try {
    const response = await aiProvider.generate(systemPrompt, userPrompt, {
      temperature: 0.8,
      maxTokens: 150
    });

    return {
      speaker: 'character',
      character,
      content: response.trim(),
      isEntrance: true,
      entranceType
    };
  } catch {
    return {
      speaker: 'character',
      character,
      content: `*${character.name} enters*`,
      isEntrance: true,
      isFallback: true
    };
  }
}

/**
 * Generates a departure line
 */
export async function generateDeparture(agent, state, reason = 'natural') {
  const { character } = agent;

  const departures = {
    natural: [
      `*${character.name} nods* "I should go."`,
      `"I'll leave you to it." *${character.name} turns to leave*`,
      `*${character.name} starts to head out*`
    ],
    urgent: [
      `"I have to go. Now." *${character.name} hurries out*`,
      `*${character.name} suddenly stands* "Something's come up."`,
      `"Sorry, I—" *${character.name} rushes off*`
    ],
    emotional: [
      `*${character.name} turns away, needing space*`,
      `"I... I need a moment." *leaves*`,
      `*${character.name} walks away without a word*`
    ]
  };

  const options = departures[reason] || departures.natural;
  return {
    speaker: 'character',
    character,
    content: options[Math.floor(Math.random() * options.length)],
    isDeparture: true
  };
}

/**
 * Calculates relationship change based on interaction
 */
export function calculateRelationshipChange(agent, interactionType, intensity = 'moderate') {
  const multiplier = intensity === 'strong' ? 2 : intensity === 'subtle' ? 0.5 : 1;

  const changes = {
    positive_interaction: { trust: 3, affection: 2, tension: -2, familiarity: 2 },
    negative_interaction: { trust: -3, affection: -2, tension: 3, familiarity: 1 },
    vulnerability_shared: { trust: 5, affection: 4, tension: -1, familiarity: 3 },
    conflict: { trust: -2, affection: -1, tension: 5, familiarity: 2 },
    conflict_resolved: { trust: 4, affection: 2, tension: -5, familiarity: 3 },
    help_given: { trust: 4, affection: 3, tension: -2, familiarity: 2 },
    help_received: { trust: 3, affection: 4, tension: -2, familiarity: 2 },
    betrayal: { trust: -10, affection: -5, tension: 8, familiarity: 2 },
    forgiveness: { trust: 3, affection: 3, tension: -4, familiarity: 4 },
    shared_moment: { trust: 2, affection: 3, tension: -1, familiarity: 4 }
  };

  const base = changes[interactionType] || { trust: 0, affection: 0, tension: 0, familiarity: 1 };

  return {
    trust: Math.round(base.trust * multiplier),
    affection: Math.round(base.affection * multiplier),
    tension: Math.round(base.tension * multiplier),
    familiarity: Math.round(base.familiarity * multiplier)
  };
}

/**
 * Updates character's current concern/internal state
 */
export function updateInternalState(agent, updates) {
  agent.internalState = {
    ...agent.internalState,
    ...updates
  };
}

/**
 * Gets the character's likely reaction type based on psychology
 */
export function predictReactionType(agent, stimulus) {
  const { character } = agent;
  const psychology = character.psychology || {};
  const attachment = psychology.attachment_style?.style || 'secure';

  // Map stimulus to likely reactions based on attachment style
  const reactionMaps = {
    secure: {
      compliment: 'affection',
      criticism: 'thoughtfulness',
      danger: 'concern',
      question: 'curiosity',
      humor: 'amusement'
    },
    anxious: {
      compliment: 'surprise',
      criticism: 'concern',
      danger: 'concern',
      question: 'curiosity',
      humor: 'amusement'
    },
    avoidant: {
      compliment: 'suspicion',
      criticism: 'frustration',
      danger: 'thoughtfulness',
      question: 'thoughtfulness',
      humor: 'amusement'
    },
    disorganized: {
      compliment: 'surprise',
      criticism: 'frustration',
      danger: 'surprise',
      question: 'suspicion',
      humor: 'amusement'
    }
  };

  const map = reactionMaps[attachment] || reactionMaps.secure;
  return map[stimulus] || 'thoughtfulness';
}

export default {
  createCharacterAgent,
  generateResponse,
  generateQuickReaction,
  generateEntrance,
  generateDeparture,
  calculateRelationshipChange,
  updateInternalState,
  predictReactionType,
  RESPONSE_STYLES,
  REACTION_TYPES
};
