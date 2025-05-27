
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useSettingsContext } from "@/contexts/settings-context";
import { useTimerCore } from "@/hooks/use-timer-core";
import { useSoundscapePlayer } from "@/hooks/use-soundscape-player";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { SettingsDialog } from "@/components/settings-dialog";
import { SessionHistoryDrawer, addSessionToHistory } from "@/components/session-history-drawer";
import { AiSummaryDialog } from "@/components/ai-summary-dialog";
import RainEffect from "@/components/effects/RainEffect";
import SnowEffect from "@/components/effects/SnowEffect";
import { summarizeSession } from "@/ai/flows/summarize-session";
import type { TimerMode, AiSessionSummary, SessionRecord } from "@/lib/types";
import { APP_NAME } from "@/lib/constants";
import { LogoIcon } from "@/components/icons";
import { Play, Pause, SkipForward, RotateCcw, Sparkles as SparklesIcon, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

export default function PomodoroPage() {
  const { settings, isSettingsLoaded } = useSettingsContext();
  const { toast } = useToast();
  const [currentNotes, setCurrentNotes] = useState("");
  const [aiSummary, setAiSummary] = useState<AiSessionSummary | null>(null);
  const [isAiSummaryOpen, setIsAiSummaryOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const soundscapePlayer = useSoundscapePlayer({ volume: settings.volume });

  const getActiveSoundscapeId = useCallback((currentTimerMode: TimerMode): string | undefined => {
    if (isMuted) return 'none';

    switch (settings.backgroundAnimation) {
      case 'rain':
        return 'gentleRain';
      case 'snow':
        return 'pinkNoise'; 
      case 'gradientFlow':
        return 'whiteNoise';
      case 'none':
      default:
        // Fallback to work/break specific sounds if no animation sound is defined
        return currentTimerMode === 'work' ? settings.soundscapeWork : settings.soundscapeBreak;
    }
  }, [isMuted, settings.backgroundAnimation, settings.soundscapeWork, settings.soundscapeBreak]);
  
  const triggerAiSummary = useCallback(async (logForSummary: SessionRecord[]) => {
    if (!logForSummary || logForSummary.length === 0) {
      toast({ title: "AI Summary", description: "Not enough session data to generate a summary.", variant: "destructive" });
      return;
    }
    setIsAiLoading(true);
    setIsAiSummaryOpen(true);
    setAiSummary(null);

    const sessionDetailsString = logForSummary.map(s => 
      `${getModeDisplayName(s.mode)}: ${s.durationMinutes} min (${s.completed ? 'completed' : 'skipped'})`
    ).join('\n');
    
    const fullDetails = `Session Log:\n${sessionDetailsString}\n\nSession Notes:\n${currentNotes || "No notes provided."}`;

    try {
      const result = await summarizeSession({ sessionDetails: fullDetails });
      setAiSummary(result);
      setCurrentNotes(""); // Clear notes after successful summary based on them
      // timer.setSessionLog([]); // Optionally clear log after summary, or keep for history drawer
    } catch (error) {
      console.error("AI Summary Error:", error);
      toast({ title: "AI Summary Error", description: "Could not generate session summary.", variant: "destructive" });
      setAiSummary({ summary: "Error generating summary.", improvements: "Please try again later."});
    } finally {
      setIsAiLoading(false);
    }
  }, [currentNotes, toast]);


  const handleIntervalEnd = useCallback((endedMode: TimerMode, completedPomodoros: number, sessionLogFromHook: SessionRecord[]) => {
    const lastSession = sessionLogFromHook[sessionLogFromHook.length - 1];
    if (lastSession) {
      addSessionToHistory(lastSession);
    }
    
    if (endedMode === 'longBreak' || (endedMode === 'shortBreak' && completedPomodoros % settings.longBreakInterval === 0)) {
      if (endedMode === 'longBreak' && sessionLogFromHook.length > 0) { // only trigger if there's log data
         triggerAiSummary(sessionLogFromHook); 
      }
    }
    // Sound playing is handled by the main useEffect based on timer.mode and timer.isRunning updates
  }, [settings.longBreakInterval, triggerAiSummary]);

  const timer = useTimerCore({ 
    settings, 
    onIntervalEnd: handleIntervalEnd,
    onTimerStart: () => {
      // Sound playing is handled by the main useEffect
    },
    onTimerPause: () => {
      soundscapePlayer.stopSound();
    },
    onTimerReset: () => {
      soundscapePlayer.stopSound();
    },
    onTimerSkip: () => {
       // Sound playing is handled by the main useEffect
    }
  });
  
  useEffect(() => {
    if (!timer.isRunning || !isSettingsLoaded) {
      soundscapePlayer.stopSound();
      return;
    }
    
    const soundId = getActiveSoundscapeId(timer.mode);
    if (soundId && soundId !== 'none') {
      soundscapePlayer.playSound(soundId);
    } else {
      soundscapePlayer.stopSound();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    timer.mode,
    timer.isRunning,
    soundscapePlayer, 
    isSettingsLoaded,
    getActiveSoundscapeId 
  ]);


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeDisplayName = (mode: TimerMode) => {
    switch(mode) {
      case 'work': return 'Work';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
      default: return 'Focus';
    }
  };

  const currentModeDuration = 
    timer.mode === 'work' ? settings.workMinutes * 60 :
    timer.mode === 'shortBreak' ? settings.shortBreakMinutes * 60 :
    settings.longBreakMinutes * 60;
  
  const progressPercentage = ((currentModeDuration - timer.timeLeft) / currentModeDuration) * 100;
  
  const handleToggleMute = () => {
    setIsMuted(prevMuted => !prevMuted);
    // Sound adjustment is handled by the main useEffect reacting to isMuted change
  };


  if (!isSettingsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-4 text-lg">Loading {APP_NAME}...</p>
      </div>
    );
  }
  
  const pomodoroDots = Array(settings.longBreakInterval).fill(0).map((_, i) => (
    <span
      key={i}
      className={`inline-block h-3 w-3 rounded-full mx-1 ${
        i < timer.currentCyclePomodoros ? 'bg-primary' : 'bg-muted'
      }`}
      title={`Pomodoro ${i+1}${ i < timer.currentCyclePomodoros ? ' completed' : ''}`}
    ></span>
  ));


  return (
    <>
      <div className={cn(
          "relative flex flex-col min-h-screen text-foreground items-center p-4 selection:bg-primary/30",
          settings.backgroundAnimation === 'gradientFlow' && "animated-gradient-background"
        )}>

        {settings.backgroundAnimation === 'rain' && <RainEffect />}
        {settings.backgroundAnimation === 'snow' && <SnowEffect />}
        
        <header className="w-full max-w-2xl flex justify-between items-center py-4 relative z-[1]">
          <div className="flex items-center space-x-2">
            <LogoIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold">{APP_NAME}</h1>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" onClick={() => triggerAiSummary(timer.sessionLog)} title="Get AI Session Summary (if data available)">
              <SparklesIcon className="h-5 w-5" />
            </Button>
            <SessionHistoryDrawer />
            <SettingsDialog />
            <ThemeToggleButton />
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center w-full max-w-md relative z-[1]">
          <Card className="w-full shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-medium text-primary">
                {getModeDisplayName(timer.mode)}
              </CardTitle>
              <div className="flex justify-center mt-2" aria-label={`Completed ${timer.currentCyclePomodoros} of ${settings.longBreakInterval} pomodoros in this cycle.`}>
                  {pomodoroDots}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-8">
              <div className="relative w-48 h-48 sm:w-60 sm:h-60" role="timer" aria-live="assertive">
                <Progress 
                  value={progressPercentage} 
                  className="absolute inset-0 w-full h-full rounded-full [&>div]:bg-primary/30" 
                  indicatorClassName="bg-primary!" 
                  style={{clipPath: 'circle(50% at 50% 50%)'}} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl sm:text-7xl font-mono font-bold text-foreground tabular-nums">
                    {formatTime(timer.timeLeft)}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button 
                  size="lg" 
                  onClick={timer.isRunning ? timer.pauseTimer : timer.startTimer}
                  className="w-32 bg-primary hover:bg-primary/90 text-primary-foreground"
                  aria-label={timer.isRunning ? "Pause timer" : "Start timer"}
                >
                  {timer.isRunning ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                  {timer.isRunning ? 'Pause' : 'Start'}
                </Button>
                <Button variant="outline" size="lg" onClick={timer.skipTimer} aria-label="Skip current interval">
                  <SkipForward className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => timer.resetTimer()} aria-label="Reset timer">
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" onClick={handleToggleMute} aria-label={isMuted ? "Unmute sound" : "Mute sound"}>
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="w-full mt-6 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Session Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Jot down tasks, distractions, or thoughts during your session..."
                value={currentNotes}
                onChange={(e) => setCurrentNotes(e.target.value)}
                className="min-h-[100px] focus:ring-accent"
              />
              <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => triggerAiSummary(timer.sessionLog.length > 0 ? timer.sessionLog : (currentNotes ? [{id: 'notes-only', startTime:0, endTime:0, mode:'work', durationMinutes:0, completed:false}] : []))} 
                  disabled={timer.sessionLog.length === 0 && !currentNotes}
                  title="Analyze current session notes and log"
                >
                  <SparklesIcon className="mr-2 h-4 w-4" /> Analyze Notes & Log
                </Button>
            </CardContent>
          </Card>

        </main>

        <AiSummaryDialog 
          summaryData={aiSummary} 
          isOpen={isAiSummaryOpen} 
          onOpenChange={setIsAiSummaryOpen}
          isLoading={isAiLoading}
        />
        
        <footer className="w-full max-w-2xl text-center py-6 text-sm text-muted-foreground relative z-[1]">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. Stay focused!</p>
        </footer>
      </div>
    </>
  );
}

    