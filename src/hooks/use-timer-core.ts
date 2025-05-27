
"use client";

import type { Settings, TimerMode, SessionRecord } from '@/lib/types';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";

interface UseTimerCoreProps {
  settings: Settings;
  onTimerStart?: (mode: TimerMode) => void;
  onTimerPause?: (mode: TimerMode) => void;
  onTimerReset?: (mode: TimerMode) => void;
  onTimerSkip?: (mode: TimerMode, nextMode: TimerMode) => void;
  onIntervalEnd: (mode: TimerMode, completedPomodoros: number, sessionLog: SessionRecord[]) => void;
  onTick?: (timeLeft: number, mode: TimerMode) => void;
}

interface TimerCore {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  pomodorosInCycle: number;
  currentCyclePomodoros: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: (switchToWork?: boolean) => void;
  skipTimer: () => void;
  sessionLog: SessionRecord[];
  setSessionLog: React.Dispatch<React.SetStateAction<SessionRecord[]>>;
}

export function useTimerCore({
  settings,
  onTimerStart,
  onTimerPause,
  onTimerReset,
  onTimerSkip,
  onIntervalEnd,
  onTick,
}: UseTimerCoreProps): TimerCore {
  const { toast } = useToast();
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [currentCyclePomodoros, setCurrentCyclePomodoros] = useState(0);
  const [sessionLog, setSessionLog] = useState<SessionRecord[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickTimeRef = useRef<number>(0);

  const requestNotificationPermission = useCallback(async () => {
    if (!settings.notificationsEnabled || typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({ title: "Notifications Disabled", description: "You won't receive interval alerts." });
      }
    }
  }, [settings.notificationsEnabled, toast]);

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  const sendNotification = useCallback((title: string, body: string) => {
    if (settings.notificationsEnabled && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/zenith-icon.png' }); // Placeholder icon
    }
  }, [settings.notificationsEnabled]);

  const getDurationForMode = useCallback((currentMode: TimerMode): number => {
    switch (currentMode) {
      case 'work':
        return settings.workMinutes * 60;
      case 'shortBreak':
        return settings.shortBreakMinutes * 60;
      case 'longBreak':
        return settings.longBreakMinutes * 60;
      default:
        return settings.workMinutes * 60;
    }
  }, [settings]);

  const logSession = useCallback((completed: boolean, actualDurationMinutes: number) => {
    const newLogEntry: SessionRecord = {
      id: Date.now().toString(),
      startTime: Date.now() - actualDurationMinutes * 60 * 1000,
      endTime: Date.now(),
      mode: mode,
      durationMinutes: actualDurationMinutes,
      completed: completed,
    };
    setSessionLog(prevLog => [...prevLog, newLogEntry]);
    return newLogEntry;
  }, [mode]);
  
  const moveToNextMode = useCallback((skipped = false) => {
    let nextMode: TimerMode;
    let completedPomodorosUpdate = currentCyclePomodoros;
    const currentDuration = getDurationForMode(mode);
    const actualDurationSeconds = skipped ? currentDuration - timeLeft : currentDuration;
    logSession(!skipped, Math.round(actualDurationSeconds / 60));

    if (mode === 'work') {
      completedPomodorosUpdate++;
      if (completedPomodorosUpdate % settings.longBreakInterval === 0) {
        nextMode = 'longBreak';
      } else {
        nextMode = 'shortBreak';
      }
    } else { // break ended
      nextMode = 'work';
      if (mode === 'longBreak') {
        completedPomodorosUpdate = 0; // Reset cycle
      }
    }
    
    setMode(nextMode);
    setTimeLeft(getDurationForMode(nextMode));
    setCurrentCyclePomodoros(completedPomodorosUpdate);
    onIntervalEnd(mode, completedPomodorosUpdate, sessionLog); // Pass sessionLog before it's updated by the next logSession

    const notificationTitle = mode === 'work' ? 'Work session ended!' : 'Break time is over!';
    const notificationBody = `Time for ${nextMode === 'work' ? 'work' : nextMode === 'shortBreak' ? 'a short break' : 'a long break'}.`;
    sendNotification(notificationTitle, notificationBody);

    if ((mode === 'work' && settings.autoStartBreaks) || (mode !== 'work' && settings.autoStartPomodoros)) {
        setIsRunning(true); // Auto start next
    } else {
        setIsRunning(false);
    }

  }, [mode, currentCyclePomodoros, settings, timeLeft, getDurationForMode, onIntervalEnd, sendNotification, logSession, sessionLog]);


  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    lastTickTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.round((now - lastTickTimeRef.current) / 1000);
      lastTickTimeRef.current = now;

      setTimeLeft(prev => {
        const newTimeLeft = prev - elapsedSeconds;
        if (newTimeLeft <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          moveToNextMode();
          return 0;
        }
        if (onTick) onTick(newTimeLeft, mode);
        return newTimeLeft;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, moveToNextMode, onTick]);

  // Update timer when settings change and timer is not running
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(getDurationForMode(mode));
    }
  }, [settings, mode, isRunning, getDurationForMode]);

  const startTimer = () => {
    if (Tone.context.state !== 'running') { // Ensure audio context is started
      Tone.start().then(() => {
         console.log("AudioContext started by timer start.");
      });
    }
    setIsRunning(true);
    if (onTimerStart) onTimerStart(mode);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (onTimerPause) onTimerPause(mode);
  };

  const resetTimer = (switchToWork = false) => {
    setIsRunning(false);
    const nextMode = switchToWork ? 'work' : mode;
    setMode(nextMode);
    setTimeLeft(getDurationForMode(nextMode));
    if (switchToWork) setCurrentCyclePomodoros(0); // Reset cycle if forced to work
    if (onTimerReset) onTimerReset(nextMode);
  };

  const skipTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const previousMode = mode;
    moveToNextMode(true); // true indicates skipped
    if (onTimerSkip) onTimerSkip(previousMode, mode); // mode is now the nextMode
  };

  return {
    mode,
    timeLeft,
    isRunning,
    pomodorosInCycle: settings.longBreakInterval,
    currentCyclePomodoros,
    startTimer,
    pauseTimer,
    resetTimer,
    skipTimer,
    sessionLog,
    setSessionLog,
  };
}
