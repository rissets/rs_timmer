
"use client";

import type { Settings, TimerMode, SessionRecord } from '@/lib/types';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";

interface UseTimerCoreProps {
  settings: Settings;
  currentDateKey: string;
  appName: string; // Added appName prop
  onTimerStart?: (mode: TimerMode) => void;
  onTimerPause?: (mode: TimerMode) => void;
  onTimerReset?: (mode: TimerMode) => void;
  onTimerSkip?: (mode: TimerMode, nextMode: TimerMode) => void;
  onIntervalEnd: (mode: TimerMode, completedPomodoros: number, sessionLog: SessionRecord[]) => void;
  onTick?: (timeLeft: number, mode: TimerMode) => void;
  getTranslatedText: (key: string, replacements?: Record<string, string>) => string;
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
  currentDateKey,
  appName, // Destructure appName
  onTimerStart,
  onTimerPause,
  onTimerReset,
  onTimerSkip,
  onIntervalEnd,
  onTick,
  getTranslatedText,
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
        toast({
            title: getTranslatedText('notifications.disabled'),
            description: getTranslatedText('notifications.disabledDescription', { appName }) // Pass appName here
        });
      }
    }
  }, [settings.notificationsEnabled, toast, getTranslatedText, appName]);

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  const sendNotification = useCallback((title: string, body: string) => {
    if (settings.notificationsEnabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icons/icon-192x192.png' });
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
  }, [settings.workMinutes, settings.shortBreakMinutes, settings.longBreakMinutes]);

  const addSessionLogEntry = useCallback((completed: boolean, actualDurationMinutes: number, currentMode: TimerMode) => {
    const newLogEntry: SessionRecord = {
      id: Date.now().toString(),
      startTime: Date.now() - actualDurationMinutes * 60 * 1000,
      endTime: Date.now(),
      mode: currentMode,
      durationMinutes: actualDurationMinutes,
      completed: completed,
    };
    setSessionLog(prevLog => [...prevLog, newLogEntry]);
    return newLogEntry;
  }, []);

  const moveToNextMode = useCallback((skipped = false) => {
    const previousMode = mode;
    const currentDuration = getDurationForMode(previousMode);
    const actualDurationSeconds = skipped ? currentDuration - timeLeft : currentDuration;
    addSessionLogEntry(!skipped, Math.round(actualDurationSeconds / 60), previousMode);

    let nextMode: TimerMode;
    let completedPomodorosUpdate = currentCyclePomodoros;

    if (previousMode === 'work') {
      completedPomodorosUpdate++;
      if (completedPomodorosUpdate % settings.longBreakInterval === 0) {
        nextMode = 'longBreak';
      } else {
        nextMode = 'shortBreak';
      }
    } else {
      nextMode = 'work';
      if (previousMode === 'longBreak') {
        completedPomodorosUpdate = 0;
      }
    }

    setMode(nextMode);
    setTimeLeft(getDurationForMode(nextMode));
    setCurrentCyclePomodoros(completedPomodorosUpdate);

    // Pass the updated session log to onIntervalEnd
    setSessionLog(currentLog => {
        onIntervalEnd(previousMode, completedPomodorosUpdate, currentLog);
        return currentLog;
    });

    const notificationTitle = previousMode === 'work'
        ? getTranslatedText('notifications.workSessionEnded')
        : getTranslatedText('notifications.breakTimeOver');
    const notificationBody = nextMode === 'work'
        ? getTranslatedText('notifications.timeForWork')
        : nextMode === 'shortBreak'
            ? getTranslatedText('notifications.timeForShortBreak')
            : getTranslatedText('notifications.timeForLongBreak');
    sendNotification(notificationTitle, notificationBody);

    if ((previousMode === 'work' && settings.autoStartBreaks) || (previousMode !== 'work' && settings.autoStartPomodoros)) {
        setIsRunning(true);
    } else {
        setIsRunning(false);
    }

  }, [
    mode, currentCyclePomodoros, settings.longBreakInterval, settings.autoStartBreaks, settings.autoStartPomodoros,
    timeLeft, getDurationForMode, onIntervalEnd, sendNotification, addSessionLogEntry, getTranslatedText
  ]);

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


  const resetTimer = useCallback((switchToWork = false) => {
    setIsRunning(false);
    const nextMode = switchToWork ? 'work' : mode;
    setMode(nextMode);
    setTimeLeft(getDurationForMode(nextMode));
    if (switchToWork) setCurrentCyclePomodoros(0);
    if (onTimerReset) onTimerReset(nextMode);
  }, [mode, getDurationForMode, onTimerReset]);

  useEffect(() => {
    // This effect ensures that if settings related to durations change,
    // and the timer is NOT running, the timeLeft is updated to reflect the new duration for the current mode.
    if (!isRunning) {
      setTimeLeft(getDurationForMode(mode));
    }
  }, [settings.workMinutes, settings.shortBreakMinutes, settings.longBreakMinutes, mode, getDurationForMode]);

  // Effect to reset timer state when currentDateKey changes (new day)
  useEffect(() => {
    console.log("useTimerCore: currentDateKey changed to", currentDateKey, ". Resetting timer for new day.");
    setSessionLog([]);
    setCurrentCyclePomodoros(0);
    
    // Directly set states instead of calling resetTimer to avoid loop
    setIsRunning(false);
    setMode('work');
    setTimeLeft(getDurationForMode('work'));
    if (onTimerReset) {
      onTimerReset('work'); // Call the onTimerReset callback
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDateKey, getDurationForMode]); // onTimerReset is memoized in parent, safe to include if it doesn't change often


  const startTimer = () => {
    setIsRunning(true);
    if (onTimerStart) onTimerStart(mode);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (onTimerPause) onTimerPause(mode);
  };

  const skipTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const previousMode = mode;
    const nextModeAfterSkip = mode === 'work'
      ? (currentCyclePomodoros + 1) % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak'
      : 'work';
    moveToNextMode(true);
    if (onTimerSkip) {
      onTimerSkip(previousMode, nextModeAfterSkip);
    }
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
