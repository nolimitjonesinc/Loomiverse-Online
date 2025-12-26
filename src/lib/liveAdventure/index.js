/**
 * Live Adventure Engine - Main Entry Point
 *
 * This is the orchestration layer that brings all agents together
 * to create the Live Adventure experience.
 *
 * Usage:
 *   const engine = createLiveAdventureEngine(aiProvider);
 *   const adventure = await engine.startAdventure(storyBible, readerName);
 *   const response = await engine.processReaderInput(adventure, "I walk toward the door");
 */

// Export all modules
export * from './AdventureState.js';
export * from './StoryDirectorAgent.js';
export * from './CharacterAgent.js';
export * from './NarratorAgent.js';
export * from './ResponseInterpreter.js';

// Psychological Depth modules
export * from './ReaderProfile.js';
export * from './AttachmentEngine.js';
export * from './EmotionalResonance.js';
export * from './MemorySystem.js';
// Export TensionManager selectively to avoid TENSION_LEVELS conflict
export {
  createTensionManager,
  recordTensionEvent,
  needsBreathMoment,
  recordBreathMoment,
  getPacingRecommendation,
  getTensionContext,
  setTensionGoal,
  getTensionGoalProgress,
  clearTensionGoal,
  getAverageTension,
  getTensionVolatility,
  isInSpike,
  isInLull,
  adaptToReaderTolerance,
  resetForNewScene,
  serializeTensionManager,
  deserializeTensionManager,
  PACING_MODES,
  TENSION_EVENTS,
  GENRE_PROFILES
} from './TensionManager.js';
// Also export as alias for direct access
export { TENSION_LEVELS as TM_TENSION_LEVELS } from './TensionManager.js';

// Surprise & Delight modules
export * from './CharacterEvolution.js';
export * from './HiddenThreads.js';
export * from './EmergentMoments.js';
export * from './CharacterCrossTalk.js';
export * from './BreathSystem.js';

// Import for internal use
import {
  createAdventureState,
  addCharacterToScene,
  addToConversation,
  updateTension,
  setEmotionalBeat,
  setAwaitingResponse,
  clearAwaitingResponse,
  updateRelationship,
  getContextWindow,
  advanceScene,
  TENSION_LEVELS,
  EMOTIONAL_BEATS
} from './AdventureState.js';

import {
  createStoryDirector,
  getNextDirection,
  resetDirectorCounters,
  DIRECTION_TYPES
} from './StoryDirectorAgent.js';

import {
  createCharacterAgent,
  generateResponse as generateCharacterResponse,
  generateEntrance,
  calculateRelationshipChange
} from './CharacterAgent.js';

import {
  createNarratorAgent,
  generateNarration,
  describeScene,
  createBreathMoment,
  NARRATION_TYPES
} from './NarratorAgent.js';

import {
  createResponseInterpreter,
  interpretResponse,
  determineStoryResponse,
  INPUT_TYPES
} from './ResponseInterpreter.js';

/**
 * Creates an AI Provider wrapper that standardizes API calls
 */
export function createAIProvider(config) {
  const { openaiKey, anthropicKey, preferredProvider = 'openai' } = config;

  return {
    preferredProvider,

    async generate(systemPrompt, userPrompt, options = {}) {
      const { temperature = 0.8, maxTokens = 500 } = options;

      // Try preferred provider first, fall back to other
      const providers = preferredProvider === 'openai'
        ? [{ key: openaiKey, endpoint: '/api/openai', type: 'openai' },
           { key: anthropicKey, endpoint: '/api/anthropic', type: 'anthropic' }]
        : [{ key: anthropicKey, endpoint: '/api/anthropic', type: 'anthropic' },
           { key: openaiKey, endpoint: '/api/openai', type: 'openai' }];

      for (const provider of providers) {
        if (!provider.key) continue;

        try {
          const body = provider.type === 'openai'
            ? {
                model: 'gpt-4o-mini',
                max_tokens: maxTokens,
                temperature,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt }
                ]
              }
            : {
                model: 'claude-sonnet-4-20250514',
                max_tokens: maxTokens,
                temperature,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }]
              };

          const response = await fetch(provider.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });

          if (!response.ok) {
            console.warn(`[AIProvider] ${provider.type} failed:`, response.status);
            continue;
          }

          const data = await response.json();

          // Extract text from response
          if (provider.type === 'openai') {
            return data.choices?.[0]?.message?.content || '';
          } else {
            return data.content?.[0]?.text || '';
          }
        } catch (error) {
          console.warn(`[AIProvider] ${provider.type} error:`, error);
          continue;
        }
      }

      throw new Error('All AI providers failed');
    }
  };
}

/**
 * Creates the main Live Adventure Engine
 */
export function createLiveAdventureEngine(aiProvider) {
  // Create all agents
  const storyDirector = createStoryDirector(aiProvider);
  const narrator = createNarratorAgent(aiProvider);
  const interpreter = createResponseInterpreter(aiProvider);

  // Character agents are created per-character when they enter
  const characterAgents = new Map();

  return {
    aiProvider,
    storyDirector,
    narrator,
    interpreter,
    characterAgents,

    /**
     * Starts a new adventure
     */
    async startAdventure(storyBible, readerName = 'You') {
      // Create initial state
      const state = createAdventureState(storyBible, readerName);

      // Add initial characters from story bible
      let updatedState = state;
      const activeCharacters = storyBible.getActiveCharacters?.() ||
        Object.values(storyBible.characters || {}).filter(c => c.status !== 'inactive');

      for (const character of activeCharacters.slice(0, 3)) { // Max 3 to start
        updatedState = addCharacterToScene(updatedState, character);

        // Create character agent
        const agent = createCharacterAgent(character, aiProvider);
        characterAgents.set(character.name, agent);
      }

      // Set initial scene from story bible
      if (storyBible.setting) {
        updatedState = {
          ...updatedState,
          scene: {
            ...updatedState.scene,
            location: {
              name: storyBible.setting,
              description: storyBible.settingDescription || ''
            }
          }
        };
      }

      return updatedState;
    },

    /**
     * Generates the opening of the adventure
     */
    async generateOpening(state) {
      const outputs = [];

      // Scene description
      const sceneNarration = await describeScene(narrator, state, state.scene.location);
      outputs.push(sceneNarration);

      // Update state with narration
      let updatedState = addToConversation(state, sceneNarration);

      // First character speaks (if any)
      if (state.presentCharacters.length > 0) {
        const firstChar = state.presentCharacters[0];
        const agent = characterAgents.get(firstChar.name);

        if (agent) {
          const greeting = await generateCharacterResponse(agent, updatedState, getContextWindow(updatedState), {
            context: 'Opening greeting to the reader',
            type: 'opening'
          });
          outputs.push(greeting);
          updatedState = addToConversation(updatedState, greeting);
        }
      }

      // Mark as awaiting response
      updatedState = setAwaitingResponse(updatedState, 'How do you respond?');

      return {
        state: updatedState,
        outputs
      };
    },

    /**
     * Processes reader input and generates story response
     */
    async processReaderInput(state, input) {
      const outputs = [];

      // 1. Interpret what the reader meant
      const interpretation = await interpretResponse(interpreter, state, input);

      // 2. Add reader's input to conversation
      let updatedState = addToConversation(state, {
        speaker: 'reader',
        content: input,
        interpretation
      });
      updatedState = clearAwaitingResponse(updatedState);

      // 3. Determine how story should respond
      const storyResponse = determineStoryResponse(interpretation, updatedState);

      // 4. Apply tension adjustment if any
      if (storyResponse.tensionAdjustment !== 0) {
        updatedState = updateTension(
          updatedState,
          updatedState.tension + storyResponse.tensionAdjustment,
          interpretation.type
        );
      }

      // 5. Narrate first if needed (for actions)
      if (storyResponse.shouldNarrate && storyResponse.narrateFirst) {
        const actionNarration = await generateNarration(narrator, updatedState, NARRATION_TYPES.ACTION, {
          action: input
        });
        outputs.push(actionNarration);
        updatedState = addToConversation(updatedState, actionNarration);
      }

      // 6. Get direction from Story Director
      const direction = await getNextDirection(storyDirector, updatedState, input);

      // 7. Execute direction
      switch (direction.type) {
        case DIRECTION_TYPES.CHARACTER_SPEAKS: {
          const character = direction.character || storyResponse.speakingCharacter;
          if (character) {
            const agent = characterAgents.get(character.name) ||
              createCharacterAgent(character, aiProvider);

            if (!characterAgents.has(character.name)) {
              characterAgents.set(character.name, agent);
            }

            const response = await generateCharacterResponse(agent, updatedState, getContextWindow(updatedState), direction);
            outputs.push(response);
            updatedState = addToConversation(updatedState, response);

            // Update relationship based on interaction
            const relationshipChange = calculateRelationshipChange(agent, 'positive_interaction', 'subtle');
            updatedState = updateRelationship(updatedState, character.name, {
              ...relationshipChange,
              familiarity: 1
            });
          }
          break;
        }

        case DIRECTION_TYPES.NARRATOR_DESCRIBES: {
          const narration = await generateNarration(narrator, updatedState, NARRATION_TYPES.ATMOSPHERE, direction);
          outputs.push(narration);
          updatedState = addToConversation(updatedState, narration);
          break;
        }

        case DIRECTION_TYPES.BREATH_MOMENT: {
          const breath = await createBreathMoment(narrator, updatedState, direction.duration === 'lingering');
          outputs.push(breath);
          updatedState = addToConversation(updatedState, breath);
          break;
        }

        case DIRECTION_TYPES.TENSION_SHIFT: {
          if (direction.tensionTarget !== undefined) {
            updatedState = updateTension(updatedState, direction.tensionTarget, direction.reason);
          }
          // Continue to next direction
          break;
        }

        case DIRECTION_TYPES.SCENE_TRANSITION: {
          const transition = await generateNarration(narrator, updatedState, NARRATION_TYPES.TRANSITION, direction);
          outputs.push(transition);
          updatedState = addToConversation(updatedState, transition);
          updatedState = advanceScene(updatedState);
          resetDirectorCounters(storyDirector);
          break;
        }

        default:
          // Default: have a character speak
          if (updatedState.presentCharacters.length > 0) {
            const character = updatedState.presentCharacters[0];
            const agent = characterAgents.get(character.name);
            if (agent) {
              const response = await generateCharacterResponse(agent, updatedState, getContextWindow(updatedState), {
                context: 'continuing conversation'
              });
              outputs.push(response);
              updatedState = addToConversation(updatedState, response);
            }
          }
      }

      // 8. Set awaiting response
      updatedState = setAwaitingResponse(updatedState);

      return {
        state: updatedState,
        outputs,
        interpretation,
        direction
      };
    },

    /**
     * Adds a character to the current scene
     */
    async introduceCharacter(state, character, entranceType = 'natural') {
      const outputs = [];

      // Add to scene
      let updatedState = addCharacterToScene(state, character);

      // Create agent
      const agent = createCharacterAgent(character, aiProvider);
      characterAgents.set(character.name, agent);

      // Generate entrance
      const entrance = await generateEntrance(agent, updatedState, getContextWindow(updatedState), entranceType);
      outputs.push(entrance);
      updatedState = addToConversation(updatedState, entrance);

      return {
        state: updatedState,
        outputs
      };
    },

    /**
     * Gets a character agent (creates if needed)
     */
    getCharacterAgent(character) {
      if (!characterAgents.has(character.name)) {
        const agent = createCharacterAgent(character, aiProvider);
        characterAgents.set(character.name, agent);
      }
      return characterAgents.get(character.name);
    },

    /**
     * Generates a breath moment manually
     */
    async generateBreath(state) {
      const breath = await createBreathMoment(narrator, state, false);
      const updatedState = addToConversation(state, breath);
      return {
        state: updatedState,
        output: breath
      };
    },

    /**
     * Updates the emotional beat of the scene
     */
    setMood(state, beat, mood = null) {
      return setEmotionalBeat(state, beat, mood);
    }
  };
}

// Import psychological depth modules for default export
import { createReaderProfile, COMFORT_LEVELS, CONTENT_ELEMENTS } from './ReaderProfile.js';
import { createAttachmentEngine, BOND_TYPES, MILESTONES } from './AttachmentEngine.js';
import { createResonanceEngine, EMOTIONAL_TONES, TECHNIQUES, INTENSITY } from './EmotionalResonance.js';
import { createMemorySystem, MEMORY_TYPES, SALIENCE, MEMORY_VALENCE } from './MemorySystem.js';
import {
  createTensionManager,
  TENSION_LEVELS as TM_TENSION_LEVELS,
  PACING_MODES,
  TENSION_EVENTS,
  GENRE_PROFILES
} from './TensionManager.js';

// Import surprise & delight modules for default export
import { createEvolutionTracker, GROWTH_DIMENSIONS, ARC_PATTERNS, CATALYSTS, RESISTANCE } from './CharacterEvolution.js';
import { createHiddenThreads, THREAD_TYPES, THREAD_STATES, REVELATION_STYLES } from './HiddenThreads.js';
import { createEmergentSystem, MOMENT_TYPES, CONDITIONS, INTENSITY as MOMENT_INTENSITY } from './EmergentMoments.js';
import { createCrossTalkSystem, CROSSTALK_TYPES, DYNAMICS, TRIGGERS } from './CharacterCrossTalk.js';
import { createBreathSystem, BREATH_TYPES, DURATIONS, SENSORY } from './BreathSystem.js';

// Default export
export default {
  // Core engine
  createLiveAdventureEngine,
  createAIProvider,

  // Adventure state
  TENSION_LEVELS,
  EMOTIONAL_BEATS,
  DIRECTION_TYPES,
  INPUT_TYPES,
  NARRATION_TYPES,

  // Psychological depth
  createReaderProfile,
  createAttachmentEngine,
  createResonanceEngine,
  createMemorySystem,
  createTensionManager,

  // Surprise & delight
  createEvolutionTracker,
  createHiddenThreads,
  createEmergentSystem,
  createCrossTalkSystem,
  createBreathSystem,

  // Psychological depth constants
  COMFORT_LEVELS,
  CONTENT_ELEMENTS,
  BOND_TYPES,
  MILESTONES,
  EMOTIONAL_TONES,
  TECHNIQUES,
  INTENSITY,
  MEMORY_TYPES,
  SALIENCE,
  MEMORY_VALENCE,
  PACING_MODES,
  TENSION_EVENTS,
  GENRE_PROFILES,

  // Surprise & delight constants
  GROWTH_DIMENSIONS,
  ARC_PATTERNS,
  CATALYSTS,
  RESISTANCE,
  THREAD_TYPES,
  THREAD_STATES,
  REVELATION_STYLES,
  MOMENT_TYPES,
  CONDITIONS,
  MOMENT_INTENSITY,
  CROSSTALK_TYPES,
  DYNAMICS,
  TRIGGERS,
  BREATH_TYPES,
  DURATIONS,
  SENSORY
};
