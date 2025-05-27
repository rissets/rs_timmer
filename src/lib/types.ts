
export type TimerMode = 'work' | 'shortBreak' | 'longBreak';
export type BackgroundAnimationType = 'none' | 'gradientFlow' | 'rain' | 'snow' | 'starfield' | 'bubbles';
export type SessionType = 'general' | 'work' | 'learning';

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
  mouseTrailEffectEnabled: boolean;
  showCoachMarks: boolean; // New setting for coach marks
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
  type: 'noise' | 'tone' | 'file' | 'binaural';
  params?: any;
}

export interface AiSessionSummary {
  summary: string;
  improvements: string;
}

export interface BackgroundAnimationOption {
  id: BackgroundAnimationType;
  name: string;
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
