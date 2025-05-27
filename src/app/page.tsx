
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSettingsContext } from "@/contexts/settings-context";
import { useTimerCore } from "@/hooks/use-timer-core";
import { useSoundscapePlayer } from "@/hooks/use-soundscape-player";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { SettingsDialog } from "@/components/settings-dialog";
import { SessionHistoryDrawer, addSessionToHistory } from "@/components/session-history-drawer";
import { AiSummaryDialog } from "@/components/ai-summary-dialog";
import { UserGuideDialog } from "@/components/user-guide-dialog"; // New import
import RainEffect from "@/components/effects/RainEffect";
import SnowEffect from "@/components/effects/SnowEffect";
import StarfieldEffect from "@/components/effects/StarfieldEffect";
import FloatingBubblesEffect from "@/components/effects/FloatingBubblesEffect";
import MouseTrailEffect from "@/components/effects/MouseTrailEffect";
import { SimpleTaskList } from "@/components/simple-task-list";
import { summarizeSession } from "@/ai/flows/summarize-session";
import type { TimerMode, AiSessionSummary, SessionRecord, Task, SessionType } from "@/lib/types";
import { APP_NAME, SESSION_TYPE_OPTIONS } from "@/lib/constants";
import { LogoIcon } from "@/components/icons";
import { Play, Pause, SkipForward, RotateCcw, Sparkles as SparklesIcon, Volume2, VolumeX, BookOpen } from "lucide-react"; // Added BookOpen
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

// Helper component for Coach Marks
const CoachMark: React.FC<{ content: string; children: React.ReactNode; show: boolean; side?: "top" | "bottom" | "left" | "right"}> = ({ content, children, show, side }) => {
  if (!show) return <>{children}</>;
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-center">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};


export default function PomodoroPage() {
  const { settings, isSettingsLoaded } = useSettingsContext();
  const { toast } = useToast();
  const [currentNotes, setCurrentNotes] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentSessionType, setCurrentSessionType] = useState<SessionType>('general');
  const [aiSummary, setAiSummary] = useState<AiSessionSummary | null>(null);
  const [isAiSummaryOpen, setIsAiSummaryOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false); // New state for User Guide

  const soundscapePlayer = useSoundscapePlayer({ volume: settings.volume });

  const getActiveSoundscapeId = useCallback((currentTimerMode: TimerMode): string | undefined => {
    if (isMuted) return 'none';

    switch (settings.backgroundAnimation) {
      case 'rain':
        return 'gentleRain';
      case 'snow':
        return 'pinkNoise'; 
      case 'starfield':
        return 'ambientPad';
      case 'bubbles':
        return 'calmingChimes';
      case 'gradientFlow': 
        return 'whiteNoise';
      case 'none':
      default:
        return currentTimerMode === 'work' ? settings.soundscapeWork : settings.soundscapeBreak;
    }
  }, [isMuted, settings.backgroundAnimation, settings.soundscapeWork, settings.soundscapeBreak]);
  
  const getModeDisplayName = (mode: TimerMode) => {
    switch(mode) {
      case 'work': return 'Work';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
      default: return 'Focus';
    }
  };

  const triggerAiSummary = useCallback(async (logForSummary: SessionRecord[], sessionType: SessionType) => {
    if ((!logForSummary || logForSummary.length === 0) && tasks.length === 0 && !currentNotes) {
      toast({ title: "AI Summary", description: "Not enough session data, tasks, or notes to generate a summary.", variant: "destructive" });
      return;
    }
    setIsAiLoading(true);
    setIsAiSummaryOpen(true);
    setAiSummary(null);

    const sessionDetailsString = logForSummary.map(s => 
      `${getModeDisplayName(s.mode)}: ${s.durationMinutes} min (${s.completed ? 'completed' : 'skipped'})`
    ).join('\n');
    
    const tasksString = tasks.length > 0 
      ? "Tasks:\n" + tasks.map(t => `- [${t.completed ? 'x' : ' '}] ${t.text}`).join('\n')
      : "No specific tasks listed for this session.";

    const fullDetails = `Session Log:\n${logForSummary.length > 0 ? sessionDetailsString : "No pomodoro session log for this analysis."}\n\n${tasksString}\n\nSession Notes:\n${currentNotes || "No additional notes provided."}`;

    try {
      const result = await summarizeSession({ sessionDetails: fullDetails, sessionType });
      setAiSummary(result);
    } catch (error) {
      console.error("AI Summary Error:", error);
      toast({ title: "AI Summary Error", description: "Could not generate session summary.", variant: "destructive" });
      setAiSummary({ summary: "Error generating summary.", improvements: "Please try again later."});
    } finally {
      setIsAiLoading(false);
    }
  }, [currentNotes, tasks, toast, getModeDisplayName]); // Removed sessionLog, it was incorrect. summarizeSession is a dependency now.


  const handleIntervalEnd = useCallback((endedMode: TimerMode, completedPomodoros: number, sessionLogFromHook: SessionRecord[]) => {
    const lastSession = sessionLogFromHook[sessionLogFromHook.length - 1];
    if (lastSession) {
      addSessionToHistory(lastSession);
    }
    
    if (endedMode === 'longBreak' || (endedMode === 'shortBreak' && completedPomodoros % settings.longBreakInterval === 0)) {
      if (endedMode === 'longBreak' && (sessionLogFromHook.length > 0 || tasks.length > 0 || currentNotes)) { 
         triggerAiSummary(sessionLogFromHook, currentSessionType); 
      }
    }
  }, [settings.longBreakInterval, triggerAiSummary, tasks, currentNotes, currentSessionType]);

  const timer = useTimerCore({ 
    settings, 
    onIntervalEnd: handleIntervalEnd,
    onTimerStart: () => {},
    onTimerPause: () => {
      soundscapePlayer.stopSound();
    },
    onTimerReset: () => {
      soundscapePlayer.stopSound();
    },
    onTimerSkip: () => {}
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

  const currentModeDuration = 
    timer.mode === 'work' ? settings.workMinutes * 60 :
    timer.mode === 'shortBreak' ? settings.shortBreakMinutes * 60 :
    settings.longBreakMinutes * 60;
  
  const progressPercentage = ((currentModeDuration - timer.timeLeft) / currentModeDuration) * 100;
  
  const handleToggleMute = () => {
    setIsMuted(prevMuted => !prevMuted);
  };

  const handleAddTask = (taskText: string) => {
    const newTask: Task = { id: Date.now().toString(), text: taskText, completed: false };
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleRemoveTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };
  
  const handleClearCompletedTasks = () => {
    setTasks(prevTasks => prevTasks.filter(task => !task.completed));
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
      {settings.mouseTrailEffectEnabled && <MouseTrailEffect />}
      <div className={cn(
          "relative flex flex-col min-h-screen text-foreground items-center p-4 selection:bg-primary/30",
          settings.backgroundAnimation === 'gradientFlow' && "animated-gradient-background"
        )}>

        {settings.backgroundAnimation === 'rain' && <RainEffect />}
        {settings.backgroundAnimation === 'snow' && <SnowEffect />}
        {settings.backgroundAnimation === 'starfield' && <StarfieldEffect />}
        {settings.backgroundAnimation === 'bubbles' && <FloatingBubblesEffect />}
        
        <header className="w-full max-w-2xl flex justify-between items-center py-4 relative z-[1]">
          <div className="flex items-center space-x-2">
            <CoachMark content="This is the app logo!" show={settings.showCoachMarks}>
              <LogoIcon className="h-8 w-8 text-primary" />
            </CoachMark>
            <CoachMark content={`Welcome to ${APP_NAME}! Your personal focus timer.`} show={settings.showCoachMarks}>
              <h1 className="text-2xl font-semibold animate-title-reveal">{APP_NAME}</h1>
            </CoachMark>
          </div>
          <div className="flex items-center space-x-1">
            <CoachMark content="Get an AI-powered summary and improvement tips for your session." show={settings.showCoachMarks}>
              <Button variant="ghost" size="icon" onClick={() => triggerAiSummary(timer.sessionLog, currentSessionType)} title="Get AI Session Summary (if data available)">
                <SparklesIcon className="h-5 w-5" />
              </Button>
            </CoachMark>
            <CoachMark content="View your past Pomodoro session history." show={settings.showCoachMarks}>
              <SessionHistoryDrawer />
            </CoachMark>
            <CoachMark content="Open the User Guide to learn more about the app features." show={settings.showCoachMarks}>
                <Button variant="ghost" size="icon" onClick={() => setIsUserGuideOpen(true)} title="Open User Guide">
                    <BookOpen className="h-5 w-5" />
                </Button>
            </CoachMark>
            <CoachMark content="Customize timer durations, sounds, appearance, and other preferences." show={settings.showCoachMarks}>
              <SettingsDialog />
            </CoachMark>
            <CoachMark content="Toggle between light and dark themes." show={settings.showCoachMarks}>
              <ThemeToggleButton />
            </CoachMark>
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center w-full max-w-md relative z-[1] space-y-6">
          <Card className="w-full shadow-xl">
            <CardHeader className="text-center">
                <CoachMark content={`Current mode: ${getModeDisplayName(timer.mode)}. Focus on your task or take a break!`} show={settings.showCoachMarks} side="bottom">
                  <CardTitle className="text-2xl font-medium text-primary">
                    {getModeDisplayName(timer.mode)}
                  </CardTitle>
                </CoachMark>
              <CoachMark content={`Dots show completed Pomodoros in the current cycle (out of ${settings.longBreakInterval}). A long break follows a full cycle.`} show={settings.showCoachMarks} side="bottom">
                <div className="flex justify-center mt-2" aria-label={`Completed ${timer.currentCyclePomodoros} of ${settings.longBreakInterval} pomodoros in this cycle.`}>
                    {pomodoroDots}
                </div>
              </CoachMark>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-8">
              <CoachMark content="Time remaining for the current interval. The outer ring shows progress." show={settings.showCoachMarks} side="bottom">
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
              </CoachMark>

              <div className="flex space-x-3">
                <CoachMark content={timer.isRunning ? "Pause the timer." : "Start the timer for the current interval."} show={settings.showCoachMarks}>
                  <Button 
                    size="lg" 
                    onClick={timer.isRunning ? timer.pauseTimer : timer.startTimer}
                    className="w-32 bg-primary hover:bg-primary/90 text-primary-foreground"
                    aria-label={timer.isRunning ? "Pause timer" : "Start timer"}
                  >
                    {timer.isRunning ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                    {timer.isRunning ? 'Pause' : 'Start'}
                  </Button>
                </CoachMark>
                <CoachMark content="Skip to the next interval (e.g., from Work to Break)." show={settings.showCoachMarks}>
                  <Button variant="outline" size="lg" onClick={timer.skipTimer} aria-label="Skip current interval">
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </CoachMark>
                <CoachMark content="Reset the current interval to its full duration and pause." show={settings.showCoachMarks}>
                  <Button variant="outline" size="lg" onClick={() => timer.resetTimer()} aria-label="Reset timer">
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                </CoachMark>
                 <CoachMark content={isMuted ? "Unmute all soundscapes." : "Mute all soundscapes."} show={settings.showCoachMarks}>
                  <Button variant="outline" size="lg" onClick={handleToggleMute} aria-label={isMuted ? "Unmute sound" : "Mute sound"}>
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                </CoachMark>
              </div>
            </CardContent>
          </Card>

          <CoachMark content="Manage your tasks for the session here. Add, complete, or remove tasks." show={settings.showCoachMarks} side="bottom">
            <SimpleTaskList 
              tasks={tasks}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onRemoveTask={handleRemoveTask}
              onClearCompletedTasks={handleClearCompletedTasks}
            />
          </CoachMark>
          
          <Card className="w-full shadow-lg">
            <CardHeader>
              <CoachMark content="Optional notes and context for your session. This info can be used by the AI analyzer." show={settings.showCoachMarks} side="bottom">
                <CardTitle className="text-lg">Session Notes & Context</CardTitle>
              </CoachMark>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <CoachMark content="Select the primary context of your session (e.g., Work, Learning) to get more tailored AI feedback." show={settings.showCoachMarks}>
                  <div>
                    <Label htmlFor="session-type-select" className="text-sm font-medium">Session Context</Label>
                    <Select
                        value={currentSessionType}
                        onValueChange={(value) => setCurrentSessionType(value as SessionType)}
                      >
                        <SelectTrigger id="session-type-select" className="w-full mt-1">
                          <SelectValue placeholder="Select session context" />
                        </SelectTrigger>
                        <SelectContent>
                          {SESSION_TYPE_OPTIONS.map(opt => (
                            <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>
                </CoachMark>
              </div>
              <CoachMark content="Jot down any thoughts, distractions, or ideas that come up during your session." show={settings.showCoachMarks}>
                <Textarea
                  placeholder="Jot down tasks, distractions, or thoughts during your session..."
                  value={currentNotes}
                  onChange={(e) => setCurrentNotes(e.target.value)}
                  className="min-h-[100px] focus:ring-accent"
                />
              </CoachMark>
              <CoachMark content="Click to analyze your current notes, tasks, and session log (if any) with AI, using the selected context." show={settings.showCoachMarks}>
                <Button 
                    variant="outline" 
                    className="mt-3"
                    onClick={() => triggerAiSummary(
                      timer.sessionLog.length > 0 ? timer.sessionLog : (currentNotes || tasks.length > 0 ? [{id: 'data-only', startTime:0, endTime:0, mode:'work', durationMinutes:0, completed:false}] : []),
                      currentSessionType
                    )} 
                    disabled={timer.sessionLog.length === 0 && !currentNotes && tasks.length === 0}
                    title="Analyze current session notes, tasks and log with selected context"
                  >
                    <SparklesIcon className="mr-2 h-4 w-4" /> Analyze Data
                  </Button>
              </CoachMark>
            </CardContent>
          </Card>

        </main>

        <AiSummaryDialog 
          summaryData={aiSummary} 
          isOpen={isAiSummaryOpen} 
          onOpenChange={setIsAiSummaryOpen}
          isLoading={isAiLoading}
        />

        <UserGuideDialog 
            isOpen={isUserGuideOpen}
            onOpenChange={setIsUserGuideOpen}
        />
        
        <footer className="w-full max-w-2xl text-center py-6 text-sm text-muted-foreground relative z-[1]">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. Stay focused!</p>
        </footer>
      </div>
    </>
  );
}
