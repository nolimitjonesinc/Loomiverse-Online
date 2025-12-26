/**
 * AdventureScreen - The Main Live Adventure Interface
 *
 * This is where the magic happens. A chat-like interface where:
 * - Story unfolds through character dialogue and narration
 * - Reader types natural responses
 * - Characters speak with presence and personality
 * - Moments of quiet beauty punctuate the action
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, Users, Clock, Send, ChevronUp, Sparkles } from 'lucide-react';
import MessageBubble from './MessageBubble';
import CharacterPresence from './CharacterPresence';
import SceneHeader from './SceneHeader';
import QuickActions from './QuickActions';

export default function AdventureScreen({
  adventureState,
  storyOutputs,
  onSendMessage,
  onExit,
  isGenerating,
  readerName = 'You'
}) {
  const [inputValue, setInputValue] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [storyOutputs]);

  // Focus input after generation completes
  useEffect(() => {
    if (!isGenerating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isGenerating]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isGenerating) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      setShowQuickActions(false);
    }
  };

  const handleQuickAction = (action) => {
    setInputValue(action);
    setShowQuickActions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    // Tab to toggle quick actions
    if (e.key === 'Tab') {
      e.preventDefault();
      setShowQuickActions(!showQuickActions);
    }
    // Escape to close quick actions
    if (e.key === 'Escape') {
      setShowQuickActions(false);
    }
  };

  // Get tension color class
  const getTensionColor = () => {
    const tension = adventureState?.tension || 0;
    if (tension >= 80) return 'from-red-900/20 to-red-950/40';
    if (tension >= 60) return 'from-amber-900/20 to-amber-950/40';
    if (tension >= 40) return 'from-blue-900/20 to-blue-950/40';
    return 'from-slate-900/20 to-slate-950/40';
  };

  // Get emotional beat indicator
  const getEmotionalIndicator = () => {
    const beat = adventureState?.emotionalBeat;
    const indicators = {
      wonder: { icon: '✨', color: 'text-purple-400' },
      tension: { icon: '⚡', color: 'text-amber-400' },
      warmth: { icon: '💛', color: 'text-amber-300' },
      melancholy: { icon: '🌙', color: 'text-blue-300' },
      triumph: { icon: '🏆', color: 'text-yellow-400' },
      intimacy: { icon: '💜', color: 'text-pink-400' },
      mystery: { icon: '🔮', color: 'text-indigo-400' },
      humor: { icon: '😄', color: 'text-green-400' },
      dread: { icon: '👁', color: 'text-red-400' },
      hope: { icon: '🌅', color: 'text-orange-300' },
      reflection: { icon: '💭', color: 'text-gray-400' },
      breath: { icon: '🌬', color: 'text-cyan-300' }
    };
    return indicators[beat] || indicators.wonder;
  };

  const emotionalIndicator = getEmotionalIndicator();

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-b ${getTensionColor()}`}>
      {/* Header */}
      <header className="flex-shrink-0 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Exit & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={onExit}
                className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
                title="Exit Adventure"
              >
                <Home className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-white">
                  {adventureState?.storyBible?.title || 'Live Adventure'}
                </h1>
                <p className="text-xs text-gray-500">
                  Chapter {adventureState?.chapterNumber || 1} • Scene {adventureState?.sceneNumber || 1}
                </p>
              </div>
            </div>

            {/* Right: Status indicators */}
            <div className="flex items-center gap-3">
              {/* Emotional beat */}
              <span className={`text-lg ${emotionalIndicator.color}`} title={adventureState?.emotionalBeat}>
                {emotionalIndicator.icon}
              </span>

              {/* Tension meter */}
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      adventureState?.tension >= 80 ? 'bg-red-500' :
                      adventureState?.tension >= 60 ? 'bg-amber-500' :
                      adventureState?.tension >= 40 ? 'bg-blue-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${adventureState?.tension || 0}%` }}
                  />
                </div>
              </div>

              {/* Character count */}
              <div className="flex items-center gap-1 text-gray-500">
                <Users className="w-4 h-4" />
                <span className="text-xs">{adventureState?.presentCharacters?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Scene Header */}
      <SceneHeader scene={adventureState?.scene} />

      {/* Character Presence Bar */}
      {adventureState?.presentCharacters?.length > 0 && (
        <CharacterPresence
          characters={adventureState.presentCharacters}
          relationships={adventureState.relationships}
          speakingCharacter={adventureState.speakingCharacter}
        />
      )}

      {/* Messages Area */}
      <main
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {storyOutputs.map((output, index) => (
            <MessageBubble
              key={index}
              output={output}
              readerName={readerName}
              isLatest={index === storyOutputs.length - 1}
            />
          ))}

          {/* Generating indicator */}
          {isGenerating && (
            <div className="flex items-center gap-2 text-gray-500 pl-4">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm italic">The story unfolds...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-shrink-0 border-t border-gray-800/50 bg-gray-950/90 backdrop-blur-sm">
        {/* Quick Actions (collapsible) */}
        {showQuickActions && (
          <QuickActions
            onSelect={handleQuickAction}
            context={adventureState}
          />
        )}

        <div className="max-w-3xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            {/* Quick actions toggle */}
            <button
              type="button"
              onClick={() => setShowQuickActions(!showQuickActions)}
              className={`p-2 rounded-lg transition-colors ${
                showQuickActions
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
              title="Quick Actions (Tab)"
            >
              <Sparkles className="w-5 h-5" />
            </button>

            {/* Input field */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  adventureState?.questionPending
                    ? adventureState.questionPending
                    : "What do you do or say?"
                }
                disabled={isGenerating}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              />

              {/* Character limit indicator */}
              {inputValue.length > 200 && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                  inputValue.length > 500 ? 'text-red-400' : 'text-gray-500'
                }`}>
                  {inputValue.length}/500
                </span>
              )}
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={!inputValue.trim() || isGenerating}
              className="p-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          {/* Hint text */}
          <p className="text-center text-xs text-gray-600 mt-2">
            Type naturally • Use *asterisks* for actions • Press Tab for suggestions
          </p>
        </div>
      </footer>
    </div>
  );
}
