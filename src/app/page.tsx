
"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useSettingsContext } from "@/contexts/settings-context";
import { useTimerCore } from "@/hooks/use-timer-core";
import { useSoundscapePlayer } from "@/hooks/use-soundscape-player";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { SettingsDialog } from "@/components/settings-dialog";
import { SessionHistoryDrawer } from "@/components/session-history-drawer";
import { AiSummaryDialog } from "@/components/ai-summary-dialog";
import { UserGuideDialog } from "@/components/user-guide-dialog";
import { InteractiveTourDialog } from "@/components/interactive-tour-dialog";
import RainEffect from "@/components/effects/RainEffect";
import SnowEffect from "@/components/effects/SnowEffect";
import StarfieldEffect from "@/components/effects/StarfieldEffect";
import FloatingBubblesEffect from "@/components/effects/FloatingBubblesEffect";
import FirefliesEffect from "@/components/effects/FirefliesEffect";
import MouseTrailEffect from "@/components/effects/MouseTrailEffect";
import { SimpleTaskList } from "@/components/simple-task-list";
import { DictionaryCard } from "@/components/dictionary-card";
import { summarizeSession } from "@/ai/flows/summarize-session";
import { chatWithAI } from "@/ai/flows/chat-flow";
import { defineWord } from "@/ai/flows/define-word-flow";
import { generateText } from '@/ai/flows/generate-text-flow'; // For integrated AI generator
import type { TimerMode, AiSessionSummary, SessionRecord, Task, SessionType, ChatMessage, DefinedWordEntry } from "@/lib/types";
import type { ChatInput as GenkitChatInput } from "@/ai/flows/chat-flow";
import { APP_NAME, SESSION_TYPE_OPTIONS, DEFAULT_SETTINGS } from "@/lib/constants";
import { LogoIcon } from "@/components/icons";
import { Play, Pause, SkipForward, RotateCcw, Sparkles as SparklesIcon, Volume2, VolumeX, BookOpen, LogOut, ListChecks, FileText, CalendarIcon as CalendarIconLucide, Loader2, Save, Trash2, Clock, Bot, ClipboardCopy, Wand2, Notebook } from "lucide-react"; // Added Notebook icon
import { useToast } from "@/hooks/use-toast";
import { cn, getCurrentDateString, formatDateToKey } from '@/lib/utils';
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguageContext } from "@/contexts/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ChatWidgetButton } from '@/components/chat-widget-button';
import { ChatPopup } from '@/components/chat-popup';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  saveTasksForDay, loadTasksForDay,
  saveNotesForDay, loadNotesForDay,
  saveDictionaryForDay, loadDictionaryForDay,
  saveSessionContextForDay, loadSessionContextForDay,
  saveSessionLogForDay, deleteNotesForDay
} from '@/lib/firebase/firestore-service';
import { format } from 'date-fns';


const INTERACTIVE_TOUR_STORAGE_KEY = "rs-timer-interactive-tour-completed";

export default function PomodoroPage() {
  const { settings, isSettingsLoaded } = useSettingsContext();
  const { language, t } = useLanguageContext();
  const { toast } = useToast();
  const { currentUser, loading: authLoading, logoutUser } = useAuth();
  const router = useRouter();

  const [currentDateKey, setCurrentDateKey] = useState(getCurrentDateString());

  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentNotes, setCurrentNotes] = useState("");
  const [currentSessionType, setCurrentSessionType] = useState<SessionType | null>(null);
  const [definedWordsList, setDefinedWordsList] = useState<DefinedWordEntry[]>([]);
  const [isLoadingDailyData, setIsLoadingDailyData] = useState(true);

  const [aiSummary, setAiSummary] = useState<AiSessionSummary | null>(null);
  const [isAiSummaryOpen, setIsAiSummaryOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [isInteractiveTourActive, setIsInteractiveTourActive] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const isMobile = useIsMobile();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInputValue, setChatInputValue] = useState("");
  const [isAiChatLoading, setIsAiChatLoading] = useState(false);
  const [isDefiningWord, setIsDefiningWord] = useState(false);

  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>(['tasks', 'dictionary', 'notes']);
  const [openPastNotesAccordion, setOpenPastNotesAccordion] = useState<string[]>([]);
  
  const [selectedPastDateForNotes, setSelectedPastDateForNotes] = useState<Date | undefined>();
  const [pastDateNotes, setPastDateNotes] = useState<string | null>(null);
  const [isLoadingPastNotes, setIsLoadingPastNotes] = useState(false);
  const [isPastNotesPopoverOpen, setIsPastNotesPopoverOpen] = useState(false);
  const [isDeletingPastNotes, setIsDeletingPastNotes] = useState(false);
  const [taskForAlert, setTaskForAlert] = useState<Task | null>(null);

  // State for integrated AI Note Generator Dialog
  const [isAiGenerateNoteDialogOpen, setIsAiGenerateNoteDialogOpen] = useState(false);
  const [aiGenerateNotePrompt, setAiGenerateNotePrompt] = useState("");
  const [aiGeneratedNoteText, setAiGeneratedNoteText] = useState("");
  const [isGeneratingNoteText, setIsGeneratingNoteText] = useState(false);


  const handleTimerStartCb = useCallback(() => {}, []);
  const handleTimerPauseCb = useCallback(() => {}, []);
  const handleTimerResetCb = useCallback((_mode: TimerMode) => {}, []);
  const handleTimerSkipCb = useCallback((_skippedMode: TimerMode, _nextMode: TimerMode) => {}, []);


  const getModeDisplayName = useCallback((mode: TimerMode) => {
    switch(mode) {
      case 'work': return t('timerModes.work');
      case 'shortBreak': return t('timerModes.shortBreak');
      case 'longBreak': return t('timerModes.longBreak');
      default: return t('timerModes.focus');
    }
  }, [t]);

  const triggerAiSummary = useCallback(async (logForSummary: SessionRecord[], sessionType: SessionType | null) => {
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
      ? `${t('cards.tasksTitle')}:\n` + tasks.map(task => `- [${task.completed ? 'x' : ' '}] ${task.text}`).join('\n')
      : t('tasks.noTasks');

    const fullDetails = `Session Log:\n${logForSummary.length > 0 ? sessionDetailsString : t('ai.noSessionLog')}\n\n${tasksString}\n\nSession Notes:\n${currentNotes || t('ai.noNotes')}`;

    try {
      const result = await summarizeSession({ sessionDetails: fullDetails, sessionType: sessionType || undefined });
      setAiSummary(result);
    } catch (error: any) {
      console.error("AI Summary Error:", error);
      toast({ title: t('ai.errorTitle'), description: error.message || t('ai.errorDescription'), variant: "destructive" });
      setAiSummary({ summary: t('ai.errorSummary'), improvements: t('ai.errorImprovements')});
    } finally {
      setIsAiLoading(false);
    }
  }, [currentNotes, tasks, toast, t, getModeDisplayName]);

  const handleIntervalEnd = useCallback((endedMode: TimerMode, completedPomodoros: number, sessionLogFromHook: SessionRecord[]) => {
    setTimeout(() => {
      if ((sessionLogFromHook.length > 0 || tasks.length > 0 || currentNotes) && settings.notificationsEnabled) {
        if (endedMode === 'longBreak' || (endedMode === 'shortBreak' && completedPomodoros % settings.longBreakInterval === 0)) {
            triggerAiSummary(sessionLogFromHook, currentSessionType);
        }
      }
    }, 0);
  }, [settings.longBreakInterval, settings.notificationsEnabled, triggerAiSummary, tasks, currentNotes, currentSessionType, settings.autoStartBreaks, settings.autoStartPomodoros]);


  const timer = useTimerCore({
    settings,
    currentDateKey,
    appName: APP_NAME,
    onIntervalEnd: handleIntervalEnd,
    onTimerStart: handleTimerStartCb,
    onTimerPause: handleTimerPauseCb,
    onTimerReset: handleTimerResetCb,
    onTimerSkip: handleTimerSkipCb,
    getTranslatedText: t,
  });

  const soundscapePlayer = useSoundscapePlayer({
    volume: settings.volume,
    settings,
    isSettingsLoaded,
  });

  const { playSound, stopSound, isReady: isSoundPlayerReady } = soundscapePlayer;


  useEffect(() => {
    const interval = setInterval(() => {
      const newDateKey = getCurrentDateString();
      if (newDateKey !== currentDateKey) {
        setCurrentDateKey(newDateKey);
        setSelectedPastDateForNotes(undefined);
        setPastDateNotes(null);
        setOpenPastNotesAccordion([]);
        setTasks(prevTasks => prevTasks.map(task => ({ ...task, reminderSent: false })));
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [currentDateKey]);

  useEffect(() => {
    if (!currentUser || !isSettingsLoaded) return;

    const loadData = async () => {
      setIsLoadingDailyData(true);
      try {
        const [loadedTasks, loadedNotes, loadedDict, loadedContext] = await Promise.all([
          loadTasksForDay(currentUser.uid, currentDateKey),
          loadNotesForDay(currentUser.uid, currentDateKey),
          loadDictionaryForDay(currentUser.uid, currentDateKey),
          loadSessionContextForDay(currentUser.uid, currentDateKey),
        ]);
        setTasks(loadedTasks.map(task => ({...task, reminderSent: task.reminderSent || false })));
        setCurrentNotes(loadedNotes || "");
        setDefinedWordsList(loadedDict);
        setCurrentSessionType(loadedContext || 'general');
      } catch (error) {
        console.error("Error loading daily data from Firestore:", error);
        toast({ title: t("errors.firestoreLoadTitle"), description: t("errors.firestoreLoadDescription"), variant: "destructive" });
        setTasks([]);
        setCurrentNotes("");
        setDefinedWordsList([]);
        setCurrentSessionType('general');
      } finally {
        setIsLoadingDailyData(false);
      }
    };
    loadData();
  }, [currentDateKey, currentUser, isSettingsLoaded, toast, t]);


  useEffect(() => {
    if (!currentUser || isLoadingDailyData || !isSettingsLoaded || tasks === undefined) return;
    if (tasks.length > 0 || (tasks.length === 0 && JSON.stringify(tasks) !== JSON.stringify([]))) {
        saveTasksForDay(currentUser.uid, currentDateKey, tasks).catch(error => {
        console.error("Error saving tasks to Firestore:", error);
        toast({ title: t("errors.firestoreSaveTitle"), description: t("errors.firestoreSaveTasksDescription"), variant: "destructive" });
        });
    }
  }, [tasks, currentDateKey, currentUser, isLoadingDailyData, isSettingsLoaded, toast, t]);


  useEffect(() => {
    if (!currentUser || isLoadingDailyData || !isSettingsLoaded || typeof currentNotes !== 'string') return;
      saveNotesForDay(currentUser.uid, currentDateKey, currentNotes).catch(error => {
          console.error("Error saving notes to Firestore:", error);
          toast({ title: t("errors.firestoreSaveTitle"), description: t("errors.firestoreSaveNotesDescription"), variant: "destructive" });
      });
  }, [currentNotes, currentDateKey, currentUser, isLoadingDailyData, isSettingsLoaded, toast, t]);


  useEffect(() => {
    if (!currentUser || isLoadingDailyData || !isSettingsLoaded || definedWordsList === undefined) return;
    if(definedWordsList.length > 0 || (definedWordsList.length === 0 && JSON.stringify(definedWordsList) !== JSON.stringify([]))) {
        saveDictionaryForDay(currentUser.uid, currentDateKey, definedWordsList).catch(error => {
        console.error("Error saving dictionary to Firestore:", error);
        toast({ title: t("errors.firestoreSaveTitle"), description: t("errors.firestoreSaveDictionaryDescription"), variant: "destructive" });
        });
    }
  }, [definedWordsList, currentDateKey, currentUser, isLoadingDailyData, isSettingsLoaded, toast, t]);


  useEffect(() => {
    if (!currentUser || isLoadingDailyData || !isSettingsLoaded || typeof currentSessionType !== 'string') return;
    saveSessionContextForDay(currentUser.uid, currentDateKey, currentSessionType).catch(error => {
      console.error("Error saving session context to Firestore:", error);
      toast({ title: t("errors.firestoreSaveTitle"), description: t("errors.firestoreSaveContextDescription"), variant: "destructive" });
    });
  }, [currentSessionType, currentDateKey, currentUser, isLoadingDailyData, isSettingsLoaded, toast, t]);

  useEffect(() => {
    if (!authLoading && !currentUser && isSettingsLoaded) {
      router.push('/auth/login');
    }
  }, [currentUser, authLoading, router, isSettingsLoaded]);

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
      title: t('interactiveTourDialog.collapsibleCardsTitle'),
      content: <p>{t('interactiveTourDialog.collapsibleCardsContent')}</p>,
    },
    {
      title: t('interactiveTourDialog.tasksTitle'),
      content: <p>{t('interactiveTourDialog.tasksContent')}</p>,
    },
    {
      title: t('interactiveTourDialog.taskRemindersTitle'),
      content: <p>{t('interactiveTourDialog.taskRemindersContent')}</p>,
    },
    {
      title: t('interactiveTourDialog.notesContextTitle'),
      content: <p>{t('interactiveTourDialog.notesContextContent')}</p>,
    },
    {
      title: t('interactiveTourDialog.aiNoteGeneratorTitle'), 
      content: <p>{t('interactiveTourDialog.aiNoteGeneratorContent')}</p>,
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
      title: t('interactiveTourDialog.dictionaryCardTitle'),
      content: <p>{t('interactiveTourDialog.dictionaryCardContent')}</p>,
    },
    {
      title: t('interactiveTourDialog.viewingPastNotesTitle'),
      content: <p>{t('interactiveTourDialog.viewingPastNotesContent')}</p>,
    },
     {
      title: t('interactiveTourDialog.viewPastDataTitle'),
      content: <p>{t('interactiveTourDialog.viewPastDataContent')}</p>,
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
      content: <p>{t('interactiveTourDialog.allSetContent', { appName: APP_NAME })}</p>,
    }
  ], [t]);

  useEffect(() => {
    if (isSettingsLoaded && currentUser) {
      const tourCompleted = localStorage.getItem(INTERACTIVE_TOUR_STORAGE_KEY);
      if (!tourCompleted && settings.showCoachMarks) {
        setIsInteractiveTourActive(true);
        setCurrentTourStep(0);
      }
    }
  }, [isSettingsLoaded, settings.showCoachMarks, currentUser, t]);

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


  useEffect(() => {
    if (!currentUser || isLoadingDailyData || !isSettingsLoaded || timer.sessionLog === undefined ) return;
    if (timer.sessionLog.length > 0 || (timer.sessionLog.length === 0 && JSON.stringify(timer.sessionLog) !== JSON.stringify([]))) {
        saveSessionLogForDay(currentUser.uid, currentDateKey, timer.sessionLog).catch(error => {
            console.error("Error saving session log to Firestore:", error);
            toast({ title: t("errors.firestoreSaveTitle"), description: t("errors.firestoreSaveLogDescription"), variant: "destructive" });
        });
    }
  }, [timer.sessionLog, currentDateKey, currentUser, isSettingsLoaded, isLoadingDailyData, toast, t]);


  const getActiveSoundscapeId = useCallback((currentTimerMode: TimerMode): string | undefined => {
    if (isMuted) return 'none';
    return currentTimerMode === 'work' ? settings.soundscapeWork : settings.soundscapeBreak;
  }, [isMuted, settings.soundscapeWork, settings.soundscapeBreak]);

  useEffect(() => {
    if (!isSettingsLoaded || !isSoundPlayerReady) {
      stopSound();
      return;
    }
    const soundId = getActiveSoundscapeId(timer.mode);
    if (timer.isRunning) {
        playSound(soundId);
    } else {
      stopSound();
    }
  }, [
    timer.mode,
    timer.isRunning,
    isSettingsLoaded,
    isSoundPlayerReady,
    isMuted,
    settings.soundscapeWork,
    settings.soundscapeBreak,
    getActiveSoundscapeId,
    playSound,
    stopSound,
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

  const handleToggleMute = () => setIsMuted(prevMuted => !prevMuted);

  const handleAddTask = (taskText: string, reminderTime?: string) => {
    setTasks(prev => [...prev, {
      id: Date.now().toString(),
      text: taskText,
      completed: false,
      reminderTime: reminderTime || undefined,
      reminderSent: false,
    }]);
  };
  const handleToggleTask = (taskId: string) => setTasks(prev => prev.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task));

  const handleRemoveTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleClearCompletedTasks = () => setTasks(prev => prev.filter(task => !task.completed));


  useEffect(() => {
    if (!isSettingsLoaded || tasks.length === 0 || !settings.notificationsEnabled || typeof window === 'undefined') return;

    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      tasks.forEach(task => {
        if (task.reminderTime && !task.completed && !task.reminderSent && task.reminderTime === currentTime) {
          if (Notification.permission === 'granted') {
            setTaskForAlert(task);
          } else if (Notification.permission === 'denied') {
             toast({ title: t('notifications.permissionDeniedTitle'), description: t('notifications.permissionDeniedDescription', { appName: APP_NAME }), variant: "destructive" });
          } else {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                setTaskForAlert(task);
              } else {
                toast({ title: t('notifications.permissionDeniedTitle'), description: t('notifications.permissionDeniedDescription', { appName: APP_NAME }), variant: "destructive" });
              }
            });
            toast({ title: t('notifications.permissionRequestTitle', { appName: APP_NAME }), description: t('notifications.permissionRequestDescription', { appName: APP_NAME }) });
          }
          setTasks(prevTasks =>
            prevTasks.map(t =>
              t.id === task.id ? { ...t, reminderSent: true } : t
            )
          );
        }
      });
    };

    checkReminders();
    const intervalId = setInterval(checkReminders, 30000);

    return () => clearInterval(intervalId);
  }, [tasks, isSettingsLoaded, settings.notificationsEnabled, t, toast]);


  const handleSendChatMessage = async () => {
    if (!chatInputValue.trim()) return;
    const newUserMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: chatInputValue.trim(), timestamp: new Date() };
    setChatMessages(prev => [...prev, newUserMessage]);
    const currentInput = chatInputValue.trim();
    setChatInputValue("");
    setIsAiChatLoading(true);
    try {
      const genkitHistory: GenkitChatInput['history'] = chatMessages.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'model', parts: [{text: msg.text}] }));
      const response = await chatWithAI({userInput: currentInput, history: genkitHistory});
      setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', text: response.aiResponse, timestamp: new Date() }]);
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      let errorMessage = t('ai.errorChatResponse');
       if (error.message) {
          if (error.message.includes('API key not valid') || error.message.includes('UNAUTHENTICATED')) {
              errorMessage = "There seems to be an issue with the AI service configuration. Please contact support.";
          } else if (error.message.includes('SERVICE_DISABLED') || error.message.includes('API has not been used') || error.message.includes('forbidden')) {
            errorMessage = t('errors.googleAIAPIServiceDisabled', { serviceName: "Generative Language API" });
          } else if (error.message.length < 150) {
              errorMessage = `Sorry, I encountered an issue: ${error.message}`;
          }
       }
      toast({ title: t('ai.errorTitle'), description: errorMessage, variant: "destructive" });
      setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', text: errorMessage, timestamp: new Date() }]);
    } finally {
      setIsAiChatLoading(false);
    }
  };

  const handleDefineWord = async (word: string) => {
    if (!word.trim() || !currentUser) return;
    setIsDefiningWord(true);
    try {
      const [engResult, indResult] = await Promise.all([
        defineWord({ word: word.trim(), targetLanguage: 'English' }),
        defineWord({ word: word.trim(), targetLanguage: 'Indonesian' }),
      ]);
      const newEntry: DefinedWordEntry = { id: Date.now().toString(), word: word.trim(), englishDefinition: engResult.definition, indonesianDefinition: indResult.definition };
      setDefinedWordsList(prev => [newEntry, ...prev.filter(w => w.word.toLowerCase() !== word.trim().toLowerCase())]);
    } catch (error: any) {
      console.error("Error defining word:", error);
      let errorMessage = t('dictionaryCard.errorDefiningDescription');
      if (error && error.message && typeof error.message === 'string') { // Check if error.message is a string
          if (error.message.includes('SERVICE_DISABLED') || error.message.includes('API has not been used') || error.message.includes('forbidden')) {
              errorMessage = t('errors.googleAIAPIServiceDisabled', { serviceName: "Generative Language API" });
          } else {
              errorMessage = error.message; // Use the specific error message if not a service disabled type
          }
      }
      toast({ title: t('dictionaryCard.errorDefiningTitle'), description: errorMessage, variant: "destructive" });
    } finally {
      setIsDefiningWord(false);
    }
  };

  const handleRemoveDefinedWord = async (wordId: string) => {
    if (!currentUser || isLoadingDailyData || !isSettingsLoaded) {
      toast({ title: t("errors.actionUnavailableLoading"), variant: "destructive" });
      return;
    }
    const wordEntryToRemove = definedWordsList.find(w => w.id === wordId);
    if (!confirm(t('dictionaryCard.confirmDeleteEntry', { word: wordEntryToRemove?.word || t('dictionaryCard.theEntry') }))) {
      return;
    }
    const updatedList = definedWordsList.filter(entry => entry.id !== wordId);
    setDefinedWordsList(updatedList);
    toast({ title: t("dictionaryCard.entryDeletedTitleLocal"), description: t("dictionaryCard.entryDeletedDescLocal", { word: wordEntryToRemove?.word || t('dictionaryCard.theEntry') }) });
    try {
      await saveDictionaryForDay(currentUser.uid, currentDateKey, updatedList);
    } catch (error: any) {
      console.error("Error saving dictionary after deletion:", error);
      toast({ title: t("errors.firestoreSaveTitle"), description: t("errors.firestoreSaveDictionaryDescription"), variant: "destructive" });
    }
  };

  const handleExportMarkdown = () => {
    if (definedWordsList.length === 0) {
      toast({ title: t('dictionaryCard.nothingToExport'), variant: 'default' });
      return;
    }
    const markdownContent = definedWordsList.slice().reverse().map(entry => `## ${entry.word}\n\n**English:**\n${entry.englishDefinition}\n\n**Indonesian:**\n${entry.indonesianDefinition}\n\n---\n`).join('\n');
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rs_timer_dictionary_session_${currentDateKey}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: t('dictionaryCard.exportSuccessfulTitle'), description: t('dictionaryCard.exportSuccessfulDescription') });
  };

  const handleFetchPastNotes = async (date: Date | undefined) => {
    setSelectedPastDateForNotes(date);
    if (!date || !currentUser) {
      setPastDateNotes(null);
      return;
    }
    setIsLoadingPastNotes(true);
    setPastDateNotes(null);
    try {
      const dateKey = formatDateToKey(date);
      const notes = await loadNotesForDay(currentUser.uid, dateKey);
      setPastDateNotes(notes || t('notes.noNotesForDate'));
    } catch (error: any) {
      console.error("Error fetching past notes:", error);
      toast({ title: t("errors.firestoreLoadTitle"), description: error.message || t("errors.firestoreLoadPastNotesDescription"), variant: "destructive" });
      setPastDateNotes(t('notes.errorLoadingNotes'));
    } finally {
      setIsLoadingPastNotes(false);
      setIsPastNotesPopoverOpen(false);
    }
  };

  const handleDeletePastNotes = async () => {
    if (!selectedPastDateForNotes || !currentUser) {
      toast({ title: t('notes.errorNoDateSelectedForDelete'), variant: 'destructive' });
      return;
    }
    if (!confirm(t('notes.confirmDeletePastNotes', { date: format(selectedPastDateForNotes, "PPP") }))) {
        return;
    }
    setIsDeletingPastNotes(true);
    const dateKeyToDelete = formatDateToKey(selectedPastDateForNotes);
    try {
      await deleteNotesForDay(currentUser.uid, dateKeyToDelete);
      setPastDateNotes(t('notes.noNotesForDate')); // Reflect deletion in UI
      toast({ title: t('notes.pastNotesDeleteSuccessTitle') });
    } catch (error: any) {
      console.error("Error deleting past notes:", error);
      toast({ title: t('errors.firestoreDeleteTitle'), description: error.message || t('errors.firestoreDeletePastNotesDescription'), variant: "destructive" });
    } finally {
      setIsDeletingPastNotes(false);
    }
  };

  const handleSaveAiSummaryToNotes = (summary: string, improvements: string) => {
    const formattedSummary = `\n\n--- ${t('aiSummaryDialog.savedSummaryHeader', { dateTime: new Date().toLocaleString() })} ---\n${t('aiSummaryDialog.summaryTitle')}:\n${summary}\n\n${t('aiSummaryDialog.improvementsTitle')}:\n${improvements}\n--- ${t('aiSummaryDialog.savedSummaryFooter')} ---`;
    setCurrentNotes(prevNotes => prevNotes + formattedSummary);
    toast({ title: t('aiSummaryDialog.saveSuccessTitle'), description: t('aiSummaryDialog.saveSuccessDescription') });
    setIsAiSummaryOpen(false);
  };

  const handleGenerateNoteContent = async () => {
    if (!aiGenerateNotePrompt.trim()) {
      toast({ title: t('aiNoteGeneratorDialog.errorPromptEmptyTitle'), description: t('aiNoteGeneratorDialog.errorPromptEmptyDesc'), variant: "destructive" });
      return;
    }
    setIsGeneratingNoteText(true);
    setAiGeneratedNoteText("");
    try {
      const result = await generateText({ userPrompt: aiGenerateNotePrompt });
      setAiGeneratedNoteText(result.generatedText);
    } catch (error: any) {
      console.error("AI Note Generation Error:", error);
      let errorMessage = t('ai.errorDescription');
       if (error.message) {
         if (error.message.includes('SERVICE_DISABLED') || error.message.includes('API has not been used') || error.message.includes('forbidden')) {
            errorMessage = t('errors.googleAIAPIServiceDisabled', { serviceName: "Generative Language API" });
         } else if (error.message.length < 200) {
            errorMessage = error.message;
         }
       }
      toast({ title: t('ai.errorTitle'), description: errorMessage, variant: "destructive" });
      setAiGeneratedNoteText(t('aiNoteGeneratorDialog.errorGenerating'));
    } finally {
      setIsGeneratingNoteText(false);
    }
  };

  const handleAppendGeneratedTextToNotes = () => {
    if (!aiGeneratedNoteText) {
      toast({ title: t('aiNoteGeneratorDialog.nothingToAppend'), variant: "default" });
      return;
    }
    const textToAppend = `\n\n--- ${t('aiNoteGeneratorDialog.appendedTextHeader', { dateTime: new Date().toLocaleString() })} ---\n${aiGeneratedNoteText}\n--- ${t('aiNoteGeneratorDialog.appendedTextFooter')} ---`;
    setCurrentNotes(prevNotes => prevNotes + textToAppend);
    toast({ title: t('aiNoteGeneratorDialog.appendSuccessTitleToNotes'), description: t('aiNoteGeneratorDialog.appendSuccessDescToNotes') });
    setIsAiGenerateNoteDialogOpen(false);
    setAiGenerateNotePrompt("");
    setAiGeneratedNoteText("");
  };

  const handleCopyGeneratedNoteText = () => {
    if (!aiGeneratedNoteText) {
      toast({ title: t('aiNoteGeneratorDialog.nothingToCopy'), variant: "default" });
      return;
    }
    navigator.clipboard.writeText(aiGeneratedNoteText)
      .then(() => {
        toast({ title: t('aiNoteGeneratorDialog.copySuccessTitle') });
      })
      .catch(err => {
        console.error("Failed to copy text:", err);
        toast({ title: t('aiNoteGeneratorDialog.copyErrorTitle'), variant: "destructive" });
      });
  };

  const handleLogout = async () => {
    stopSound();
    await logoutUser();
    router.push('/auth/login');
  };

  if (authLoading || !isSettingsLoaded || (!currentUser && !authLoading) || (currentUser && isLoadingDailyData)) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
      </div>
    );
  }
  if (!currentUser) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
          </div>
      );
  }


  const pomodoroDots = Array(settings.longBreakInterval).fill(0).map((_, i) => (
    <span
      key={i}
      className={`inline-block h-3 w-3 rounded-full mx-1 ${ i < timer.currentCyclePomodoros ? 'bg-primary' : 'bg-muted' }`}
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
        {settings.backgroundAnimation === 'fireflies' && <FirefliesEffect />}

        <header className="w-full max-w-2xl flex items-center py-4 relative z-[1]">
           <div className="flex-shrink-0 w-20">
             {isMobile ? (
              <h1 className="text-xl font-semibold animate-title-reveal">RS</h1>
            ) : (
              <div className="flex items-center space-x-2">
                <LogoIcon className="h-8 w-8 text-primary" />
              </div>
            )}
          </div>

          <div className="flex-1 flex justify-center items-center px-1 overflow-hidden">
            <div className={cn(
                "flex items-center space-x-1 py-1",
                isMobile && "overflow-x-auto"
            )}>
                <LanguageSwitcher />
                <Button variant="ghost" size="icon" onClick={() => triggerAiSummary(timer.sessionLog, currentSessionType)} title={t('tooltips.aiSummary')}>
                    <SparklesIcon className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => router.push('/notebook')} title={t('tooltips.notebookPage')}>
                  <Notebook className="h-5 w-5" />
                </Button>
                <SessionHistoryDrawer currentDateKey={currentDateKey} userId={currentUser.uid} />
                <Button variant="ghost" size="icon" onClick={() => setIsUserGuideOpen(true)} title={t('tooltips.userGuide')}>
                    <BookOpen className="h-5 w-5" />
                </Button>
                <SettingsDialog />
                <ThemeToggleButton />
                <Button variant="ghost" size="icon" onClick={() => router.push('/past-data')} title={t('tooltips.viewPastData')}>
                    <CalendarIconLucide className="h-5 w-5" />
                </Button>
            </div>
          </div>

          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
            {currentUser && (
              <Button variant="ghost" size="icon" onClick={handleLogout} title={t('auth.logoutButtonLabel')}>
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center w-full max-w-md relative z-[1] space-y-6 pb-20">
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

          <Accordion
            type="multiple"
            className="w-full space-y-4"
            value={openAccordionItems}
            onValueChange={setOpenAccordionItems}
          >
            <AccordionItem value="tasks" className="border rounded-lg shadow-lg bg-card overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center">
                  <ListChecks className="mr-2 h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">{t('cards.tasksTitle')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0">
                <SimpleTaskList
                  tasks={tasks}
                  onAddTask={handleAddTask}
                  onToggleTask={handleToggleTask}
                  onRemoveTask={handleRemoveTask}
                  onClearCompletedTasks={handleClearCompletedTasks}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="dictionary" className="border rounded-lg shadow-lg bg-card overflow-hidden">
               <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <DictionaryCard.Title />
               </AccordionTrigger>
               <AccordionContent className="px-0">
                  <DictionaryCard.Content
                    definedWordsList={definedWordsList}
                    onDefineWord={handleDefineWord}
                    onRemoveWord={handleRemoveDefinedWord}
                    isDefining={isDefiningWord}
                  />
                  {definedWordsList.length > 0 && (
                    <DictionaryCard.Footer onExportMarkdown={handleExportMarkdown} />
                  )}
               </AccordionContent>
            </AccordionItem>

            <AccordionItem value="notes" className="border rounded-lg shadow-lg bg-card overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">{t('cards.notesTitle')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0">
                 <CardContent className="space-y-4 pt-6">
                    <div>
                        <Label htmlFor="session-type-select" className="text-sm font-medium">{t('cards.sessionContextLabel')}</Label>
                        <Select
                            value={currentSessionType || 'general'}
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
                    <Textarea
                      placeholder={t('notes.textareaPlaceholder')}
                      value={currentNotes}
                      onChange={(e) => setCurrentNotes(e.target.value)}
                      className="min-h-[150px] focus:ring-accent" 
                      aria-label={t('notes.currentDayNotesAreaLabel')}
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            onClick={() => triggerAiSummary(
                              timer.sessionLog.length > 0 ? timer.sessionLog : (currentNotes || tasks.length > 0 ? [{id: 'data-only', startTime:0, endTime:0, mode:'work', durationMinutes:0, completed:false}] : []),
                              currentSessionType
                            )}
                            disabled={isLoadingDailyData || (timer.sessionLog.length === 0 && !currentNotes && tasks.length === 0)}
                            title={t('tooltips.analyzeCurrentData')}
                          >
                            <SparklesIcon className="mr-2 h-4 w-4" /> {t('buttons.analyzeData')}
                        </Button>
                         <Button
                            variant="outline"
                            onClick={() => setIsAiGenerateNoteDialogOpen(true)}
                            title={t('tooltips.aiNoteGenerator')}
                        >
                            <Wand2 className="mr-2 h-4 w-4" /> {t('buttons.generateWithAI')}
                        </Button>
                    </div>

                    <Accordion type="multiple" value={openPastNotesAccordion} onValueChange={setOpenPastNotesAccordion} className="w-full pt-4 mt-4 border-t">
                      <AccordionItem value="view-past-notes" className="border-none">
                        <AccordionTrigger className="hover:no-underline p-0">
                           <h4 className="text-md font-medium">{t('notes.viewPastNotesTitle')}</h4>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pb-0">
                          <div className="space-y-3">
                            <Popover open={isPastNotesPopoverOpen} onOpenChange={setIsPastNotesPopoverOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full sm:w-[240px] justify-start text-left font-normal",
                                    !selectedPastDateForNotes && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIconLucide className="mr-2 h-4 w-4" />
                                  {selectedPastDateForNotes ? format(selectedPastDateForNotes, "PPP") : <span>{t('notes.pickDate')}</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={selectedPastDateForNotes}
                                  onSelect={handleFetchPastNotes}
                                  disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>

                            {isLoadingPastNotes && (
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>{t('notes.loadingPastNotes')}</span>
                              </div>
                            )}
                            {pastDateNotes !== null && !isLoadingPastNotes && (
                              <div className="mt-2 p-3 border rounded-md bg-muted/30 min-h-[100px] max-h-[200px] overflow-y-auto">
                                <p className="text-sm whitespace-pre-wrap">{pastDateNotes}</p>
                              </div>
                            )}
                            {selectedPastDateForNotes && pastDateNotes && pastDateNotes !== t('notes.noNotesForDate') && pastDateNotes !== t('notes.errorLoadingNotes') && !isLoadingPastNotes && (
                               <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDeletePastNotes}
                                className="mt-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50"
                                disabled={isDeletingPastNotes}
                              >
                                {isDeletingPastNotes ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                {isDeletingPastNotes ? t('notes.deletingPastNotes') : t('notes.deletePastNotesButton', {date: format(selectedPastDateForNotes, "PPP")})}
                              </Button>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </main>

        {taskForAlert && (
          <AlertDialog
            open={!!taskForAlert}
            onOpenChange={(open) => {
              if (!open) {
                setTaskForAlert(null);
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader className="flex-row items-center space-x-2">
                <Clock className="h-6 w-6 text-primary" />
                <AlertDialogTitle>{t('alertDialog.taskReminderTitle')}</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogDescription>
                {t('alertDialog.taskReminderDescription.prompt', {
                  reminderTime: taskForAlert.reminderTime || '',
                })} <strong className="block mt-2 text-base text-foreground">{taskForAlert.text}</strong>
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogAction onClick={() => setTaskForAlert(null)}>
                  {t('buttons.ok')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <AiSummaryDialog
          summaryData={aiSummary}
          isOpen={isAiSummaryOpen}
          onOpenChange={setIsAiSummaryOpen}
          isLoading={isAiLoading}
          onSaveSummary={handleSaveAiSummaryToNotes}
        />
        
        {/* AI Content Generator Dialog for Notes */}
        <Dialog open={isAiGenerateNoteDialogOpen} onOpenChange={setIsAiGenerateNoteDialogOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <Wand2 className="mr-2 h-5 w-5 text-primary" />
                        {t('aiNoteGeneratorDialog.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('aiNoteGeneratorDialog.description')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="ai-note-prompt-textarea" className="text-sm font-medium">
                            {t('aiNoteGeneratorDialog.promptLabel')}
                        </Label>
                        <Textarea
                            id="ai-note-prompt-textarea"
                            placeholder={t('aiNoteGeneratorDialog.promptPlaceholder')}
                            value={aiGenerateNotePrompt}
                            onChange={(e) => setAiGenerateNotePrompt(e.target.value)}
                            className="min-h-[100px] mt-1 focus:ring-accent"
                            disabled={isGeneratingNoteText}
                        />
                    </div>
                    <Button onClick={handleGenerateNoteContent} disabled={isGeneratingNoteText || !aiGenerateNotePrompt.trim()} className="w-full">
                        {isGeneratingNoteText ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <SparklesIcon className="mr-2 h-4 w-4" />
                        )}
                        {isGeneratingNoteText ? t('aiNoteGeneratorDialog.generatingButton') : t('aiNoteGeneratorDialog.generateButton')}
                    </Button>

                    {(aiGeneratedNoteText || isGeneratingNoteText) && (
                        <div className="space-y-2 pt-2">
                            <h3 className="text-md font-semibold">{t('aiNoteGeneratorDialog.generatedContentTitle')}</h3>
                            {isGeneratingNoteText ? (
                                <div className="flex justify-center items-center h-[150px] border rounded-md p-3 bg-muted/30">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    <p className="ml-3">{t('aiNoteGeneratorDialog.generatingMessage')}</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[200px] border rounded-md p-3 bg-muted/30">
                                    <p className="text-sm whitespace-pre-wrap">{aiGeneratedNoteText}</p>
                                </ScrollArea>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter className="sm:justify-between gap-2">
                    <Button variant="outline" onClick={handleCopyGeneratedNoteText} disabled={!aiGeneratedNoteText || isGeneratingNoteText}>
                        <ClipboardCopy className="mr-2 h-4 w-4" /> {t('buttons.copy')}
                    </Button>
                    <div className="flex gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="ghost">
                                {t('buttons.close')}
                            </Button>
                        </DialogClose>
                        <Button onClick={handleAppendGeneratedTextToNotes} disabled={!aiGeneratedNoteText || isGeneratingNoteText}>
                            <Save className="mr-2 h-4 w-4" />
                            {t('buttons.appendToNotes')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <UserGuideDialog isOpen={isUserGuideOpen} onOpenChange={setIsUserGuideOpen} />
        <InteractiveTourDialog isOpen={isInteractiveTourActive} currentStep={currentTourStep} totalSteps={tourSteps.length} stepData={tourSteps[currentTourStep]} onNext={handleNextTourStep} onSkip={handleFinishTour} />
        <ChatWidgetButton onClick={() => setIsChatOpen(prev => !prev)} />
        <ChatPopup isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} messages={chatMessages} inputValue={chatInputValue} onInputChange={setChatInputValue} onSendMessage={handleSendChatMessage} isLoadingAiResponse={isAiChatLoading} />

        <footer className="w-full max-w-2xl text-center py-6 text-sm text-muted-foreground relative z-[1]">
          <p>{t('footerCopyright', { year: new Date().getFullYear().toString(), appName: APP_NAME })}</p>
        </footer>
      </div>
    </>
  );
}
