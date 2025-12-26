/**
 * QuickActions - Contextual Response Suggestions
 *
 * Provides quick suggestions that don't break immersion:
 * - Common responses (agree, disagree, ask more)
 * - Emotional reactions
 * - Physical actions
 * - Genre-appropriate options
 *
 * Design: Suggestions inspire without constraining
 */

import React from 'react';
import { MessageCircle, Hand, Eye, HelpCircle, Heart, Shield, Zap } from 'lucide-react';

export default function QuickActions({ onSelect, context }) {
  const tension = context?.tension || 0;
  const emotionalBeat = context?.emotionalBeat || 'neutral';
  const characters = context?.presentCharacters || [];
  const questionPending = context?.questionPending;

  // Generate contextual suggestions
  const suggestions = generateSuggestions(tension, emotionalBeat, characters, questionPending);

  return (
    <div className="border-b border-gray-800/30 bg-gray-900/50">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-600">Quick responses:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSelect(suggestion.text)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                suggestion.highlight
                  ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {suggestion.icon && <suggestion.icon className="w-3.5 h-3.5" />}
              <span>{suggestion.label}</span>
            </button>
          ))}
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-800/30">
          <CategoryButton icon={MessageCircle} label="Dialogue" />
          <CategoryButton icon={Hand} label="Actions" />
          <CategoryButton icon={Heart} label="Emotions" />
          <CategoryButton icon={Eye} label="Observe" />
        </div>
      </div>
    </div>
  );
}

function CategoryButton({ icon: Icon, label }) {
  return (
    <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors">
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </button>
  );
}

function generateSuggestions(tension, emotionalBeat, characters, questionPending) {
  const suggestions = [];

  // If there's a pending question, prioritize responses
  if (questionPending) {
    suggestions.push(
      { text: 'Yes.', label: 'Agree', icon: null, highlight: true },
      { text: "I'm not sure...", label: 'Uncertain', icon: null },
      { text: 'No.', label: 'Disagree', icon: null }
    );
  }

  // Emotional beat specific suggestions
  switch (emotionalBeat) {
    case 'tension':
    case 'dread':
      suggestions.push(
        { text: '*stays alert*', label: 'Stay alert', icon: Eye },
        { text: 'What was that?', label: 'Ask', icon: HelpCircle },
        { text: '*ready to move*', label: 'Prepare', icon: Zap }
      );
      break;

    case 'warmth':
    case 'intimacy':
      suggestions.push(
        { text: '*smiles*', label: 'Smile', icon: Heart },
        { text: 'Tell me more.', label: 'Listen', icon: MessageCircle },
        { text: '*moves closer*', label: 'Approach', icon: null }
      );
      break;

    case 'mystery':
    case 'wonder':
      suggestions.push(
        { text: '*examines carefully*', label: 'Examine', icon: Eye },
        { text: 'What is this place?', label: 'Ask', icon: HelpCircle },
        { text: '*looks around*', label: 'Observe', icon: Eye }
      );
      break;

    case 'triumph':
    case 'hope':
      suggestions.push(
        { text: 'We did it.', label: 'Celebrate', icon: Heart },
        { text: "What's next?", label: 'Move on', icon: null },
        { text: '*takes a breath*', label: 'Pause', icon: null }
      );
      break;

    default:
      // General suggestions
      break;
  }

  // Tension-based suggestions
  if (tension >= 70) {
    suggestions.push(
      { text: 'We need to go. Now.', label: 'Urgent', icon: Zap, highlight: true },
      { text: '*backs away slowly*', label: 'Retreat', icon: null }
    );
  } else if (tension >= 40) {
    suggestions.push(
      { text: 'Something feels wrong.', label: 'Caution', icon: Shield },
      { text: 'Stay focused.', label: 'Focus', icon: Eye }
    );
  } else {
    suggestions.push(
      { text: '*relaxes slightly*', label: 'Relax', icon: null },
      { text: 'Tell me about yourself.', label: 'Learn more', icon: MessageCircle }
    );
  }

  // Character-specific suggestions
  if (characters.length > 0) {
    const mainChar = characters[0];
    suggestions.push(
      { text: `*looks at ${mainChar.name}*`, label: `Look at ${mainChar.name}`, icon: Eye }
    );
  }

  // Always include some universal options
  const universalOptions = [
    { text: '*waits*', label: 'Wait', icon: null },
    { text: '*thinks*', label: 'Think', icon: null },
    { text: 'Why?', label: 'Ask why', icon: HelpCircle }
  ];

  // Add universal options if we have room
  const remaining = 8 - suggestions.length;
  suggestions.push(...universalOptions.slice(0, Math.max(0, remaining)));

  // Limit and dedupe
  const seen = new Set();
  return suggestions.filter(s => {
    if (seen.has(s.text)) return false;
    seen.add(s.text);
    return true;
  }).slice(0, 8);
}
