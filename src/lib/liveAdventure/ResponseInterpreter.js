/**
 * ResponseInterpreter - Understanding What the Reader Meant
 *
 * When a reader types their response, we need to understand:
 * - What action are they taking?
 * - What's their emotional tone?
 * - Are they speaking to a specific character?
 * - Is this a question, statement, or action?
 * - What story direction does this imply?
 *
 * Design Philosophy:
 * - Be generous in interpretation - assume best intent
 * - Ambiguity should default to moving story forward
 * - The reader's words should feel honored, not corrected
 * - Quick responses can be pattern-matched; complex ones need AI
 * - The story should respond to both what's said AND how it's said
 */

import { EMOTIONAL_BEATS, updateTension, recordEvent } from './AdventureState.js';

// Types of reader input
export const INPUT_TYPES = {
  DIALOGUE: 'dialogue',           // Speaking to characters
  ACTION: 'action',               // Doing something physical
  THOUGHT: 'thought',             // Internal reflection
  QUESTION: 'question',           // Asking for information
  DECISION: 'decision',           // Making a choice
  EMOTION: 'emotion',             // Expressing feeling
  OBSERVATION: 'observation',     // Noticing something
  DIRECTION: 'direction'          // Directing the story (meta)
};

// Emotional tones we can detect
export const EMOTIONAL_TONES = {
  NEUTRAL: 'neutral',
  WARM: 'warm',
  COLD: 'cold',
  ANGRY: 'angry',
  SAD: 'sad',
  EXCITED: 'excited',
  FEARFUL: 'fearful',
  CURIOUS: 'curious',
  PLAYFUL: 'playful',
  DEFIANT: 'defiant',
  VULNERABLE: 'vulnerable',
  DETERMINED: 'determined'
};

// Urgency levels
export const URGENCY = {
  IMMEDIATE: 'immediate',     // Needs response right now
  NORMAL: 'normal',           // Standard conversational pace
  REFLECTIVE: 'reflective'    // Can take time, breathing room
};

/**
 * Creates a Response Interpreter
 */
export function createResponseInterpreter(aiProvider) {
  return {
    aiProvider,

    // Pattern libraries for quick matching
    patterns: {
      questions: /\?$|^(what|who|where|when|why|how|is|are|do|does|can|could|would|will|did)\b/i,
      actions: /^\*|^I\s+(walk|go|move|run|take|grab|look|turn|open|close|push|pull|pick|put|touch|reach|stand|sit|leave|enter|follow|approach|examine)/i,
      dialogue: /^["']|^I\s+(say|tell|ask|reply|respond|answer|whisper|shout|mutter)/i,
      emotions: /^I\s+(feel|am\s+feeling)|^\*?(nervous|scared|happy|sad|angry|confused|worried|relieved|excited)\*?$/i,
      decisions: /^(let's|we should|I choose|I'll|I decide|okay|yes|no|agreed|fine|alright)/i,
      affirmative: /^(yes|yeah|yep|sure|okay|ok|alright|fine|agreed|definitely|absolutely|of course)/i,
      negative: /^(no|nope|nah|never|refuse|won't|can't|don't|I don't think so)/i,
      uncertain: /^(maybe|perhaps|I'm not sure|I don't know|possibly|it depends)/i
    },

    // Quick response templates
    quickResponses: {}
  };
}

/**
 * Main interpretation function - understands reader input
 */
export async function interpretResponse(interpreter, state, input) {
  const trimmedInput = input.trim();

  // Quick pattern matching first
  const quickInterpretation = quickInterpret(interpreter, trimmedInput, state);
  if (quickInterpretation.confidence > 0.8) {
    return quickInterpretation;
  }

  // Use AI for complex interpretation
  return await aiInterpret(interpreter, trimmedInput, state);
}

/**
 * Quick pattern-based interpretation
 */
function quickInterpret(interpreter, input, state) {
  const { patterns } = interpreter;
  const lower = input.toLowerCase();

  let interpretation = {
    input,
    type: INPUT_TYPES.DIALOGUE, // Default
    tone: EMOTIONAL_TONES.NEUTRAL,
    urgency: URGENCY.NORMAL,
    targetCharacter: null,
    actionVerb: null,
    confidence: 0.5,
    storyImplication: null
  };

  // Check for question
  if (patterns.questions.test(input)) {
    interpretation.type = INPUT_TYPES.QUESTION;
    interpretation.confidence = 0.85;
    interpretation.urgency = URGENCY.NORMAL;
  }

  // Check for action
  const actionMatch = input.match(patterns.actions);
  if (actionMatch) {
    interpretation.type = INPUT_TYPES.ACTION;
    interpretation.actionVerb = extractActionVerb(input);
    interpretation.confidence = 0.9;

    // Some actions feel more urgent
    if (/run|grab|quick|fast|hurry/i.test(input)) {
      interpretation.urgency = URGENCY.IMMEDIATE;
    }
  }

  // Check for explicit dialogue
  if (patterns.dialogue.test(input) || /^["']/.test(input)) {
    interpretation.type = INPUT_TYPES.DIALOGUE;
    interpretation.confidence = 0.9;
  }

  // Check for emotional expression
  if (patterns.emotions.test(input)) {
    interpretation.type = INPUT_TYPES.EMOTION;
    interpretation.tone = detectEmotionalTone(input);
    interpretation.confidence = 0.85;
    interpretation.urgency = URGENCY.REFLECTIVE;
  }

  // Check for decision markers
  if (patterns.decisions.test(input)) {
    interpretation.type = INPUT_TYPES.DECISION;
    interpretation.confidence = 0.85;

    // Determine if affirmative or negative
    if (patterns.affirmative.test(lower)) {
      interpretation.decisionType = 'affirmative';
    } else if (patterns.negative.test(lower)) {
      interpretation.decisionType = 'negative';
    } else if (patterns.uncertain.test(lower)) {
      interpretation.decisionType = 'uncertain';
    }
  }

  // Detect emotional tone
  interpretation.tone = detectEmotionalTone(input);

  // Check for character targeting
  interpretation.targetCharacter = detectTargetCharacter(input, state);

  // Infer story implication
  interpretation.storyImplication = inferStoryImplication(interpretation, state);

  return interpretation;
}

/**
 * AI-based interpretation for complex inputs
 */
async function aiInterpret(interpreter, input, state) {
  const context = buildInterpretationContext(state);

  const systemPrompt = `You are interpreting reader input for an interactive story.

Analyze what the reader meant and output JSON:
{
  "type": "dialogue|action|thought|question|decision|emotion|observation|direction",
  "tone": "neutral|warm|cold|angry|sad|excited|fearful|curious|playful|defiant|vulnerable|determined",
  "urgency": "immediate|normal|reflective",
  "targetCharacter": "character name or null",
  "actionVerb": "main action verb or null",
  "dialogue": "extracted speech if any",
  "storyImplication": "what this means for the story",
  "emotionalWeight": number 1-10,
  "notes": "any other relevant interpretation"
}

Be generous - assume the reader knows what they want even if unclear.
Honor their intent. Don't override their agency.`;

  const userPrompt = `CONTEXT:
${context}

READER INPUT: "${input}"

What did they mean? What should the story do with this?`;

  try {
    const response = await interpreter.aiProvider.generate(systemPrompt, userPrompt, {
      temperature: 0.3, // Lower temperature for more consistent interpretation
      maxTokens: 300
    });

    const parsed = parseAIInterpretation(response);
    return {
      input,
      ...parsed,
      confidence: 0.85
    };
  } catch (error) {
    console.error('[ResponseInterpreter] AI error:', error);
    // Fall back to quick interpretation
    return quickInterpret(interpreter, input, state);
  }
}

/**
 * Builds context for AI interpretation
 */
function buildInterpretationContext(state) {
  const presentChars = state.presentCharacters.map(c => c.name).join(', ');
  const recentExchanges = state.conversationHistory.slice(-4)
    .map(e => `${e.speaker}: ${e.content.slice(0, 50)}...`)
    .join('\n');

  return `Location: ${state.scene.location?.name || 'Unknown'}
Characters present: ${presentChars || 'None'}
Tension: ${state.tension}/100
Pending question: ${state.questionPending || 'None'}

Recent conversation:
${recentExchanges || '(Just started)'}`;
}

/**
 * Parses AI interpretation response
 */
function parseAIInterpretation(response) {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        type: parsed.type || INPUT_TYPES.DIALOGUE,
        tone: parsed.tone || EMOTIONAL_TONES.NEUTRAL,
        urgency: parsed.urgency || URGENCY.NORMAL,
        targetCharacter: parsed.targetCharacter || null,
        actionVerb: parsed.actionVerb || null,
        dialogue: parsed.dialogue || null,
        storyImplication: parsed.storyImplication || null,
        emotionalWeight: parsed.emotionalWeight || 5,
        notes: parsed.notes || ''
      };
    }
  } catch (e) {
    console.warn('[ResponseInterpreter] Failed to parse AI response:', e);
  }

  return {
    type: INPUT_TYPES.DIALOGUE,
    tone: EMOTIONAL_TONES.NEUTRAL,
    urgency: URGENCY.NORMAL
  };
}

/**
 * Extracts the main action verb from input
 */
function extractActionVerb(input) {
  const actionPatterns = [
    /I\s+(\w+)/i,
    /^\*(\w+)/i,
    /^(\w+ing)/i
  ];

  for (const pattern of actionPatterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1].toLowerCase();
    }
  }

  return null;
}

/**
 * Detects the emotional tone of input
 */
function detectEmotionalTone(input) {
  const lower = input.toLowerCase();

  // Check for explicit emotions
  const toneMarkers = {
    [EMOTIONAL_TONES.ANGRY]: /angry|furious|mad|pissed|hate|damn|hell/,
    [EMOTIONAL_TONES.SAD]: /sad|cry|tears|sorry|miss|regret|lost/,
    [EMOTIONAL_TONES.EXCITED]: /!{2,}|excited|amazing|wow|can't believe|yes!/,
    [EMOTIONAL_TONES.FEARFUL]: /scared|afraid|terrified|nervous|worried|danger/,
    [EMOTIONAL_TONES.CURIOUS]: /wonder|curious|interesting|tell me|explain|why|how/,
    [EMOTIONAL_TONES.PLAYFUL]: /haha|lol|joke|tease|wink|;-?\)|:p/,
    [EMOTIONAL_TONES.WARM]: /thank|love|care|friend|together|trust/,
    [EMOTIONAL_TONES.COLD]: /whatever|fine|okay I guess|don't care|doesn't matter/,
    [EMOTIONAL_TONES.DEFIANT]: /no way|refuse|never|won't|can't make me|over my dead/,
    [EMOTIONAL_TONES.VULNERABLE]: /I don't know|help|please|scared|alone|need/,
    [EMOTIONAL_TONES.DETERMINED]: /I will|must|have to|going to|nothing will stop/
  };

  for (const [tone, pattern] of Object.entries(toneMarkers)) {
    if (pattern.test(lower)) {
      return tone;
    }
  }

  // Check punctuation and casing
  if (input.includes('!') && input.toUpperCase() === input && input.length > 3) {
    return EMOTIONAL_TONES.EXCITED; // Shouting
  }

  if (input.endsWith('...')) {
    return EMOTIONAL_TONES.VULNERABLE; // Trailing off, uncertain
  }

  return EMOTIONAL_TONES.NEUTRAL;
}

/**
 * Detects if the reader is targeting a specific character
 */
function detectTargetCharacter(input, state) {
  const presentCharacters = state.presentCharacters || [];

  for (const char of presentCharacters) {
    const name = char.name.toLowerCase();
    const inputLower = input.toLowerCase();

    // Check for direct address
    if (inputLower.includes(name) ||
        inputLower.includes(`to ${name}`) ||
        inputLower.includes(`at ${name}`) ||
        inputLower.startsWith(`${name},`) ||
        inputLower.startsWith(`${name}:`)) {
      return char;
    }

    // Check for "him/her/them" references if only one character
    if (presentCharacters.length === 1) {
      if (/\b(him|her|them|you)\b/i.test(input)) {
        return char;
      }
    }
  }

  // If there's only one character and it's dialogue, assume targeting them
  if (presentCharacters.length === 1) {
    return presentCharacters[0];
  }

  // If someone was speaking, might be responding to them
  if (state.speakingCharacter) {
    return state.speakingCharacter;
  }

  return null;
}

/**
 * Infers what this input means for the story
 */
function inferStoryImplication(interpretation, state) {
  const { type, tone, targetCharacter, decisionType } = interpretation;

  // Decision implications
  if (type === INPUT_TYPES.DECISION) {
    if (decisionType === 'affirmative') {
      return 'Reader agrees/accepts - move forward with proposed action';
    } else if (decisionType === 'negative') {
      return 'Reader refuses/declines - seek alternative or escalate';
    } else {
      return 'Reader is uncertain - character might push for clarity';
    }
  }

  // Question implications
  if (type === INPUT_TYPES.QUESTION) {
    return 'Reader seeks information - character should answer or deflect';
  }

  // Action implications
  if (type === INPUT_TYPES.ACTION) {
    return 'Reader takes action - narrate result and character reactions';
  }

  // Emotional implications
  if (type === INPUT_TYPES.EMOTION) {
    if (tone === EMOTIONAL_TONES.VULNERABLE) {
      return 'Emotional moment - characters should respond with care';
    } else if (tone === EMOTIONAL_TONES.ANGRY) {
      return 'Conflict moment - characters react to anger appropriately';
    }
    return 'Emotional expression - acknowledge and respond to feeling';
  }

  // Dialogue with specific character
  if (type === INPUT_TYPES.DIALOGUE && targetCharacter) {
    return `Dialogue directed at ${targetCharacter.name} - they should respond`;
  }

  return 'Continue conversation naturally';
}

/**
 * Determines how the story should respond to this interpretation
 */
export function determineStoryResponse(interpretation, state) {
  const { type, tone, urgency, targetCharacter, storyImplication } = interpretation;

  const response = {
    shouldNarrate: false,
    shouldCharacterSpeak: true,
    speakingCharacter: targetCharacter || state.speakingCharacter || state.presentCharacters[0],
    narrateFirst: false,
    suggestedBeat: state.emotionalBeat,
    tensionAdjustment: 0
  };

  // Actions usually need narration first
  if (type === INPUT_TYPES.ACTION) {
    response.shouldNarrate = true;
    response.narrateFirst = true;
    response.narrateType = 'action_result';
  }

  // Emotional expressions might adjust tension
  if (type === INPUT_TYPES.EMOTION) {
    if (tone === EMOTIONAL_TONES.ANGRY || tone === EMOTIONAL_TONES.DEFIANT) {
      response.tensionAdjustment = 10;
    } else if (tone === EMOTIONAL_TONES.VULNERABLE || tone === EMOTIONAL_TONES.SAD) {
      response.tensionAdjustment = -5;
      response.suggestedBeat = EMOTIONAL_BEATS.INTIMACY;
    }
  }

  // Decisions can change story direction significantly
  if (type === INPUT_TYPES.DECISION) {
    if (interpretation.decisionType === 'affirmative') {
      response.shouldNarrate = true;
      response.narrateType = 'story_advancement';
    } else if (interpretation.decisionType === 'negative') {
      response.tensionAdjustment = 5;
    }
  }

  // High urgency inputs need immediate response
  if (urgency === URGENCY.IMMEDIATE) {
    response.shouldNarrate = true;
    response.narrateFirst = true;
    response.tensionAdjustment += 5;
  }

  return response;
}

/**
 * Extracts quoted dialogue from input
 */
export function extractDialogue(input) {
  // Check for quoted text
  const quoteMatch = input.match(/["']([^"']+)["']/);
  if (quoteMatch) {
    return quoteMatch[1];
  }

  // Check for "I say/tell/ask" patterns
  const sayMatch = input.match(/I\s+(say|tell|ask|reply|respond)[^"']*["']([^"']+)["']/i);
  if (sayMatch) {
    return sayMatch[2];
  }

  // If input starts with quote-like beginning, take as dialogue
  if (/^["']/.test(input)) {
    return input.replace(/^["']|["']$/g, '');
  }

  return null;
}

/**
 * Extracts action from input
 */
export function extractAction(input) {
  // Check for asterisk actions
  const asteriskMatch = input.match(/\*([^*]+)\*/);
  if (asteriskMatch) {
    return asteriskMatch[1];
  }

  // Check for "I [verb]" patterns
  const iMatch = input.match(/^I\s+(\w+(?:\s+\w+){0,5})/i);
  if (iMatch) {
    return iMatch[1];
  }

  return null;
}

/**
 * Checks if input is asking to leave/exit
 */
export function isExitIntent(input) {
  const lower = input.toLowerCase();
  return /\b(leave|exit|go|walk away|get out|I'm done|bye|goodbye|farewell)\b/.test(lower);
}

/**
 * Checks if input is asking for help/clarification
 */
export function isHelpIntent(input) {
  const lower = input.toLowerCase();
  return /\b(help|what can I|what should I|options|choices|hint|confused)\b/.test(lower);
}

export default {
  createResponseInterpreter,
  interpretResponse,
  determineStoryResponse,
  extractDialogue,
  extractAction,
  isExitIntent,
  isHelpIntent,
  INPUT_TYPES,
  EMOTIONAL_TONES,
  URGENCY
};
