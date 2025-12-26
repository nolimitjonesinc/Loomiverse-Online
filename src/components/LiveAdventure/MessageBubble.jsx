/**
 * MessageBubble - Renders Individual Story Moments
 *
 * Different styles for:
 * - Narrator (atmospheric, centered, italic)
 * - Character speech (with avatar, personality)
 * - Reader input (right-aligned, subtle)
 * - Breath moments (minimal, spacious)
 */

import React from 'react';

export default function MessageBubble({ output, readerName, isLatest }) {
  const { speaker, content, character, type, mood, isQuickBreath, isEntrance, isDeparture } = output;

  // Reader's own input
  if (speaker === 'reader') {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] px-4 py-2 bg-amber-600/20 border border-amber-600/30 rounded-2xl rounded-br-md">
          <p className="text-amber-100">{content}</p>
          <span className="text-xs text-amber-400/60 mt-1 block text-right">{readerName}</span>
        </div>
      </div>
    );
  }

  // Narrator - atmospheric text
  if (speaker === 'narrator') {
    // Breath moments get special minimal treatment
    if (isQuickBreath || type === 'breath') {
      return (
        <div className="my-8 text-center">
          <p className="text-gray-500 italic text-sm tracking-wide">{content}</p>
        </div>
      );
    }

    // Scene transitions
    if (type === 'transition') {
      return (
        <div className="my-6 py-4 border-y border-gray-800/30">
          <p className="text-gray-400 italic text-center">{content}</p>
        </div>
      );
    }

    // Scene descriptions
    if (type === 'scene_setting') {
      return (
        <div className="my-4 px-6 py-4 bg-gray-800/30 rounded-lg border-l-2 border-amber-500/50">
          <p className="text-gray-300 leading-relaxed">{content}</p>
        </div>
      );
    }

    // Action descriptions
    if (type === 'action') {
      return (
        <div className="my-3 px-4">
          <p className="text-gray-400 italic">{content}</p>
        </div>
      );
    }

    // Default narrator style
    return (
      <div className="my-4 text-center px-8">
        <p className="text-gray-400 italic leading-relaxed">{content}</p>
      </div>
    );
  }

  // Character speech
  if (speaker === 'character' && character) {
    const initial = character.name?.charAt(0)?.toUpperCase() || '?';

    // Get a consistent color for this character based on their name
    const colorIndex = character.name?.charCodeAt(0) % 5 || 0;
    const colors = [
      { bg: 'bg-emerald-600', border: 'border-emerald-500/30', text: 'text-emerald-400' },
      { bg: 'bg-blue-600', border: 'border-blue-500/30', text: 'text-blue-400' },
      { bg: 'bg-purple-600', border: 'border-purple-500/30', text: 'text-purple-400' },
      { bg: 'bg-pink-600', border: 'border-pink-500/30', text: 'text-pink-400' },
      { bg: 'bg-cyan-600', border: 'border-cyan-500/30', text: 'text-cyan-400' }
    ];
    const color = colors[colorIndex];

    // Entrance/departure special styling
    if (isEntrance) {
      return (
        <div className="my-4 flex items-start gap-3">
          <div className={`flex-shrink-0 w-8 h-8 ${color.bg} rounded-full flex items-center justify-center ring-2 ring-amber-500/50`}>
            <span className="text-white text-sm font-bold">{initial}</span>
          </div>
          <div className="flex-1">
            <span className={`text-xs ${color.text} font-medium`}>{character.name} enters</span>
            <p className="text-gray-300 mt-1">{content}</p>
          </div>
        </div>
      );
    }

    if (isDeparture) {
      return (
        <div className="my-4 flex items-start gap-3 opacity-75">
          <div className={`flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center`}>
            <span className="text-gray-400 text-sm font-bold">{initial}</span>
          </div>
          <div className="flex-1">
            <span className="text-xs text-gray-500 font-medium">{character.name} leaves</span>
            <p className="text-gray-400 mt-1 italic">{content}</p>
          </div>
        </div>
      );
    }

    // Regular character speech
    return (
      <div className={`my-3 flex items-start gap-3 ${isLatest ? 'animate-fadeIn' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 ${color.bg} rounded-full flex items-center justify-center shadow-lg`}>
          <span className="text-white text-sm font-bold">{initial}</span>
        </div>

        {/* Message */}
        <div className={`flex-1 max-w-[85%]`}>
          <span className={`text-xs ${color.text} font-medium`}>{character.name}</span>
          <div className={`mt-1 px-4 py-3 bg-gray-800/60 ${color.border} border rounded-2xl rounded-tl-md`}>
            <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
              {formatCharacterSpeech(content)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="my-3 px-4">
      <p className="text-gray-400">{content}</p>
    </div>
  );
}

/**
 * Formats character speech with action styling
 * *actions* become styled differently
 */
function formatCharacterSpeech(content) {
  if (!content) return content;

  // Split by asterisk actions
  const parts = content.split(/(\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      // Action text
      return (
        <span key={index} className="text-gray-400 italic text-sm">
          {part}
        </span>
      );
    }
    return part;
  });
}

// Add keyframes for fade-in animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
`;
if (typeof document !== 'undefined' && !document.querySelector('#message-bubble-styles')) {
  style.id = 'message-bubble-styles';
  document.head.appendChild(style);
}
