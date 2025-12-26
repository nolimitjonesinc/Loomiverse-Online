/**
 * SystemOrchestrator - The Conductor
 *
 * This system coordinates all Live Adventure systems,
 * deciding what should happen when and in what order.
 * It's the conductor that keeps the orchestra playing
 * in harmony.
 *
 * Responsibilities:
 * - Priority management (what gets attention first)
 * - Timing decisions (when to trigger systems)
 * - Conflict resolution (when systems disagree)
 * - Flow optimization (keeping things moving)
 * - Context building (preparing AI prompts)
 */

// Priority levels
export const PRIORITIES = {
  CRITICAL: 100,     // Must happen now (safety, continuity)
  HIGH: 80,          // Should happen soon
  MEDIUM: 50,        // Nice to have
  LOW: 20,           // If nothing else
  BACKGROUND: 0      // Only if idle
};

// Action types the orchestrator can recommend
export const ACTIONS = {
  // Response types
  CHARACTER_SPEAKS: 'character_speaks',
  NARRATOR_DESCRIBES: 'narrator_describes',
  BREATH_MOMENT: 'breath_moment',
  CROSS_TALK: 'cross_talk',

  // Story events
  REVEAL_THREAD: 'reveal_thread',
  TRIGGER_EMERGENCE: 'trigger_emergence',
  CALLBACK_MOMENT: 'callback_moment',
  MILESTONE_SCENE: 'milestone_scene',

  // Pacing
  INCREASE_TENSION: 'increase_tension',
  DECREASE_TENSION: 'decrease_tension',
  CHANGE_SCENE: 'change_scene',

  // Character focus
  DEEPEN_BOND: 'deepen_bond',
  SHOW_GROWTH: 'show_growth',
  VULNERABILITY_MOMENT: 'vulnerability_moment'
};

/**
 * Creates the orchestrator
 */
export function createOrchestrator() {
  return {
    // Current recommendations
    recommendations: [],

    // Action history
    history: [],

    // Pending actions (queued)
    pending: [],

    // Cooldowns for various actions
    cooldowns: {},

    // System states (for quick reference)
    systemStates: {
      tension: 50,
      emotionalIntensity: 2,
      catharsisDebt: 0,
      exchangesSinceBreath: 0,
      exchangesSinceCrossTalk: 0,
      ripeThreads: 0,
      emergentPossible: 0,
      pendingMilestones: []
    },

    // Configuration
    config: {
      maxPendingActions: 5,
      cooldownExchanges: {
        [ACTIONS.BREATH_MOMENT]: 4,
        [ACTIONS.CROSS_TALK]: 5,
        [ACTIONS.REVEAL_THREAD]: 8,
        [ACTIONS.TRIGGER_EMERGENCE]: 6,
        [ACTIONS.CALLBACK_MOMENT]: 5,
        [ACTIONS.MILESTONE_SCENE]: 10
      }
    }
  };
}

/**
 * Updates system states from various system contexts
 */
export function updateSystemStates(orchestrator, contexts) {
  const states = orchestrator.systemStates;

  if (contexts.tension) {
    states.tension = contexts.tension.currentTension;
    states.exchangesSinceBreath = contexts.tension.exchangesSinceBreath || 0;
  }

  if (contexts.emotional) {
    states.emotionalIntensity = contexts.emotional.currentIntensity;
    states.catharsisDebt = contexts.emotional.catharsisDebt;
  }

  if (contexts.crossTalk) {
    states.exchangesSinceCrossTalk = contexts.crossTalk.exchangesSinceLast || 0;
  }

  if (contexts.threads) {
    states.ripeThreads = contexts.threads.ripeForRevelation?.length || 0;
  }

  if (contexts.emergent) {
    states.emergentPossible = contexts.emergent.possibleMoments?.length || 0;
  }

  if (contexts.milestones) {
    states.pendingMilestones = contexts.milestones;
  }

  return states;
}

/**
 * Generates recommendations based on current state
 */
export function generateRecommendations(orchestrator, context = {}) {
  const recommendations = [];
  const states = orchestrator.systemStates;

  // Check cooldowns
  const onCooldown = (action) => {
    const cd = orchestrator.cooldowns[action];
    if (!cd) return false;
    return cd > 0;
  };

  // 1. Critical: Catharsis if debt is high
  if (states.catharsisDebt >= 70) {
    recommendations.push({
      action: ACTIONS.DECREASE_TENSION,
      priority: PRIORITIES.CRITICAL,
      reason: 'Catharsis debt critical - reader needs release',
      urgency: 'immediate'
    });
  }

  // 2. High: Breath moment if needed
  if (states.exchangesSinceBreath >= 10 && !onCooldown(ACTIONS.BREATH_MOMENT)) {
    recommendations.push({
      action: ACTIONS.BREATH_MOMENT,
      priority: PRIORITIES.HIGH,
      reason: 'Extended time since breath moment',
      urgency: 'soon'
    });
  }

  // 3. High: Milestone if pending
  if (states.pendingMilestones.length > 0 && !onCooldown(ACTIONS.MILESTONE_SCENE)) {
    recommendations.push({
      action: ACTIONS.MILESTONE_SCENE,
      priority: PRIORITIES.HIGH,
      reason: `${states.pendingMilestones[0].type} milestone ready`,
      data: states.pendingMilestones[0],
      urgency: 'soon'
    });
  }

  // 4. Medium: Reveal ripe thread
  if (states.ripeThreads > 0 && !onCooldown(ACTIONS.REVEAL_THREAD)) {
    recommendations.push({
      action: ACTIONS.REVEAL_THREAD,
      priority: PRIORITIES.MEDIUM,
      reason: 'Thread ready for revelation',
      urgency: 'when_appropriate'
    });
  }

  // 5. Medium: Trigger emergent moment
  if (states.emergentPossible > 0 && !onCooldown(ACTIONS.TRIGGER_EMERGENCE)) {
    recommendations.push({
      action: ACTIONS.TRIGGER_EMERGENCE,
      priority: PRIORITIES.MEDIUM,
      reason: 'Conditions align for special moment',
      urgency: 'when_appropriate'
    });
  }

  // 6. Medium: Cross-talk opportunity
  if (states.exchangesSinceCrossTalk >= 6 && !onCooldown(ACTIONS.CROSS_TALK)) {
    recommendations.push({
      action: ACTIONS.CROSS_TALK,
      priority: PRIORITIES.MEDIUM,
      reason: 'Characters could interact with each other',
      urgency: 'when_appropriate'
    });
  }

  // 7. Low: Tension adjustment if off-target
  if (context.targetTension) {
    const diff = states.tension - context.targetTension;
    if (Math.abs(diff) > 20) {
      recommendations.push({
        action: diff > 0 ? ACTIONS.DECREASE_TENSION : ACTIONS.INCREASE_TENSION,
        priority: PRIORITIES.LOW,
        reason: `Tension (${states.tension}) far from target (${context.targetTension})`,
        urgency: 'gradual'
      });
    }
  }

  // 8. Low: Deepen bond if progress possible
  if (context.bondProgress && context.bondProgress.nearThreshold) {
    recommendations.push({
      action: ACTIONS.DEEPEN_BOND,
      priority: PRIORITIES.LOW,
      reason: 'Close to bond milestone',
      data: context.bondProgress,
      urgency: 'when_appropriate'
    });
  }

  // Sort by priority
  recommendations.sort((a, b) => b.priority - a.priority);

  orchestrator.recommendations = recommendations;
  return recommendations;
}

/**
 * Gets the top recommendation
 */
export function getTopRecommendation(orchestrator) {
  if (orchestrator.recommendations.length === 0) return null;
  return orchestrator.recommendations[0];
}

/**
 * Records that an action was taken
 */
export function recordAction(orchestrator, action, result = {}) {
  // Add to history
  orchestrator.history.push({
    action,
    result,
    timestamp: Date.now()
  });

  // Keep history bounded
  if (orchestrator.history.length > 50) {
    orchestrator.history = orchestrator.history.slice(-40);
  }

  // Set cooldown
  const cooldownLength = orchestrator.config.cooldownExchanges[action] || 3;
  orchestrator.cooldowns[action] = cooldownLength;

  // Remove from recommendations
  orchestrator.recommendations = orchestrator.recommendations.filter(r =>
    r.action !== action
  );

  return orchestrator;
}

/**
 * Advances cooldowns (call after each exchange)
 */
export function tickCooldowns(orchestrator) {
  for (const action of Object.keys(orchestrator.cooldowns)) {
    if (orchestrator.cooldowns[action] > 0) {
      orchestrator.cooldowns[action]--;
    }
  }
}

/**
 * Queues an action for later
 */
export function queueAction(orchestrator, action, delay = 0, data = {}) {
  orchestrator.pending.push({
    action,
    delay,
    data,
    queuedAt: Date.now()
  });

  // Keep bounded
  if (orchestrator.pending.length > orchestrator.config.maxPendingActions) {
    orchestrator.pending = orchestrator.pending.slice(-orchestrator.config.maxPendingActions);
  }
}

/**
 * Gets and removes ready pending actions
 */
export function getReadyActions(orchestrator) {
  const ready = [];
  const stillPending = [];

  for (const pending of orchestrator.pending) {
    if (pending.delay <= 0) {
      ready.push(pending);
    } else {
      pending.delay--;
      stillPending.push(pending);
    }
  }

  orchestrator.pending = stillPending;
  return ready;
}

/**
 * Builds AI context with orchestration guidance
 */
export function buildAIContext(orchestrator, fullContext) {
  const topRec = getTopRecommendation(orchestrator);

  return {
    // Include relevant context
    readerProfile: fullContext.reader,
    currentTension: orchestrator.systemStates.tension,
    emotionalState: {
      intensity: orchestrator.systemStates.emotionalIntensity,
      catharsisDebt: orchestrator.systemStates.catharsisDebt
    },

    // Orchestration guidance
    guidance: topRec ? {
      suggested: topRec.action,
      reason: topRec.reason,
      urgency: topRec.urgency
    } : null,

    // Available opportunities
    opportunities: {
      ripeThreads: orchestrator.systemStates.ripeThreads > 0,
      emergentMoment: orchestrator.systemStates.emergentPossible > 0,
      crossTalkReady: orchestrator.systemStates.exchangesSinceCrossTalk >= 5,
      breathNeeded: orchestrator.systemStates.exchangesSinceBreath >= 8
    },

    // Recent history summary
    recentActions: orchestrator.history.slice(-3).map(h => h.action)
  };
}

/**
 * Resolves conflicts between system recommendations
 */
export function resolveConflicts(orchestrator, systemRecommendations) {
  // systemRecommendations: { tension: {...}, emotional: {...}, threads: {...}, etc. }

  const resolved = [];

  // Priority order for conflict resolution
  const priorityOrder = [
    'safety',     // Reader comfort
    'pacing',     // Tension/breath
    'emotional',  // Resonance
    'narrative',  // Threads/emergence
    'character'   // Bonds/growth
  ];

  // Collect all recommendations with their source priority
  const all = [];
  for (const [source, rec] of Object.entries(systemRecommendations)) {
    if (rec) {
      all.push({
        ...rec,
        source,
        sourcePriority: priorityOrder.indexOf(source)
      });
    }
  }

  // Sort by urgency first, then source priority
  all.sort((a, b) => {
    const urgencyScore = { immediate: 3, soon: 2, when_appropriate: 1, gradual: 0 };
    const aUrgency = urgencyScore[a.urgency] || 0;
    const bUrgency = urgencyScore[b.urgency] || 0;

    if (aUrgency !== bUrgency) return bUrgency - aUrgency;
    return a.sourcePriority - b.sourcePriority;
  });

  // Check for direct conflicts
  const conflicts = detectConflicts(all);
  if (conflicts.length > 0) {
    // Resolve each conflict
    for (const conflict of conflicts) {
      const winner = resolveConflict(conflict);
      resolved.push(winner);
    }
  } else {
    resolved.push(...all);
  }

  return resolved;
}

/**
 * Detects conflicting recommendations
 */
function detectConflicts(recommendations) {
  const conflicts = [];

  // Tension conflicts
  const increaseTension = recommendations.find(r => r.action === ACTIONS.INCREASE_TENSION);
  const decreaseTension = recommendations.find(r => r.action === ACTIONS.DECREASE_TENSION);
  if (increaseTension && decreaseTension) {
    conflicts.push({ type: 'tension', contenders: [increaseTension, decreaseTension] });
  }

  // Action vs breath conflict
  const actionRec = recommendations.find(r =>
    r.action === ACTIONS.TRIGGER_EMERGENCE || r.action === ACTIONS.REVEAL_THREAD
  );
  const breathRec = recommendations.find(r => r.action === ACTIONS.BREATH_MOMENT);
  if (actionRec && breathRec && breathRec.urgency === 'immediate') {
    conflicts.push({ type: 'pacing', contenders: [actionRec, breathRec] });
  }

  return conflicts;
}

/**
 * Resolves a single conflict
 */
function resolveConflict(conflict) {
  // For tension conflicts, higher urgency wins
  if (conflict.type === 'tension') {
    const urgencyScore = { immediate: 3, soon: 2, when_appropriate: 1, gradual: 0 };
    return conflict.contenders.sort((a, b) =>
      (urgencyScore[b.urgency] || 0) - (urgencyScore[a.urgency] || 0)
    )[0];
  }

  // For pacing conflicts, breath wins if immediate
  if (conflict.type === 'pacing') {
    const breath = conflict.contenders.find(c => c.action === ACTIONS.BREATH_MOMENT);
    if (breath?.urgency === 'immediate') return breath;
    return conflict.contenders[0];
  }

  // Default: first contender
  return conflict.contenders[0];
}

/**
 * Gets orchestration status for debugging/UI
 */
export function getOrchestratorStatus(orchestrator) {
  return {
    states: orchestrator.systemStates,
    topRecommendation: getTopRecommendation(orchestrator),
    pendingActions: orchestrator.pending.length,
    cooldowns: Object.entries(orchestrator.cooldowns)
      .filter(([, v]) => v > 0)
      .map(([action, remaining]) => ({ action, remaining })),
    recentActions: orchestrator.history.slice(-5).map(h => h.action)
  };
}

/**
 * Resets orchestrator for new scene
 */
export function resetForNewScene(orchestrator) {
  // Clear recommendations
  orchestrator.recommendations = [];

  // Reduce cooldowns
  for (const action of Object.keys(orchestrator.cooldowns)) {
    orchestrator.cooldowns[action] = Math.max(0, orchestrator.cooldowns[action] - 3);
  }

  // Clear pending
  orchestrator.pending = [];
}

export default {
  createOrchestrator,
  updateSystemStates,
  generateRecommendations,
  getTopRecommendation,
  recordAction,
  tickCooldowns,
  queueAction,
  getReadyActions,
  buildAIContext,
  resolveConflicts,
  getOrchestratorStatus,
  resetForNewScene,
  PRIORITIES,
  ACTIONS
};
