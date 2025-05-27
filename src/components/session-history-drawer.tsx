
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
import { useLanguageContext } from "@/contexts/language-context"; // Added

const SESSION_HISTORY_KEY = "rs-timer-session-history";

export function SessionHistoryDrawer() {
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguageContext(); // Added

  useEffect(() => {
    if (isOpen) {
      try {
        const storedHistory = localStorage.getItem(SESSION_HISTORY_KEY);
        if (storedHistory) {
          setHistory(JSON.parse(storedHistory));
        }
      } catch (error) {
        console.error("Failed to load session history from localStorage:", error);
        setHistory([]);
      }
    }
  }, [isOpen]);

  const clearHistory = () => {
    try {
      localStorage.removeItem(SESSION_HISTORY_KEY);
      setHistory([]);
    } catch (error) {
      console.error("Failed to clear session history from localStorage:", error);
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
            <SheetTitle>{t('sessionHistoryDrawer.title')}</SheetTitle>
            <SheetDescription>{t('sessionHistoryDrawer.description')}</SheetDescription>
          </SheetHeader>
          <div className="p-4 pb-0">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground">{t('sessionHistoryDrawer.noSessions')}</p>
            ) : (
              <ScrollArea className="h-[40vh]">
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
              <Button variant="destructive" onClick={clearHistory} className="mb-2">
                <Trash2 className="mr-2 h-4 w-4" /> {t('buttons.clearHistory')}
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

export const addSessionToHistory = (session: SessionRecord) => {
  try {
    const storedHistory = localStorage.getItem(SESSION_HISTORY_KEY);
    const historyArray: SessionRecord[] = storedHistory ? JSON.parse(storedHistory) : [];
    localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify([...historyArray, session]));
  } catch (error) {
    console.error("Failed to save session to localStorage:", error);
  }
};
