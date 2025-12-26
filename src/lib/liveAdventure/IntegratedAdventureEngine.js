/**
 * IntegratedAdventureEngine - The Complete Experience
 *
 * This is the master orchestration layer that brings together
 * all Live Adventure systems into a cohesive whole:
 *
 * Core Systems (PR #1-2):
 * - Adventure State, Story Director, Character Agents
 * - Narrator, Response Interpreter
 *
 * Psychological Depth (PR #3):
 * - Reader Profile, Attachment Engine, Emotional Resonance
 * - Memory System, Tension Manager
 *
 * Surprise & Delight (PR #4):
 * - Character Evolution, Hidden Threads, Emergent Moments
 * - Character Cross-Talk, Breath System
 *
 * This engine ensures all systems communicate and create
 * a unified, magical reading experience.
 */

// Import all systems
import {
  createLiveAdventureEngine,
  createAIProvider,
  TENSION_LEVELS,
  EMOTIONAL_BEATS
} from './index.js';

import { createReaderProfile, observeResponse, getProfileSummary } from './ReaderProfile.js';
import { createAttachmentEngine, recordInteraction, getBondSummary, getBond, hasMilestone } from './AttachmentEngine.js';
import { createResonanceEngine, recordEmotionalMoment, suggestEmotionalDirection, getEmotionalContext } from './EmotionalResonance.js';
import { createMemorySystem, storeMemory, createMemory, getRelevantMemories, getCallbackOpportunity, useCallback, MEMORY_TYPES } from './MemorySystem.js';
import { createTensionManager, recordTensionEvent, needsBreathMoment, getPacingRecommendation, getTensionContext, TENSION_EVENTS } from './TensionManager.js';

import { createEvolutionTracker, recordGrowthMoment, getEvolutionContext, getGrowthSuggestions, CATALYSTS } from './CharacterEvolution.js';
import { createHiddenThreads, addThread, createThread, touchThread, detectPotentialThreads, getRipeThreads, getThreadContext } from './HiddenThreads.js';
import { createEmergentSystem, updateConditionsFromContext, checkForMoments, triggerMoment, getEmergentContext } from './EmergentMoments.js';
import { createCrossTalkSystem, shouldCrossTalk, selectCrossTalkParticipants, getCrossTalkGuidance, recordCrossTalk, incrementExchanges } from './CharacterCrossTalk.js';
import { createBreathSystem, recordIntensity, needsBreath, createBreathMoment, recordBreath, getBreathContext } from './BreathSystem.js';

/**
 * Creates an integrated adventure engine with all systems
 */
export function createIntegratedEngine(config) {
  const {
    openaiKey,
    anthropicKey,
    preferredProvider = 'openai',
    genre = 'fantasy'
  } = config;

  // Create AI provider
  const aiProvider = createAIProvider({
    openaiKey,
    anthropicKey,
    preferredProvider
  });

  // Create base engine
  const baseEngine = createLiveAdventureEngine(aiProvider);

  // Create all psychological depth systems
  const readerProfile = createReaderProfile();
  const memorySystem = createMemorySystem();
  const tensionManager = createTensionManager(genre);
  const resonanceEngine = createResonanceEngine(readerProfile);

  // Create all surprise & delight systems
  const hiddenThreads = createHiddenThreads();
  const emergentSystem = createEmergentSystem();
  const crossTalkSystem = createCrossTalkSystem();
  const breathSystem = createBreathSystem();

  // Character-specific systems (created per character)
  const characterSystems = new Map(); // { charName: { attachment, evolution } }

  return {
    // Core systems
    baseEngine,
    aiProvider,

    // Psychological depth
    readerProfile,
    memorySystem,
    tensionManager,
    resonanceEngine,

    // Surprise & delight
    hiddenThreads,
    emergentSystem,
    crossTalkSystem,
    breathSystem,

    // Per-character systems
    characterSystems,

    // Configuration
    genre,

    // Stats
    stats: {
      exchangeCount: 0,
      breathCount: 0,
      crossTalkCount: 0,
      emergentMomentsTriggered: 0,
      memoriesCreated: 0,
      milestones: []
    },

    /**
     * Starts an integrated adventure
     */
    async startAdventure(storyBible, readerName = 'You') {
      // Start base adventure
      const state = await baseEngine.startAdventure(storyBible, readerName);

      // Initialize character systems for present characters
      for (const character of state.presentCharacters) {
        this.initializeCharacterSystems(character);
      }

      // Record initial scene in memory
      if (state.scene.location) {
        storeMemory(memorySystem, 'reader', createMemory({
          type: MEMORY_TYPES.PLACE,
          content: `Arrived at ${state.scene.location.name}`,
          participants: state.presentCharacters.map(c => c.name)
        }));
      }

      return state;
    },

    /**
     * Initializes systems for a character
     */
    initializeCharacterSystems(character) {
      if (characterSystems.has(character.name)) return;

      characterSystems.set(character.name, {
        attachment: createAttachmentEngine('reader', character.name),
        evolution: createEvolutionTracker(character)
      });
    },

    /**
     * Generates integrated opening
     */
    async generateOpening(state) {
      const result = await baseEngine.generateOpening(state);

      // Record opening as emotional moment
      recordEmotionalMoment(resonanceEngine, {
        tone: 'anticipation',
        intensity: 2,
        context: { summary: 'Story begins' }
      });

      // Initialize breath system
      recordIntensity(breathSystem, 40);

      return result;
    },

    /**
     * Processes reader input with full integration
     */
    async processReaderInput(state, input) {
      const startTime = Date.now();
      this.stats.exchangeCount++;

      // 1. Update reader profile
      observeResponse(readerProfile, input, {
        responseTimeMs: Date.now() - (state.lastInputTime || Date.now())
      });

      // 2. Check for cross-talk opportunity first
      const crossTalkCheck = shouldCrossTalk(crossTalkSystem, {
        readerSilent: false,
        characters: state.presentCharacters,
        naturalPause: false,
        tensionJustDropped: false
      });

      // 3. Process through base engine
      const result = await baseEngine.processReaderInput(state, input);
      let updatedState = result.state;
      const outputs = [...result.outputs];

      // 4. Record tension
      recordTensionEvent(tensionManager, result.interpretation?.emotionalTone || 'DIALOGUE');
      recordIntensity(breathSystem, tensionManager.currentTension);

      // 5. Record memories
      if (result.interpretation) {
        const memory = createMemory({
          type: result.interpretation.type === 'action' ? MEMORY_TYPES.EVENT : MEMORY_TYPES.CONVERSATION,
          content: input,
          participants: state.presentCharacters.map(c => c.name),
          context: { emotionalTone: result.interpretation.emotionalTone }
        });
        storeMemory(memorySystem, 'reader', memory);
        this.stats.memoriesCreated++;
      }

      // 6. Update character attachment and evolution
      for (const character of state.presentCharacters) {
        const systems = characterSystems.get(character.name);
        if (systems) {
          // Get milestone count before interaction
          const bond = getBond(systems.attachment, character.name);
          const milestonesBefore = bond?.achievedMilestones?.length || 0;

          // Record interaction
          recordInteraction(systems.attachment, character.name, {
            type: result.interpretation?.type || 'neutral',
            context: input
          });

          // Check for new milestones
          const bondAfter = getBond(systems.attachment, character.name);
          const milestonesAfter = bondAfter?.achievedMilestones?.length || 0;
          if (milestonesAfter > milestonesBefore) {
            const newMilestones = bondAfter.achievedMilestones.slice(milestonesBefore);
            for (const milestone of newMilestones) {
              this.stats.milestones.push({
                character: character.name,
                milestone: milestone.type,
                at: this.stats.exchangeCount
              });
            }
          }

          // Check for growth catalyst
          const catalyst = detectCatalyst(result.interpretation);
          if (catalyst) {
            recordGrowthMoment(systems.evolution, {
              dimension: catalyst.dimension,
              catalyst: catalyst.type,
              magnitude: catalyst.magnitude,
              context: input,
              witnessed: true
            });
          }
        }
      }

      // 7. Record emotional moment
      if (result.interpretation?.emotionalTone) {
        recordEmotionalMoment(resonanceEngine, {
          tone: result.interpretation.emotionalTone,
          intensity: result.interpretation.emotionalIntensity || 3,
          context: { summary: input.substring(0, 50) }
        });
      }

      // 8. Detect potential threads
      const combinedContent = outputs.map(o => o.content || o.text || '').join(' ');
      const potentialThreads = detectPotentialThreads(hiddenThreads, combinedContent, {
        recentContent: state.conversationHistory?.slice(-3).map(c => c.content).join(' ')
      });
      for (const pt of potentialThreads.slice(0, 2)) {
        addThread(hiddenThreads, createThread(pt));
      }

      // 9. Update emergent conditions
      updateConditionsFromContext(emergentSystem, {
        tension: tensionManager.currentTension,
        emotionalIntensity: resonanceEngine.currentIntensity,
        vulnerabilityPresent: result.interpretation?.emotionalTone === 'vulnerable',
        presentCharacters: state.presentCharacters,
        catharsisDebt: resonanceEngine.catharsisDebt,
        callbackAvailable: !!getCallbackOpportunity(memorySystem, 'reader'),
        threadRipe: getRipeThreads(hiddenThreads).length > 0
      });

      // 10. Check for emergent moments
      const emergentMoments = checkForMoments(emergentSystem);
      if (emergentMoments.length > 0 && emergentMoments[0].priority >= 60) {
        const triggered = triggerMoment(emergentSystem, emergentMoments[0].recipe.momentType);
        if (triggered) {
          this.stats.emergentMomentsTriggered++;
          // Emergent moments can influence next output
        }
      }

      // 11. Check for breath need
      const breathCheck = needsBreath(breathSystem, {
        justHadRevelation: result.direction?.type === 'revelation',
        emotionalPeak: resonanceEngine.currentIntensity >= 4
      });

      if (breathCheck.needed && breathCheck.urgency === 'high') {
        const breath = createBreathMoment(breathSystem, breathCheck.suggestedType);
        recordBreath(breathSystem, breath);
        this.stats.breathCount++;
        // Add breath guidance to context for next response
      }

      // 12. Increment cross-talk counter
      incrementExchanges(crossTalkSystem);

      // Return enriched result
      return {
        ...result,
        state: updatedState,
        outputs,
        context: this.getFullContext()
      };
    },

    /**
     * Generates cross-talk between characters
     */
    async generateCrossTalk(state) {
      const check = shouldCrossTalk(crossTalkSystem, {
        readerSilent: true,
        silentExchanges: 3,
        characters: state.presentCharacters,
        naturalPause: true
      });

      if (!check.should) return null;

      const participants = selectCrossTalkParticipants(
        crossTalkSystem,
        state.presentCharacters
      );

      if (!participants) return null;

      const guidance = getCrossTalkGuidance(
        crossTalkSystem,
        participants,
        check.suggestedType
      );

      // Generate the cross-talk using AI
      const prompt = buildCrossTalkPrompt(guidance, state);
      const content = await aiProvider.generate(
        'You are generating natural dialogue between characters.',
        prompt,
        { temperature: 0.9, maxTokens: 400 }
      );

      recordCrossTalk(crossTalkSystem, {
        participants: participants.characters,
        type: check.suggestedType,
        summary: content.substring(0, 100)
      });

      this.stats.crossTalkCount++;

      return {
        type: 'crossTalk',
        participants: participants.characters.map(c => c.name || c),
        content
      };
    },

    /**
     * Gets callback opportunity
     */
    getCallbackOpportunity(characterName) {
      return getCallbackOpportunity(memorySystem, characterName);
    },

    /**
     * Uses a callback
     */
    useCallback(memoryId, characterName) {
      return useCallback(memorySystem, memoryId, characterName);
    },

    /**
     * Gets full context for AI prompting
     */
    getFullContext() {
      return {
        reader: getProfileSummary(readerProfile),
        tension: getTensionContext(tensionManager),
        emotional: getEmotionalContext(resonanceEngine),
        breath: getBreathContext(breathSystem),
        threads: getThreadContext(hiddenThreads),
        emergent: getEmergentContext(emergentSystem),
        characters: this.getCharacterContexts(),
        pacing: getPacingRecommendation(tensionManager),
        emotionalSuggestions: suggestEmotionalDirection(resonanceEngine)
      };
    },

    /**
     * Gets context for all characters
     */
    getCharacterContexts() {
      const contexts = {};
      for (const [name, systems] of characterSystems) {
        contexts[name] = {
          bond: getBondSummary(systems.attachment),
          evolution: getEvolutionContext(systems.evolution),
          growthSuggestions: getGrowthSuggestions(systems.evolution).slice(0, 2)
        };
      }
      return contexts;
    },

    /**
     * Adds a character to the adventure
     */
    async introduceCharacter(state, character, entranceType) {
      this.initializeCharacterSystems(character);
      return baseEngine.introduceCharacter(state, character, entranceType);
    },

    /**
     * Gets system stats
     */
    getStats() {
      return {
        ...this.stats,
        memorySystem: {
          totalMemories: memorySystem.stats.totalMemories,
          callbacksUsed: memorySystem.stats.callbacksUsed
        },
        tensionManager: {
          currentTension: tensionManager.currentTension,
          breathsThisSession: tensionManager.breathsThisSession
        },
        emergentSystem: emergentSystem.stats,
        characterBonds: Array.from(characterSystems.entries()).map(([name, sys]) => ({
          character: name,
          overallBond: sys.attachment.overallBondStrength
        }))
      };
    },

    /**
     * Serializes all state for saving
     */
    serializeState() {
      return {
        readerProfile: JSON.stringify(readerProfile),
        memorySystem: JSON.stringify(memorySystem),
        tensionManager: JSON.stringify(tensionManager),
        resonanceEngine: JSON.stringify(resonanceEngine),
        hiddenThreads: JSON.stringify(hiddenThreads),
        emergentSystem: JSON.stringify(emergentSystem),
        crossTalkSystem: JSON.stringify(crossTalkSystem),
        breathSystem: JSON.stringify(breathSystem),
        characterSystems: JSON.stringify(
          Array.from(characterSystems.entries()).map(([name, sys]) => ({
            name,
            attachment: sys.attachment,
            evolution: sys.evolution
          }))
        ),
        stats: this.stats
      };
    }
  };
}

/**
 * Detects growth catalyst from interpretation
 */
function detectCatalyst(interpretation) {
  if (!interpretation) return null;

  const { type, emotionalTone } = interpretation;

  // Map interpretation to catalyst
  if (type === 'action' && emotionalTone === 'determined') {
    return {
      type: CATALYSTS.ACT_OF_COURAGE,
      dimension: 'courage',
      magnitude: 5
    };
  }

  if (emotionalTone === 'vulnerable' || emotionalTone === 'sad') {
    return {
      type: CATALYSTS.VULNERABLE_MOMENT,
      dimension: 'vulnerability',
      magnitude: 8
    };
  }

  if (emotionalTone === 'grateful' || emotionalTone === 'warm') {
    return {
      type: CATALYSTS.RECEIVED_KINDNESS,
      dimension: 'trust',
      magnitude: 5
    };
  }

  return null;
}

/**
 * Builds prompt for cross-talk generation
 */
function buildCrossTalkPrompt(guidance, state) {
  return `
Generate a brief, natural exchange between ${guidance.participants.speaker1} and ${guidance.participants.speaker2}.

Type: ${guidance.type}
Dynamic: ${guidance.dynamic}

Guidelines:
${guidance.suggestions.map(s => `- ${s}`).join('\n')}

Avoid:
${guidance.avoid?.map(a => `- ${a}`).join('\n') || '- Nothing specific'}

Keep it short (2-4 exchanges). Make it feel like the reader is overhearing something real.
The reader character should not be directly addressed.

Current scene: ${state.scene?.location?.name || 'Unknown location'}
Mood: ${state.emotionalBeat || 'neutral'}
`;
}

export default {
  createIntegratedEngine
};
