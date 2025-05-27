
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
import { chatWithAI } from "@/ai/flows/chat-flow"; // Added
import type { TimerMode, AiSessionSummary, SessionRecord, Task, SessionType, ChatMessage } from "@/lib/types";
import type { ChatInput as GenkitChatInput } from "@/ai/flows/chat-flow"; // Added
import { APP_NAME, SESSION_TYPE_OPTIONS } from "@/lib/constants";
import { LogoIcon } from "@/components/icons";
import { Play, Pause, SkipForward, RotateCcw, Sparkles as SparklesIcon, Volume2, VolumeX, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguageContext } from "@/contexts/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ChatWidgetButton } from '@/components/chat-widget-button';
import { ChatPopup } from '@/components/chat-popup';

const INTERACTIVE_TOUR_STORAGE_KEY = "rs-timer-interactive-tour-completed";

export default function PomodoroPage() {
  const { settings, isSettingsLoaded } = useSettingsContext();
  const { t } = useLanguageContext();
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

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInputValue, setChatInputValue] = useState("");
  const [isAiChatLoading, setIsAiChatLoading] = useState(false);


  const tourSteps = React.useMemo(() => [
    {
      title: t('interactiveTourDialog.welcomeTitle', { appName: APP_NAME }),
      content: <p>{t('interactiveTourDialog.welcomeContent', { appName: APP_NAME })}</p>,
    },
    {
      title: t('interactiveTourDialog.timerTitle'),
      content: <p>{t('interactiveTourDialog.timerContent')}</p>,
    },
    {
      title: t('interactiveTourDialog.timerControlsTitle'),
      content: <p>{t('interactiveTourDialog.timerControlsContent')}</p>,
    },
    {
      title: t('interactiveTourDialog.pomodoroDotsTitle'),
      content: <p>{t('interactiveTourDialog.pomodoroDotsContent')}</p>,
    },
    {
      title: t('interactiveTourDialog.tasksTitle'),
      content: <p>{t('interactiveTourDialog.tasksContent')}</p>,
    },
    {
      title: t('interactiveTourDialog.notesContextTitle'),
      content: <p>{t('interactiveTourDialog.notesContextContent')}</p>,
    },
    {
      title: t('interactiveTourDialog.aiAnalysisTitle'),
      content: <p>{t('interactiveTourDialog.aiAnalysisContent')}</p>,
    },
     {
      title: t('interactiveTourDialog.chatWidgetTitle'),
      content: <p>{t('interactiveTourDialog.chatWidgetContent')}</p>,
    },
    {
      title: t('interactiveTourDialog.headerToolsTitle'),
      content: <p>{t('interactiveTourDialog.headerToolsContent')}</p>,
    },
    {
      title: t('interactiveTourDialog.settingsTitle'),
      content: <p>{t('interactiveTourDialog.settingsContent')}</p>,
    },
    {
      title: t('interactiveTourDialog.allSetTitle'),
      content: <p>{t('interactiveTourDialog.allSetContent')}</p>,
    }
  ], [t]);


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
      case 'work': return t('timerModes.work');
      case 'shortBreak': return t('timerModes.shortBreak');
      case 'longBreak': return t('timerModes.longBreak');
      default: return t('timerModes.focus');
    }
  };

  const triggerAiSummary = useCallback(async (logForSummary: SessionRecord[], sessionType: SessionType) => {
    if ((!logForSummary || logForSummary.length === 0) && tasks.length === 0 && !currentNotes) {
      toast({ title: t('ai.noDataForSummary'), variant: "destructive" });
      return;
    }
    setIsAiLoading(true);
    setIsAiSummaryOpen(true);
    setAiSummary(null);

    const sessionDetailsString = logForSummary.map(s => 
      `${getModeDisplayName(s.mode)}: ${s.durationMinutes} min (${s.completed ? t('sessionHistoryDrawer.statusCompleted') : t('sessionHistoryDrawer.statusSkipped')})`
    ).join('\n');
    
    const tasksString = tasks.length > 0 
      ? `${t('cards.tasksTitle')}:\n` + tasks.map(t => `- [${t.completed ? 'x' : ' '}] ${t.text}`).join('\n')
      : t('tasks.noTasks');

    const fullDetails = `Session Log:\n${logForSummary.length > 0 ? sessionDetailsString : t('ai.noSessionLog')}\n\n${tasksString}\n\nSession Notes:\n${currentNotes || t('ai.noNotes')}`;

    try {
      const result = await summarizeSession({ sessionDetails: fullDetails, sessionType });
      setAiSummary(result);
    } catch (error) {
      console.error("AI Summary Error:", error);
      toast({ title: t('ai.errorTitle'), description: t('ai.errorDescription'), variant: "destructive" });
      setAiSummary({ summary: t('ai.errorSummary'), improvements: t('ai.errorImprovements')});
    } finally {
      setIsAiLoading(false);
    }
  }, [currentNotes, tasks, toast, currentSessionType, t, getModeDisplayName]);


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
    onTimerSkip: () => {},
    getTranslatedText: t,
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

  const handleSendChatMessage = async () => {
    if (!chatInputValue.trim()) return;

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: chatInputValue.trim(),
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, newUserMessage]);
    const currentInput = chatInputValue.trim();
    setChatInputValue("");
    setIsAiChatLoading(true);

    try {
      const genkitHistory: GenkitChatInput['history'] = chatMessages
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{text: msg.text}],
        }));

      const response = await chatWithAI({userInput: currentInput, history: genkitHistory});
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response.aiResponse,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error("AI Chat Error:", error);
      toast({ title: t('ai.errorTitle'), description: t('ai.errorDescription'), variant: "destructive" });
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: t('ai.errorChatResponse') || "Sorry, I encountered an error.",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsAiChatLoading(false);
    }
  };


  if (!isSettingsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  const pomodoroDots = Array(settings.longBreakInterval).fill(0).map((_, i) => (
    <span
      key={i}
      className={`inline-block h-3 w-3 rounded-full mx-1 ${
        i < timer.currentCyclePomodoros ? 'bg-primary' : 'bg-muted'
      }`}
      title={t('tooltips.pomodoroProgress', { completed: (i+1).toString(), total: settings.longBreakInterval.toString() })}
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
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" onClick={() => triggerAiSummary(timer.sessionLog, currentSessionType)} title={t('tooltips.aiSummary')}>
              <SparklesIcon className="h-5 w-5" />
            </Button>
            <SessionHistoryDrawer />
            <Button variant="ghost" size="icon" onClick={() => setIsUserGuideOpen(true)} title={t('tooltips.userGuide')}>
                <BookOpen className="h-5 w-5" />
            </Button>
            <SettingsDialog />
            <ThemeToggleButton />
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center w-full max-w-md relative z-[1] space-y-6 pb-20"> {/* Added pb-20 for chat button */}
          <Card className="w-full shadow-xl">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-medium text-primary">
                  {getModeDisplayName(timer.mode)}
                </CardTitle>
              <div className="flex justify-center mt-2" aria-label={t('tooltips.pomodoroProgress', { completed: timer.currentCyclePomodoros.toString(), total: settings.longBreakInterval.toString() })}>
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
                  aria-label={timer.isRunning ? t('buttons.pause') : t('buttons.start')}
                >
                  {timer.isRunning ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                  {timer.isRunning ? t('buttons.pause') : t('buttons.start')}
                </Button>
                <Button variant="outline" size="icon" onClick={timer.skipTimer} aria-label={t('buttons.skip')}>
                  <SkipForward className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => timer.resetTimer()} aria-label={t('buttons.reset')}>
                  <RotateCcw className="h-5 w-5" />
                </Button>
                 <Button variant="outline" size="icon" onClick={handleToggleMute} aria-label={isMuted ? t('buttons.unmute') : t('buttons.mute')}>
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
                <CardTitle className="text-lg">{t('cards.notesTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div>
                  <Label htmlFor="session-type-select" className="text-sm font-medium">{t('cards.sessionContextLabel')}</Label>
                  <Select
                      value={currentSessionType}
                      onValueChange={(value) => setCurrentSessionType(value as SessionType)}
                    >
                      <SelectTrigger id="session-type-select" className="w-full mt-1">
                        <SelectValue placeholder={t('cards.sessionContextPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {SESSION_TYPE_OPTIONS.map(opt => (
                          <SelectItem key={opt.id} value={opt.id}>{t(opt.nameKey)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
              </div>
              <Textarea
                placeholder={t('notes.textareaPlaceholder')}
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
                  title={t('tooltips.analyzeCurrentData')}
                >
                  <SparklesIcon className="mr-2 h-4 w-4" /> {t('buttons.analyzeData')}
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

        <ChatWidgetButton onClick={() => setIsChatOpen(prev => !prev)} />
        <ChatPopup
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={chatMessages}
          inputValue={chatInputValue}
          onInputChange={setChatInputValue}
          onSendMessage={handleSendChatMessage}
          isLoadingAiResponse={isAiChatLoading}
        />
        
        <footer className="w-full max-w-2xl text-center py-6 text-sm text-muted-foreground relative z-[1]">
          <p>{t('footerCopyright', { year: new Date().getFullYear().toString() })}</p>
        </footer>
      </div>
    </>
  );
}
