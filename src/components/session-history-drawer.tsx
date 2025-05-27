
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
} from "@/components/ui/sheet"; // Changed from drawer
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { SessionRecord } from "@/lib/types";
import { History, Trash2 } from "lucide-react";
import { format, formatDistanceToNowStrict } from 'date-fns';

const SESSION_HISTORY_KEY = "zenith-timer-session-history";

export function SessionHistoryDrawer() {
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);

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
      case 'work': return 'Work';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
      default: return 'Session';
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}> {/* Changed from Drawer */}
      <SheetTrigger asChild> {/* Changed from DrawerTrigger */}
        <Button variant="ghost" size="icon" aria-label="Open session history">
          <History className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent> {/* Changed from DrawerContent */}
        <div className="mx-auto w-full max-w-md">
          <SheetHeader> {/* Changed from DrawerHeader */}
            <SheetTitle>Session History</SheetTitle> {/* Changed from DrawerTitle */}
            <SheetDescription>Review your completed Pomodoro sessions.</SheetDescription> {/* Changed from DrawerDescription */}
          </SheetHeader>
          <div className="p-4 pb-0">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground">No sessions recorded yet.</p>
            ) : (
              <ScrollArea className="h-[40vh]">
                <div className="space-y-2">
                  {history.slice().reverse().map((session) => ( // Show newest first
                    <React.Fragment key={session.id}>
                      <div className="p-2 rounded-md border">
                        <p className="font-semibold">{getModeDisplayName(session.mode)} - {session.durationMinutes} min</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(session.startTime), 'MMM d, yyyy, h:mm a')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Status: {session.completed ? 'Completed' : 'Skipped/Interrupted'}
                        </p>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <SheetFooter className="pt-4"> {/* Changed from DrawerFooter */}
            {history.length > 0 && (
              <Button variant="destructive" onClick={clearHistory} className="mb-2">
                <Trash2 className="mr-2 h-4 w-4" /> Clear History
              </Button>
            )}
            <SheetClose asChild> {/* Changed from DrawerClose */}
              <Button variant="outline">Close</Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent> {/* Changed from DrawerContent */}
    </Sheet> /* Changed from Drawer */
  );
}

// Helper to add to history, can be called from page.tsx
export const addSessionToHistory = (session: SessionRecord) => {
  try {
    const storedHistory = localStorage.getItem(SESSION_HISTORY_KEY);
    const history: SessionRecord[] = storedHistory ? JSON.parse(storedHistory) : [];
    // Limit history size if needed, e.g., history.slice(-100)
    localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify([...history, session]));
  } catch (error) {
    console.error("Failed to save session to localStorage:", error);
  }
};
