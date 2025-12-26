/**
 * CharacterPresence - Shows Who's Here With You
 *
 * A bar showing present characters with:
 * - Avatar with initial
 * - Relationship indicator
 * - Speaking indicator
 * - Quick relationship summary on hover/tap
 */

import React, { useState } from 'react';
import { Heart, Shield, Zap } from 'lucide-react';

export default function CharacterPresence({
  characters,
  relationships,
  speakingCharacter
}) {
  const [expandedCharacter, setExpandedCharacter] = useState(null);

  if (!characters || characters.length === 0) return null;

  const getCharacterColor = (name) => {
    const colorIndex = name?.charCodeAt(0) % 5 || 0;
    const colors = [
      { bg: 'bg-emerald-600', ring: 'ring-emerald-400', text: 'text-emerald-400' },
      { bg: 'bg-blue-600', ring: 'ring-blue-400', text: 'text-blue-400' },
      { bg: 'bg-purple-600', ring: 'ring-purple-400', text: 'text-purple-400' },
      { bg: 'bg-pink-600', ring: 'ring-pink-400', text: 'text-pink-400' },
      { bg: 'bg-cyan-600', ring: 'ring-cyan-400', text: 'text-cyan-400' }
    ];
    return colors[colorIndex];
  };

  const getRelationshipSummary = (rel) => {
    if (!rel) return { label: 'New', icon: null };

    const { trust, affection, tension, familiarity } = rel;

    // High tension overrides
    if (tension > 70) {
      return { label: 'Tense', icon: Zap, color: 'text-red-400' };
    }

    // High trust + affection
    if (trust > 70 && affection > 70) {
      return { label: 'Close', icon: Heart, color: 'text-pink-400' };
    }

    // High trust
    if (trust > 70) {
      return { label: 'Trusted', icon: Shield, color: 'text-emerald-400' };
    }

    // High affection
    if (affection > 70) {
      return { label: 'Warm', icon: Heart, color: 'text-amber-400' };
    }

    // Low trust
    if (trust < 30) {
      return { label: 'Wary', icon: null, color: 'text-gray-500' };
    }

    // Default based on familiarity
    if (familiarity > 50) {
      return { label: 'Familiar', icon: null, color: 'text-gray-400' };
    }

    return { label: 'New', icon: null, color: 'text-gray-500' };
  };

  return (
    <div className="border-b border-gray-800/30 bg-gray-900/30">
      <div className="max-w-4xl mx-auto px-4 py-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <span className="text-xs text-gray-600 mr-2 flex-shrink-0">Present:</span>

          {characters.map((character) => {
            const color = getCharacterColor(character.name);
            const rel = relationships?.[character.name];
            const relSummary = getRelationshipSummary(rel);
            const isSpeaking = speakingCharacter?.name === character.name;
            const isExpanded = expandedCharacter === character.name;
            const initial = character.name?.charAt(0)?.toUpperCase() || '?';

            return (
              <div key={character.name} className="relative">
                <button
                  onClick={() => setExpandedCharacter(isExpanded ? null : character.name)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all flex-shrink-0 ${
                    isSpeaking
                      ? `bg-gray-800/80 ${color.ring} ring-2`
                      : 'bg-gray-800/40 hover:bg-gray-800/60'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-6 h-6 ${color.bg} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-xs font-bold">{initial}</span>
                  </div>

                  {/* Name */}
                  <span className={`text-sm ${isSpeaking ? 'text-white' : 'text-gray-400'}`}>
                    {character.name}
                  </span>

                  {/* Relationship indicator */}
                  {relSummary.icon && (
                    <relSummary.icon className={`w-3 h-3 ${relSummary.color}`} />
                  )}

                  {/* Speaking indicator */}
                  {isSpeaking && (
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
                      <span className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </span>
                  )}
                </button>

                {/* Expanded relationship card */}
                {isExpanded && (
                  <div className="absolute top-full left-0 mt-2 z-50 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-xl p-4 animate-fadeIn">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 ${color.bg} rounded-full flex items-center justify-center`}>
                        <span className="text-white text-lg font-bold">{initial}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{character.name}</h4>
                        <p className="text-xs text-gray-500">{character.role || 'Character'}</p>
                      </div>
                    </div>

                    {/* Relationship meters */}
                    {rel && (
                      <div className="space-y-2">
                        <RelationshipMeter label="Trust" value={rel.trust || 50} color="emerald" />
                        <RelationshipMeter label="Affection" value={rel.affection || 50} color="pink" />
                        {rel.tension > 20 && (
                          <RelationshipMeter label="Tension" value={rel.tension} color="red" />
                        )}
                      </div>
                    )}

                    {/* Traits */}
                    {character.traits && character.traits.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-800">
                        <div className="flex flex-wrap gap-1">
                          {character.traits.slice(0, 3).map((trait, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded">
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent history */}
                    {rel?.history && rel.history.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-800">
                        <p className="text-xs text-gray-600 mb-1">Recent:</p>
                        <p className="text-xs text-gray-400 italic">
                          {rel.history[rel.history.length - 1]?.moment}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RelationshipMeter({ label, value, color }) {
  const colorClasses = {
    emerald: 'bg-emerald-500',
    pink: 'bg-pink-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500'
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color] || colorClasses.emerald} transition-all duration-300`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 w-6 text-right">{value}</span>
    </div>
  );
}
