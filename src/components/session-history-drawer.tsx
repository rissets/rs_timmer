
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SessionRecord } from "@/lib/types";
import { History, Trash2, Loader2 } from "lucide-react"; // Added Loader2
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useLanguageContext } from "@/contexts/language-context";
import { loadSessionLogForDay, deleteSessionLogForDay } from '@/lib/firebase/firestore-service';
import { useToast } from '@/hooks/use-toast';


interface SessionHistoryDrawerProps {
  currentDateKey: string;
  userId: string | undefined;
}

export function SessionHistoryDrawer({ currentDateKey, userId }: SessionHistoryDrawerProps) {
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false); // New state for clear operation
  const { t } = useLanguageContext();
  const { toast } = useToast();

  const fetchHistory = useCallback(async () => {
    if (!userId) {
      setHistory([]);
      return;
    }
    setIsLoadingHistory(true);
    try {
      const loadedHistory = await loadSessionLogForDay(userId, currentDateKey);
      setHistory(loadedHistory);
    } catch (error) {
      console.error("Failed to load session history from Firestore:", error);
      toast({ title: t("errors.firestoreLoadTitle"), description: t("errors.firestoreLoadDescription"), variant: "destructive" });
      setHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [userId, currentDateKey, toast, t]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchHistory();
    }
  }, [isOpen, userId, fetchHistory]);

  const clearTodaysHistory = async () => {
    console.log("Attempting to trigger clearTodaysHistory"); // <-- Added log here
    console.log("clearTodaysHistory triggered in SessionHistoryDrawer");
    if (!userId) {
      console.warn("clearTodaysHistory: No userId, aborting.");
      toast({ title: t("errors.firestoreDeleteTitle"), description: "User not identified.", variant: "destructive" });
      return;
    }
    console.log(`clearTodaysHistory: Attempting to clear for userId: ${userId}, dateKey: ${currentDateKey}`);

    setIsClearingHistory(true); // Indicate clearing operation is in progress
    const previousHistory = [...history]; // Store previous history for potential revert

    // Optimistic UI update (optional, can remove if causing issues, rely on fetchHistory in finally)
    // setHistory([]); // Immediately clear UI for responsiveness - Re-evaluating this. Let fetchHistory handle UI.

    try {
      console.log("clearTodaysHistory: Calling deleteSessionLogForDay...");
      await deleteSessionLogForDay(userId, currentDateKey);
      console.log("clearTodaysHistory: deleteSessionLogForDay successful.");
      toast({ title: t('sessionHistoryDrawer.historyClearedTitle'), description: t('sessionHistoryDrawer.historyClearedDescription') });
      // fetchHistory will be called in the finally block
    } catch (error: any) {
      console.error("clearTodaysHistory: Error during deletion:", error);
      toast({ title: t('errors.firestoreDeleteTitle'), description: error.message || t('sessionHistoryDrawer.clearErrorDescription'), variant: "destructive" });
      // No need to revert here, fetchHistory in finally will get the correct state
    } finally {
      console.log("clearTodaysHistory: Calling fetchHistory in finally block to refresh...");
      await fetchHistory(); // Re-fetch to ensure UI consistency with DB
      setIsClearingHistory(false); // Clear operation finished
    }
  };

  const getModeDisplayName = (mode: SessionRecord['mode']) => {
    switch(mode) {
      case 'work': return t('timerModes.work');
      case 'shortBreak': return t('timerModes.shortBreak');
      case 'longBreak': return t('timerModes.longBreak');
      default: return t('timerModes.focus');
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "flex items-center justify-center")}
        aria-label={t('tooltips.sessionHistory') || "Open session history"}
        title={t('tooltips.sessionHistory') || "Open session history"}
      >
        <History className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent>
        <div className="mx-auto w-full max-w-md">
          <SheetHeader>
            <SheetTitle>{t('sessionHistoryDrawer.titleToday', { date: currentDateKey })}</SheetTitle>
            <SheetDescription>{t('sessionHistoryDrawer.description')}</SheetDescription>
          </SheetHeader>
          <div className="p-4 pb-0">
            {isLoadingHistory && !isClearingHistory ? ( // Show general loading only if not clearing
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : history.length === 0 && !isClearingHistory ? ( // Show no sessions only if not clearing
              <p className="text-center text-muted-foreground">{t('sessionHistoryDrawer.noSessionsToday')}</p>
            ) : (
              <ScrollArea className="h-[calc(100vh-250px)] sm:h-[calc(70vh-150px)]">
                <div className="space-y-2">
                  {history.slice().reverse().map((session) => (
                    <React.Fragment key={session.id}>
                      <div className="p-2 rounded-md border">
                        <p className="font-semibold">{getModeDisplayName(session.mode)} - {session.durationMinutes} min</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(session.startTime), 'MMM d, yyyy, h:mm a')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Status: {session.completed ? t('sessionHistoryDrawer.statusCompleted') : t('sessionHistoryDrawer.statusSkipped')}
                        </p>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <SheetFooter className="pt-4">
            <Button
              variant="destructive"
              onClick={clearTodaysHistory}
              className="mb-2"
              disabled={isClearingHistory || (history.length === 0 && !isLoadingHistory)}
            >
              {isClearingHistory ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {isClearingHistory ? t('sessionHistoryDrawer.clearingHistory') : t('buttons.clearTodaysHistory')}
            </Button>
            <SheetClose className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
              {t('buttons.close')}
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
