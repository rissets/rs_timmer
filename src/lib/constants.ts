
import type { Settings, SoundscapeOption } from '@/lib/types';

export const DEFAULT_SETTINGS: Settings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreaks: true,
  autoStartPomodoros: true,
  soundscapeWork: 'whiteNoise',
  soundscapeBreak: 'gentleRain',
  volume: 0.5,
  notificationsEnabled: true,
};

export const SOUNDSCAPE_OPTIONS: SoundscapeOption[] = [
  { id: 'none', name: 'None', type: 'noise', params: { type: 'off' } },
  { id: 'whiteNoise', name: 'White Noise', type: 'noise', params: { type: 'white', volume: -6 } },
  { id: 'pinkNoise', name: 'Pink Noise', type: 'noise', params: { type: 'pink', volume: -6 } },
  { id: 'brownNoise', name: 'Brown Noise', type: 'noise', params: { type: 'brown', volume: -6 } },
  { id: 'gentleRain', name: 'Gentle Rain (Simulated)', type: 'noise', params: { type: 'pink', volume: -18 } }, // Adjusted volume
  { id: 'focusTone', name: 'Focus Tone (440Hz Sine)', type: 'tone', params: { frequency: 440, type: 'sine' } },
  { id: 'deepDrone', name: 'Deep Drone (80Hz Sine)', type: 'tone', params: { frequency: 80, type: 'sine', volume: -10 } },
  { id: 'windyAmbience', name: 'Windy Ambience', type: 'noise', params: { type: 'pink', volume: -20 } }, // Quieter pink noise
  { id: 'alphaBinaural', name: 'Alpha Binaural (8Hz Beat)', type: 'binaural', params: { baseFrequency: 100, beatFrequency: 8, volume: -15 } },
];

export const APP_NAME = "Zenith Timer";
