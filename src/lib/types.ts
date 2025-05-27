
export type TimerMode = 'work' | 'shortBreak' | 'longBreak';
export type BackgroundAnimationType = 'none' | 'gradientFlow' | 'rain' | 'snow' | 'starfield' | 'bubbles';

export interface Settings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number; // Number of work intervals before a long break
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundscapeWork?: string; // ID of the soundscape
  soundscapeBreak?: string; // ID of the soundscape
  volume: number; // 0 to 1
  notificationsEnabled: boolean;
  backgroundAnimation: BackgroundAnimationType;
  mouseTrailEffectEnabled: boolean; // New setting for mouse trail
}

export interface SessionRecord {
  id: string;
  startTime: number; // timestamp
  endTime: number; // timestamp
  mode: TimerMode;
  durationMinutes: number; // Actual duration in case it was skipped
  completed: boolean; // Was it completed or skipped?
}

export interface SoundscapeOption {
  id: string;
  name: string;
  type: 'noise' | 'tone' | 'file' | 'binaural'; // Added 'binaural'
  params?: any; // For Tone.js specific parameters or file URL
}

export interface AiSessionSummary {
  summary: string;
  improvements: string;
}

export interface BackgroundAnimationOption {
  id: BackgroundAnimationType;
  name: string;
}

