
export type TimerMode = 'work' | 'shortBreak' | 'longBreak';
export type BackgroundAnimationType = 'none' | 'gradientFlow' | 'rain' | 'snow' | 'starfield' | 'bubbles';
export type SessionType = 'general' | 'work' | 'learning';

export interface Settings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundscapeWork?: string;
  soundscapeBreak?: string;
  volume: number;
  notificationsEnabled: boolean;
  backgroundAnimation: BackgroundAnimationType;
  mouseTrailEffectEnabled: boolean;
  showCoachMarks: boolean;
}

export interface SessionRecord {
  id: string;
  startTime: number;
  endTime: number;
  mode: TimerMode;
  durationMinutes: number;
  completed: boolean;
}

// Updated to use nameKey for translation
export interface SelectOptionWithTranslation {
  id: string;
  nameKey: string; // Key for translation
  type?: string; // For soundscapes
  params?: any; // For soundscapes
}

// Kept original SoundscapeOption for internal use if needed, though SelectOptionWithTranslation is preferred for UI
export interface SoundscapeOption {
  id: string;
  name: string; // This would ideally be a translation key or handled by i18n
  type: 'noise' | 'tone' | 'file' | 'binaural' | 'patternLoop';
  params?: any;
}


export interface AiSessionSummary {
  summary: string;
  improvements: string;
}

// Kept original BackgroundAnimationOption for internal use if needed
export interface BackgroundAnimationOption {
  id: BackgroundAnimationType;
  name: string; // This would ideally be a translation key or handled by i18n
}


export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface SummarizeSessionInput {
  sessionDetails: string;
  sessionType?: SessionType;
}
