
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
import { useSettingsContext } from "@/contexts/settings-context";
import { useTimerCore } from "@/hooks/use-timer-core";
import { useSoundscapePlayer } from "@/hooks/use-soundscape-player";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { SettingsDialog } from "@/components/settings-dialog";
import { SessionHistoryDrawer, addSessionToHistory } from "@/components/session-history-drawer";
import { AiSummaryDialog } from "@/components/ai-summary-dialog";
import { UserGuideDialog } from "@/components/user-guide-dialog";
import { InteractiveTourDialog } from "@/components/interactive-tour-dialog";
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
import { Play, Pause, SkipForward, RotateCcw, Sparkles as SparklesIcon, Volume2, VolumeX, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { useIsMobile } from "@/hooks/use-mobile";

const INTERACTIVE_TOUR_STORAGE_KEY = "zenith-timer-interactive-tour-completed"; // Keeping old key to not reset tour for existing users

const tourSteps = [
  {
    title: `Welcome to ${APP_NAME} Timer!`,
    content: <p>Let's take a quick tour of the main features to get you started.</p>,
  },
  {
    title: "The Timer",
    content: <p>This is the core of the app. It shows the time remaining for your current session (Work, Short Break, or Long Break). The ring around it shows your progress.</p>,
  },
  {
    title: "Timer Controls",
    content: <p>Use these buttons to <strong>Start/Pause</strong>, <strong>Skip</strong> to the next interval, or <strong>Reset</strong> the current one. You can also <strong>Mute/Unmute</strong> sounds.</p>,
  },
  {
    title: "Pomodoro Dots",
    content: <p>These dots indicate how many Pomodoro (work) sessions you've completed in the current cycle before a Long Break.</p>,
  },
  {
    title: "Tasks",
    content: <p>Manage your tasks for the session here. Add new tasks, mark them as complete, or remove them. This helps you stay focused.</p>,
  },
  {
    title: "Session Notes & Context",
    content: <p>Jot down any thoughts, distractions, or ideas. You can also select a <strong>Session Context</strong> (like 'Work' or 'Learning') to get tailored AI feedback.</p>,
  },
  {
    title: "AI Analysis",
    content: <p>Click the <strong>Sparkles icon</strong> (✨) or 'Analyze Data' button to get an AI-powered summary and improvement tips based on your session log, tasks, notes, and context.</p>,
  },
  {
    title: "Header Tools",
    content: <p>In the top right, you'll find quick access to: <br/>- AI Analysis (✨) <br/>- Session History (📜) <br/>- This User Guide (📖) <br/>- Settings (⚙️) <br/>- Theme Toggle (☀️/🌙)</p>,
  },
  {
    title: "Settings (Gear Icon ⚙️)",
    content: <p>Customize everything! Adjust timer durations, auto-start behavior, soundscapes, volume, background animations, and more.</p>,
  },
  {
    title: "You're All Set!",
    content: <p>That's a quick overview. Explore the settings to personalize your experience. Happy focusing!</p>,
  }
];


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
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  
  const [isInteractiveTourActive, setIsInteractiveTourActive] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isSettingsLoaded) {
      const tourCompleted = localStorage.getItem(INTERACTIVE_TOUR_STORAGE_KEY);
      if (!tourCompleted && settings.showCoachMarks) {
        setIsInteractiveTourActive(true);
        setCurrentTourStep(0);
      }
    }
  }, [isSettingsLoaded, settings.showCoachMarks]);

  const handleNextTourStep = () => {
    if (currentTourStep < tourSteps.length - 1) {
      setCurrentTourStep(prev => prev + 1);
    } else {
      handleFinishTour();
    }
  };

  const handleFinishTour = () => {
    setIsInteractiveTourActive(false);
    localStorage.setItem(INTERACTIVE_TOUR_STORAGE_KEY, "true");
  };


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
      : "No specific tasks listed for this analysis.";

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
  }, [currentNotes, tasks, toast, currentSessionType]); 


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
        <p className="ml-4 text-lg">Loading ${APP_NAME} Timer...</p>
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
          {isMobile ? (
            <h1 className="text-xl font-semibold animate-title-reveal">{APP_NAME}</h1>
          ) : (
            <div className="flex items-center space-x-2">
              <LogoIcon className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-semibold animate-title-reveal">{APP_NAME} Timer</h1>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" onClick={() => triggerAiSummary(timer.sessionLog, currentSessionType)} title="Get AI Session Summary (if data available)">
              <SparklesIcon className="h-5 w-5" />
            </Button>
            <SessionHistoryDrawer />
            <Button variant="ghost" size="icon" onClick={() => setIsUserGuideOpen(true)} title="Open User Guide">
                <BookOpen className="h-5 w-5" />
            </Button>
            <SettingsDialog />
            <ThemeToggleButton />
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center w-full max-w-md relative z-[1] space-y-6">
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
                <Button variant="outline" size="icon" onClick={timer.skipTimer} aria-label="Skip current interval">
                  <SkipForward className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => timer.resetTimer()} aria-label="Reset timer">
                  <RotateCcw className="h-5 w-5" />
                </Button>
                 <Button variant="outline" size="icon" onClick={handleToggleMute} aria-label={isMuted ? "Unmute sound" : "Mute sound"}>
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <SimpleTaskList 
            tasks={tasks}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onRemoveTask={handleRemoveTask}
            onClearCompletedTasks={handleClearCompletedTasks}
          />
          
          <Card className="w-full shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg">Session Notes & Context</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
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
              </div>
              <Textarea
                placeholder="Jot down tasks, distractions, or thoughts during your session..."
                value={currentNotes}
                onChange={(e) => setCurrentNotes(e.target.value)}
                className="min-h-[100px] focus:ring-accent"
              />
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

        <InteractiveTourDialog
          isOpen={isInteractiveTourActive}
          currentStep={currentTourStep}
          totalSteps={tourSteps.length}
          stepData={tourSteps[currentTourStep]}
          onNext={handleNextTourStep}
          onSkip={handleFinishTour}
        />
        
        <footer className="w-full max-w-2xl text-center py-6 text-sm text-muted-foreground relative z-[1]">
          <p>&copy; {new Date().getFullYear()} {APP_NAME} Timer. Stay focused!</p>
        </footer>
      </div>
    </>
  );
}

    

    