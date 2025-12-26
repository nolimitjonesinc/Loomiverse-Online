/**
 * StoryDirectorAgent - The Invisible Hand Guiding the Story
 *
 * This agent orchestrates the Live Adventure experience. It decides:
 * - When to advance the scene
 * - Which character should speak next
 * - When to inject narration vs. dialogue
 * - How to manage pacing and tension
 * - When a "breath" moment is needed
 * - When to introduce complications or revelations
 *
 * Design Philosophy:
 * - The best direction is invisible direction
 * - Pacing is feel, not formula
 * - Every beat should serve the reader's emotional journey
 * - Silence and space are as important as action
 */

import {
  TENSION_LEVELS,
  EMOTIONAL_BEATS,
  SCENE_TYPES,
  updateTension,
  setEmotionalBeat,
  advanceScene,
  addPendingThread,
  plantForeshadowing,
  getContextWindow
} from './AdventureState.js';

// Direction types the Story Director can issue
export const DIRECTION_TYPES = {
  CHARACTER_SPEAKS: 'character_speaks',     // A specific character should speak
  NARRATOR_DESCRIBES: 'narrator_describes', // Scene description needed
  AWAIT_READER: 'await_reader',             // Wait for reader input
  SCENE_TRANSITION: 'scene_transition',     // Move to new scene
  TENSION_SHIFT: 'tension_shift',           // Change tension level
  BREATH_MOMENT: 'breath_moment',           // Pause for emotional space
  INTRODUCE_CHARACTER: 'introduce_character', // Bring someone in
  REVELATION: 'revelation',                 // Something important revealed
  COMPLICATION: 'complication',             // Things get more complex
  DECISION_POINT: 'decision_point'          // Reader must choose
};

// Pacing patterns
const PACING_PATTERNS = {
  ESCALATING: [20, 35, 50, 65, 80],          // Building toward climax
  OSCILLATING: [40, 60, 40, 70, 50],         // Waves of tension
  SLOW_BURN: [20, 25, 30, 40, 60, 80],       // Gradual increase
  RELEASE: [80, 60, 40, 30, 20],             // Coming down from peak
  BREATH_THEN_PEAK: [20, 15, 10, 50, 80]     // Calm before storm
};

/**
 * Creates a Story Director Agent instance
 */
export function createStoryDirector(aiProvider) {
  return {
    aiProvider,
    lastDirection: null,
    breathCounter: 0,        // Tracks exchanges since last breath
    escalationCounter: 0,    // Tracks exchanges at high tension
    pacingPattern: null,     // Current pacing pattern if any
    patternIndex: 0
  };
}

/**
 * Analyzes the current state and decides what should happen next
 * This is the core decision-making function
 */
export async function getNextDirection(director, state, lastReaderInput = null) {
  const context = getContextWindow(state);

  // Rule-based quick decisions first (for speed)
  const quickDecision = getQuickDecision(director, state, lastReaderInput);
  if (quickDecision) {
    director.lastDirection = quickDecision;
    return quickDecision;
  }

  // For more nuanced decisions, consult AI
  const aiDecision = await getAIDirection(director, state, context, lastReaderInput);
  director.lastDirection = aiDecision;
  return aiDecision;
}

/**
 * Quick rule-based decisions that don't need AI
 */
function getQuickDecision(director, state, lastReaderInput) {
  // If reader just spoke, we need a response
  if (lastReaderInput && state.lastSpeaker === 'reader') {
    // If there's a pending question, a character should respond
    if (state.questionPending) {
      return {
        type: DIRECTION_TYPES.CHARACTER_SPEAKS,
        character: state.speakingCharacter || state.presentCharacters[0],
        context: 'responding to reader',
        urgency: 'immediate'
      };
    }

    // Otherwise, interpret and respond
    return {
      type: DIRECTION_TYPES.CHARACTER_SPEAKS,
      character: selectRespondingCharacter(state),
      context: 'reacting to reader action',
      urgency: 'immediate'
    };
  }

  // Breath moment check - every 8-12 exchanges at non-peak tension
  director.breathCounter++;
  if (director.breathCounter >= 10 && state.tension < 60) {
    director.breathCounter = 0;
    return {
      type: DIRECTION_TYPES.BREATH_MOMENT,
      duration: 'brief',
      mood: state.emotionalBeat
    };
  }

  // High tension warning - can't sustain peak tension too long
  if (state.tension >= 80) {
    director.escalationCounter++;
    if (director.escalationCounter >= 5) {
      director.escalationCounter = 0;
      return {
        type: DIRECTION_TYPES.TENSION_SHIFT,
        target: 60,
        reason: 'release valve',
        method: 'resolution or pause'
      };
    }
  } else {
    director.escalationCounter = 0;
  }

  // No quick decision available
  return null;
}

/**
 * Uses AI to make nuanced direction decisions
 */
async function getAIDirection(director, state, context, lastReaderInput) {
  const systemPrompt = buildDirectorSystemPrompt();
  const userPrompt = buildDirectorUserPrompt(state, context, lastReaderInput);

  try {
    const response = await director.aiProvider.generate(systemPrompt, userPrompt, {
      temperature: 0.7,
      maxTokens: 500
    });

    return parseDirectorResponse(response, state);
  } catch (error) {
    console.error('[StoryDirector] AI error:', error);
    // Fallback to safe default
    return {
      type: DIRECTION_TYPES.CHARACTER_SPEAKS,
      character: state.presentCharacters[0] || null,
      context: 'continuing conversation',
      urgency: 'normal'
    };
  }
}

/**
 * Builds the system prompt for the Story Director AI
 */
function buildDirectorSystemPrompt() {
  return `You are an invisible Story Director for an immersive interactive narrative experience.

Your role is to decide what happens next in the story - not to write the content, but to direct the flow.

You understand:
- PACING: Stories need rhythm. Tension rises and falls. Silence has weight.
- PRESENCE: Characters should feel present, not just functional.
- BREATH: Every 8-12 exchanges, the reader needs emotional space.
- SURPRISE: Predictable is boring. But random is worse. Surprise should feel inevitable in retrospect.
- AGENCY: The reader should feel their choices matter, even when the story guides them.

Your output should be a JSON direction with:
{
  "type": "character_speaks|narrator_describes|await_reader|scene_transition|tension_shift|breath_moment|introduce_character|revelation|complication|decision_point",
  "character": "character name if applicable",
  "context": "brief context for the direction",
  "emotionalBeat": "the emotional texture to aim for",
  "tensionTarget": number 0-100 if tension should change,
  "notes": "any additional guidance for executing this direction"
}

Be economical. Most moments need simple continuation. Save big moves for when they matter.`;
}

/**
 * Builds the user prompt with current state
 */
function buildDirectorUserPrompt(state, context, lastReaderInput) {
  let prompt = `CURRENT STATE:
- Location: ${context.scene.location}
- Characters present: ${context.characters}
- Tension: ${state.tension}/100
- Emotional beat: ${state.emotionalBeat}
- Scene type: ${state.scene.type}
- Total exchanges this scene: ${state.totalExchanges}

RECENT CONVERSATION:
${context.recentConversation || 'Scene just started'}

RELATIONSHIPS:
${context.relationships}

PENDING THREADS: ${state.pendingThreads.filter(t => !t.resolved).map(t => t.description).join(', ') || 'None'}`;

  if (lastReaderInput) {
    prompt += `\n\nREADER JUST SAID/DID: "${lastReaderInput}"`;
  }

  prompt += `\n\nWhat should happen next? Consider pacing, emotional flow, and the reader's likely expectations. Output JSON direction.`;

  return prompt;
}

/**
 * Parses the AI response into a direction object
 */
function parseDirectorResponse(response, state) {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize
      return {
        type: parsed.type || DIRECTION_TYPES.CHARACTER_SPEAKS,
        character: parsed.character
          ? state.presentCharacters.find(c =>
              c.name.toLowerCase() === parsed.character.toLowerCase()
            ) || state.presentCharacters[0]
          : state.presentCharacters[0],
        context: parsed.context || 'continuing story',
        emotionalBeat: parsed.emotionalBeat || state.emotionalBeat,
        tensionTarget: parsed.tensionTarget,
        notes: parsed.notes || ''
      };
    }
  } catch (e) {
    console.warn('[StoryDirector] Failed to parse AI response:', e);
  }

  // Default fallback
  return {
    type: DIRECTION_TYPES.CHARACTER_SPEAKS,
    character: state.presentCharacters[0],
    context: 'continuing conversation',
    emotionalBeat: state.emotionalBeat
  };
}

/**
 * Selects which character should respond based on context
 */
function selectRespondingCharacter(state) {
  const present = state.presentCharacters;
  if (present.length === 0) return null;
  if (present.length === 1) return present[0];

  // If someone was just speaking, they might continue
  if (state.speakingCharacter && Math.random() > 0.4) {
    return state.speakingCharacter;
  }

  // Otherwise, choose based on relationship
  const relationships = state.relationships;
  const withRelationships = present.map(char => ({
    character: char,
    score: relationships[char.name]
      ? relationships[char.name].trust + relationships[char.name].familiarity
      : 50
  }));

  // Higher relationship = more likely to engage
  const sorted = withRelationships.sort((a, b) => b.score - a.score);

  // Weighted random selection favoring higher relationships
  const weights = sorted.map((_, i) => Math.pow(0.6, i));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < sorted.length; i++) {
    random -= weights[i];
    if (random <= 0) return sorted[i].character;
  }

  return sorted[0].character;
}

/**
 * Determines if we should introduce a scene transition
 */
export function shouldTransitionScene(state) {
  // Long scenes should transition
  if (state.totalExchanges > 20) return true;

  // After major tension release
  if (state.tension < 20 && state.recentEvents.some(e =>
    e.type === 'tension_change' && e.from > 70
  )) return true;

  // After resolution of major thread
  if (state.pendingThreads.some(t =>
    t.resolved && t.importance === 'major' && t.resolvedAt === state.sceneNumber
  )) return true;

  return false;
}

/**
 * Determines if we need a "breath" moment
 */
export function needsBreathMoment(director, state) {
  return director.breathCounter >= 8 && state.tension < 70;
}

/**
 * Gets suggested tension adjustment based on story beats
 */
export function suggestTensionAdjustment(state, storyBeat) {
  const current = state.tension;

  switch (storyBeat) {
    case 'conflict_introduced':
      return Math.min(100, current + 20);
    case 'revelation':
      return Math.min(100, current + 15);
    case 'conflict_resolved':
      return Math.max(0, current - 30);
    case 'character_bonding':
      return Math.max(20, current - 10);
    case 'danger_approaching':
      return Math.min(100, current + 25);
    case 'moment_of_peace':
      return Math.max(0, current - 20);
    case 'decision_required':
      return Math.min(100, current + 10);
    default:
      return current;
  }
}

/**
 * Creates a scene transition direction
 */
export function createSceneTransition(state, newLocation, reason) {
  return {
    type: DIRECTION_TYPES.SCENE_TRANSITION,
    from: state.scene.location,
    to: newLocation,
    reason,
    suggestedNarration: `suggest transition from ${state.scene.location?.name || 'here'} to ${newLocation.name}`
  };
}

/**
 * Creates a breath moment direction
 */
export function createBreathMoment(state, type = 'environmental') {
  const breathTypes = {
    environmental: 'A sensory detail of the environment',
    character: 'A small character moment',
    memory: 'A brief memory or association',
    physical: 'Awareness of physical sensation',
    time: 'Awareness of time passing'
  };

  return {
    type: DIRECTION_TYPES.BREATH_MOMENT,
    breathType: type,
    guidance: breathTypes[type] || breathTypes.environmental,
    mood: state.emotionalBeat,
    duration: state.tension > 50 ? 'brief' : 'lingering'
  };
}

/**
 * Creates a decision point direction
 */
export function createDecisionPoint(state, stakes, options = null) {
  return {
    type: DIRECTION_TYPES.DECISION_POINT,
    stakes,
    options, // Can be null for open-ended
    tensionBoost: 15,
    character: state.speakingCharacter || state.presentCharacters[0],
    framing: 'character asks question or presents choice'
  };
}

/**
 * Resets the director's counters (e.g., when starting new scene)
 */
export function resetDirectorCounters(director) {
  director.breathCounter = 0;
  director.escalationCounter = 0;
  director.patternIndex = 0;
}

export default {
  createStoryDirector,
  getNextDirection,
  shouldTransitionScene,
  needsBreathMoment,
  suggestTensionAdjustment,
  createSceneTransition,
  createBreathMoment,
  createDecisionPoint,
  resetDirectorCounters,
  DIRECTION_TYPES
};
