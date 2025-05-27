
"use client";

import React, { useEffect, useState } from 'react';
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
import { History, Trash2 } from "lucide-react";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useLanguageContext } from "@/contexts/language-context";

// The old SESSION_HISTORY_KEY is no longer the primary source for the drawer.
// The drawer will now load based on the currentDateKey passed as a prop.

interface SessionHistoryDrawerProps {
  currentDateKey: string; // To load today's history
  // We might add functionality later to view other dates
}

export function SessionHistoryDrawer({ currentDateKey }: SessionHistoryDrawerProps) {
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguageContext();

  useEffect(() => {
    if (isOpen && currentDateKey) {
      try {
        const storedHistory = localStorage.getItem(`rs-timer-sessionHistory-${currentDateKey}`);
        if (storedHistory) {
          setHistory(JSON.parse(storedHistory));
        } else {
          setHistory([]); // No history for today yet
        }
      } catch (error) {
        console.error("Failed to load session history from localStorage:", error);
        setHistory([]);
      }
    }
  }, [isOpen, currentDateKey]);

  const clearTodaysHistory = () => {
    if (!confirm(t('sessionHistoryDrawer.confirmClearToday'))) return;
    try {
      localStorage.removeItem(`rs-timer-sessionHistory-${currentDateKey}`);
      setHistory([]);
    } catch (error) {
      console.error("Failed to clear today's session history from localStorage:", error);
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
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground">{t('sessionHistoryDrawer.noSessionsToday')}</p>
            ) : (
              <ScrollArea className="h-[calc(100vh-250px)] sm:h-[calc(70vh-150px)]"> {/* Adjusted height */}
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
            {history.length > 0 && (
              <Button variant="destructive" onClick={clearTodaysHistory} className="mb-2">
                <Trash2 className="mr-2 h-4 w-4" /> {t('buttons.clearTodaysHistory')}
              </Button>
            )}
            <SheetClose className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
              {t('buttons.close')}
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// This function is now less critical for displaying today's history in the drawer,
// as PomodoroPage.tsx handles saving the daily log.
// It might still be useful if other parts of the app need to add to a global, non-daily log.
// For now, it's left as is, but its usage for the daily drawer is superseded.
export const addSessionToHistory = (session: SessionRecord) => {
  const LEGACY_SESSION_HISTORY_KEY = "rs-timer-session-history"; // Old key
  try {
    const storedHistory = localStorage.getItem(LEGACY_SESSION_HISTORY_KEY);
    const historyArray: SessionRecord[] = storedHistory ? JSON.parse(storedHistory) : [];
    localStorage.setItem(LEGACY_SESSION_HISTORY_KEY, JSON.stringify([...historyArray, session]));
  } catch (error) {
    console.error("Failed to save session to legacy localStorage:", error);
  }
};
