/**
 * NarratorAgent - The Voice Between the Voices
 *
 * The Narrator Agent handles everything that isn't character dialogue:
 * - Scene descriptions and transitions
 * - Environmental storytelling
 * - Sensory details that create immersion
 * - The "breath" moments of quiet beauty
 * - Action sequences and physical events
 * - Time passage and atmosphere
 *
 * Design Philosophy:
 * - Show, don't tell (but tell beautifully when needed)
 * - Sensory details anchor the reader in the world
 * - Less is often more - evocative fragments beat lengthy descriptions
 * - The narrator should feel like a presence, not a function
 * - Silence and white space are narrative tools
 */

import { EMOTIONAL_BEATS, SCENE_TYPES, getContextWindow } from './AdventureState.js';

// Narration types
export const NARRATION_TYPES = {
  SCENE_SETTING: 'scene_setting',       // Describing a new location
  TRANSITION: 'transition',             // Moving between scenes
  ACTION: 'action',                     // Physical events happening
  SENSORY: 'sensory',                   // A specific sensory detail
  BREATH: 'breath',                     // A moment of quiet presence
  TIME_PASSAGE: 'time_passage',         // Time moving forward
  ATMOSPHERE: 'atmosphere',             // Mood and feeling of a space
  INTERNAL: 'internal',                 // Reader's internal experience
  REVELATION: 'revelation',             // Something significant revealed
  FORESHADOW: 'foreshadow'              // Subtle hint of things to come
};

// Sensory channels for immersive details
export const SENSORY_CHANNELS = {
  VISUAL: 'visual',       // What you see
  AUDITORY: 'auditory',   // What you hear
  TACTILE: 'tactile',     // What you feel/touch
  OLFACTORY: 'olfactory', // What you smell
  KINETIC: 'kinetic'      // Sense of movement/body
};

/**
 * Creates a Narrator Agent
 */
export function createNarratorAgent(aiProvider, genre = 'literary') {
  return {
    aiProvider,
    genre,

    // Voice settings
    voice: {
      tone: 'evocative',        // evocative, sparse, lyrical, stark, warm
      perspective: 'second',     // second person ("You...") for immersion
      verbosity: 'economical'    // economical, moderate, expansive
    },

    // Tracks what's been described to avoid repetition
    describedElements: new Set(),

    // Sensory detail bank for this scene
    sensoryBank: [],

    // Last narration for continuity
    lastNarration: null
  };
}

/**
 * Generates narration based on type and context
 */
export async function generateNarration(narrator, state, type, direction = {}) {
  const context = getContextWindow(state);

  // Quick narrations that don't need AI
  if (type === NARRATION_TYPES.BREATH && !direction.requiresAI) {
    return generateQuickBreath(narrator, state);
  }

  const systemPrompt = buildNarratorSystemPrompt(narrator, state);
  const userPrompt = buildNarratorUserPrompt(type, context, direction, narrator);

  try {
    const response = await narrator.aiProvider.generate(systemPrompt, userPrompt, {
      temperature: 0.8,
      maxTokens: 200
    });

    narrator.lastNarration = response.trim();

    return {
      speaker: 'narrator',
      content: response.trim(),
      type,
      mood: state.emotionalBeat
    };
  } catch (error) {
    console.error('[NarratorAgent] Generation error:', error);
    return generateFallbackNarration(narrator, type, state);
  }
}

/**
 * Builds the narrator's system prompt
 */
function buildNarratorSystemPrompt(narrator, state) {
  const toneGuidance = {
    evocative: 'Use vivid, specific details that evoke feeling. Every word should earn its place.',
    sparse: 'Be minimal. Short sentences. White space is your friend. Hemingway, not Faulkner.',
    lyrical: 'Allow beauty in the prose. Rhythm matters. But never at the cost of clarity.',
    stark: 'Direct. Unflinching. No flourishes. The facts carry their own weight.',
    warm: 'Gentle. Intimate. Like sharing a moment with someone you trust.'
  };

  const genreGuidance = getGenreGuidance(narrator.genre);

  return `You are the narrator of an immersive interactive story experience.

VOICE:
- Second person perspective ("You..." "Your...")
- ${toneGuidance[narrator.voice.tone] || toneGuidance.evocative}
- ${narrator.voice.verbosity === 'economical' ? 'Keep narration to 1-2 sentences usually. Fragments are fine.' : 'Moderate length, 2-3 sentences.'}

GENRE: ${narrator.genre}
${genreGuidance}

PRINCIPLES:
- Sensory details anchor the reader in the world
- Show emotions through physical details (tight jaw, shallow breath) not labels
- Leave space for the reader's imagination
- The best description makes the reader feel present
- Silence between moments matters

AVOID:
- Purple prose or overwrought description
- Telling the reader what to feel
- Repeating what was just said in dialogue
- Explaining too much

CURRENT MOOD: ${state.emotionalBeat}
TENSION: ${state.tension}/100`;
}

/**
 * Gets genre-specific guidance
 */
function getGenreGuidance(genre) {
  const guidance = {
    fantasy: 'Wonder lives in specific details. Magic should feel tactile, grounded in sensation.',
    scifi: 'Technology through its effects, not exposition. The future is lived, not explained.',
    thriller: 'Tension in the small things. The click of a door. A shadow. Economy creates suspense.',
    romance: 'Intimacy in glances, touches, unfinished sentences. What\'s unsaid matters most.',
    horror: 'Dread builds in the ordinary. The familiar made strange. Don\'t rush the fear.',
    mystery: 'Details that might be clues. Atmosphere that suggests secrets. Let the reader wonder.',
    literary: 'Character reveals through world. Environment as emotional landscape.',
    default: 'Stay true to the emotional core of each moment.'
  };

  return guidance[genre?.toLowerCase()] || guidance.default;
}

/**
 * Builds the user prompt for narration
 */
function buildNarratorUserPrompt(type, context, direction, narrator) {
  let prompt = `SCENE: ${context.scene.location}
${context.scene.description ? `DESCRIPTION: ${context.scene.description}` : ''}
TIME: ${context.scene.timeOfDay}
${context.scene.weather ? `WEATHER: ${context.scene.weather}` : ''}
CHARACTERS PRESENT: ${context.characters}
TENSION: ${context.tension}/100
EMOTIONAL BEAT: ${context.emotionalBeat}`;

  // Type-specific instructions
  const typeInstructions = {
    [NARRATION_TYPES.SCENE_SETTING]: `Describe this location as the reader enters/experiences it. Focus on 2-3 vivid sensory details that capture its essence. What do they notice first? What's the feeling of this place?`,

    [NARRATION_TYPES.TRANSITION]: `Create a brief transition from ${direction.from || 'the previous scene'} to ${direction.to || 'the new scene'}. Time can compress. Focus on the feeling of movement or change.`,

    [NARRATION_TYPES.ACTION]: `Describe this action/event: "${direction.action || 'something happens'}". Make it visceral. Physical. Present tense feeling even in past tense. Keep it punchy.`,

    [NARRATION_TYPES.SENSORY]: `Give a single sensory detail using ${direction.sense || 'any sense'}. Just a fragment, a moment of presence. No more than one sentence.`,

    [NARRATION_TYPES.BREATH]: `Create a "breath" moment - a pause of quiet beauty or presence. ${direction.guidance || 'Something small that makes the reader feel present.'}. This is not plot, just being. One sentence fragment is enough.`,

    [NARRATION_TYPES.TIME_PASSAGE]: `Indicate time passing: ${direction.duration || 'some time'}. Don't be literal. Capture it in a detail or sensation rather than stating it.`,

    [NARRATION_TYPES.ATMOSPHERE]: `Evoke the atmosphere right now. Mood through environment. What's in the air, literally or figuratively?`,

    [NARRATION_TYPES.INTERNAL]: `A brief flash of the reader's internal experience. A thought, sensation, or feeling. Keep it in second person, keep it immediate.`,

    [NARRATION_TYPES.REVELATION]: `Frame this revelation: "${direction.revelation || 'something important'}". Let it land. Sometimes silence after impact is powerful.`,

    [NARRATION_TYPES.FORESHADOW]: `Plant a subtle seed for later: "${direction.hint || 'something to come'}". The reader might not notice now. That's okay. Subtlety is the goal.`
  };

  prompt += `\n\n${typeInstructions[type] || 'Narrate what happens next briefly.'}`;

  if (direction.notes) {
    prompt += `\n\nADDITIONAL NOTES: ${direction.notes}`;
  }

  return prompt;
}

/**
 * Generates a quick breath moment without AI
 */
function generateQuickBreath(narrator, state) {
  const breathMoments = getBreathMoments(state);
  const selected = breathMoments[Math.floor(Math.random() * breathMoments.length)];

  return {
    speaker: 'narrator',
    content: selected,
    type: NARRATION_TYPES.BREATH,
    isQuickBreath: true
  };
}

/**
 * Gets a bank of breath moments appropriate to context
 */
function getBreathMoments(state) {
  const location = state.scene.location?.name?.toLowerCase() || '';
  const timeOfDay = state.scene.timeOfDay;
  const tension = state.tension;

  // Low tension breath moments
  if (tension < 40) {
    const lowTension = [
      'A moment of stillness.',
      'Silence settles.',
      'You breathe.',
      'The world holds.',
      'Just this. Just now.',
      'A pause in the current of things.'
    ];

    // Time-specific
    if (timeOfDay === 'morning') {
      lowTension.push('Light finds its way in.', 'The day is still new.');
    } else if (timeOfDay === 'evening') {
      lowTension.push('Shadows lengthen.', 'The day begins to let go.');
    } else if (timeOfDay === 'night') {
      lowTension.push('The dark is gentle here.', 'Night sounds, distant.');
    }

    return lowTension;
  }

  // Medium tension breath moments
  if (tension < 70) {
    return [
      'A beat. Then—',
      'You wait.',
      'Something in the air.',
      'The silence is heavy.',
      'Not yet. Not quite.',
      'Between one moment and the next.'
    ];
  }

  // High tension breath moments
  return [
    'Your heart. Loud.',
    'Time stretches.',
    'Everything sharp. Present.',
    'The air itself holds its breath.',
    'This moment. This.',
    'No going back from here.'
  ];
}

/**
 * Generates a fallback narration
 */
function generateFallbackNarration(narrator, type, state) {
  const fallbacks = {
    [NARRATION_TYPES.SCENE_SETTING]: 'You take in your surroundings.',
    [NARRATION_TYPES.TRANSITION]: 'Time passes. Things shift.',
    [NARRATION_TYPES.ACTION]: 'Something happens.',
    [NARRATION_TYPES.BREATH]: 'A moment passes.',
    default: 'The story continues.'
  };

  return {
    speaker: 'narrator',
    content: fallbacks[type] || fallbacks.default,
    type,
    isFallback: true
  };
}

/**
 * Generates a scene description for a new location
 */
export async function describeScene(narrator, state, location) {
  return generateNarration(narrator, state, NARRATION_TYPES.SCENE_SETTING, {
    location
  });
}

/**
 * Generates a scene transition
 */
export async function transitionScene(narrator, state, fromLocation, toLocation) {
  return generateNarration(narrator, state, NARRATION_TYPES.TRANSITION, {
    from: fromLocation?.name || 'here',
    to: toLocation?.name || 'there'
  });
}

/**
 * Generates an action description
 */
export async function describeAction(narrator, state, action) {
  return generateNarration(narrator, state, NARRATION_TYPES.ACTION, {
    action
  });
}

/**
 * Generates a sensory detail
 */
export async function addSensoryDetail(narrator, state, sense = null) {
  const senses = Object.values(SENSORY_CHANNELS);
  const selectedSense = sense || senses[Math.floor(Math.random() * senses.length)];

  return generateNarration(narrator, state, NARRATION_TYPES.SENSORY, {
    sense: selectedSense
  });
}

/**
 * Generates a breath moment
 */
export async function createBreathMoment(narrator, state, useAI = false) {
  if (!useAI) {
    return generateQuickBreath(narrator, state);
  }

  const breathTypes = [
    'environmental',
    'physical sensation',
    'awareness of time',
    'moment of beauty',
    'stillness'
  ];

  return generateNarration(narrator, state, NARRATION_TYPES.BREATH, {
    guidance: breathTypes[Math.floor(Math.random() * breathTypes.length)],
    requiresAI: true
  });
}

/**
 * Generates time passage narration
 */
export async function indicateTimePassing(narrator, state, duration) {
  return generateNarration(narrator, state, NARRATION_TYPES.TIME_PASSAGE, {
    duration
  });
}

/**
 * Generates atmosphere description
 */
export async function describeAtmosphere(narrator, state) {
  return generateNarration(narrator, state, NARRATION_TYPES.ATMOSPHERE);
}

/**
 * Frames an internal reader experience
 */
export async function narrateInternal(narrator, state, direction = {}) {
  return generateNarration(narrator, state, NARRATION_TYPES.INTERNAL, direction);
}

/**
 * Frames a revelation
 */
export async function frameRevelation(narrator, state, revelation) {
  return generateNarration(narrator, state, NARRATION_TYPES.REVELATION, {
    revelation
  });
}

/**
 * Plants foreshadowing
 */
export async function plantForeshadowing(narrator, state, hint) {
  return generateNarration(narrator, state, NARRATION_TYPES.FORESHADOW, {
    hint
  });
}

/**
 * Adds a sensory detail to the current scene's bank
 */
export function addToSensoryBank(narrator, detail) {
  narrator.sensoryBank.push({
    detail,
    timestamp: Date.now()
  });

  // Keep bank bounded
  if (narrator.sensoryBank.length > 10) {
    narrator.sensoryBank = narrator.sensoryBank.slice(-8);
  }
}

/**
 * Gets unused sensory details
 */
export function getAvailableSensoryDetails(narrator) {
  return narrator.sensoryBank.filter(d => !d.used);
}

/**
 * Marks described elements to avoid repetition
 */
export function markAsDescribed(narrator, element) {
  narrator.describedElements.add(element);
}

/**
 * Clears described elements (e.g., for new scene)
 */
export function clearDescribedElements(narrator) {
  narrator.describedElements.clear();
  narrator.sensoryBank = [];
}

/**
 * Updates narrator voice settings
 */
export function updateNarratorVoice(narrator, updates) {
  narrator.voice = {
    ...narrator.voice,
    ...updates
  };
}

export default {
  createNarratorAgent,
  generateNarration,
  describeScene,
  transitionScene,
  describeAction,
  addSensoryDetail,
  createBreathMoment,
  indicateTimePassing,
  describeAtmosphere,
  narrateInternal,
  frameRevelation,
  plantForeshadowing,
  addToSensoryBank,
  getAvailableSensoryDetails,
  markAsDescribed,
  clearDescribedElements,
  updateNarratorVoice,
  NARRATION_TYPES,
  SENSORY_CHANNELS
};
