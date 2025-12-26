/**
 * SceneHeader - The Sense of Place
 *
 * A subtle header showing:
 * - Current location
 * - Time of day
 * - Weather/atmosphere
 * - Brief ambiance text
 *
 * Design: Minimal, evocative, doesn't distract from story
 */

import React from 'react';
import { MapPin, Sun, Moon, Cloud, CloudRain, CloudSnow, Wind, Sunrise, Sunset } from 'lucide-react';

export default function SceneHeader({ scene }) {
  if (!scene?.location) return null;

  const getTimeIcon = () => {
    const time = scene.timeOfDay || 'day';
    switch (time) {
      case 'morning':
        return { icon: Sunrise, color: 'text-amber-400' };
      case 'day':
        return { icon: Sun, color: 'text-yellow-400' };
      case 'evening':
        return { icon: Sunset, color: 'text-orange-400' };
      case 'night':
        return { icon: Moon, color: 'text-blue-300' };
      default:
        return { icon: Sun, color: 'text-gray-400' };
    }
  };

  const getWeatherIcon = () => {
    const weather = scene.weather?.type;
    if (!weather) return null;

    switch (weather.toLowerCase()) {
      case 'rain':
      case 'rainy':
        return { icon: CloudRain, color: 'text-blue-400' };
      case 'snow':
      case 'snowy':
        return { icon: CloudSnow, color: 'text-cyan-300' };
      case 'cloudy':
      case 'overcast':
        return { icon: Cloud, color: 'text-gray-400' };
      case 'windy':
        return { icon: Wind, color: 'text-teal-400' };
      case 'storm':
      case 'stormy':
        return { icon: CloudRain, color: 'text-purple-400' };
      default:
        return null;
    }
  };

  const TimeIconComponent = getTimeIcon();
  const weatherData = getWeatherIcon();

  return (
    <div className="bg-gray-900/20 border-b border-gray-800/20">
      <div className="max-w-4xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-sm text-gray-400">
              {scene.location?.name || scene.location}
            </span>
          </div>

          {/* Time & Weather */}
          <div className="flex items-center gap-3">
            {/* Time */}
            <div className="flex items-center gap-1">
              <TimeIconComponent.icon className={`w-3.5 h-3.5 ${TimeIconComponent.color}`} />
              <span className="text-xs text-gray-500 capitalize">{scene.timeOfDay || 'Day'}</span>
            </div>

            {/* Weather */}
            {weatherData && (
              <div className="flex items-center gap-1">
                <weatherData.icon className={`w-3.5 h-3.5 ${weatherData.color}`} />
                <span className="text-xs text-gray-500 capitalize">{scene.weather?.type}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ambiance text (if provided) */}
        {scene.ambiance && (
          <p className="text-xs text-gray-600 italic mt-1 text-center">
            {scene.ambiance}
          </p>
        )}
      </div>
    </div>
  );
}
