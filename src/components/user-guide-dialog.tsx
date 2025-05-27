
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { APP_NAME } from '@/lib/constants';
import { BookOpen } from 'lucide-react';

interface UserGuideDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserGuideDialog({ isOpen, onOpenChange }: UserGuideDialogProps) {
  const guideSections = [
    {
      title: "Getting Started with Pomodoro",
      content: (
        <>
          <p className="mb-2">The Pomodoro Technique is a time management method that uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks.</p>
          <p className="mb-2">{APP_NAME} helps you implement this technique. Each work interval is a "Pomodoro." After a set number of Pomodoros (usually 4), you take a longer break.</p>
          <p>Benefits include improved focus, reduced burnout, and better time estimation.</p>
        </>
      ),
    },
    {
      title: "Timer Controls",
      content: (
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Start/Pause:</strong> Click the main button to start or pause the current timer (Work, Short Break, or Long Break).</li>
          <li><strong>Skip:</strong> Click the skip button (icon with arrow pointing right) to end the current interval and move to the next one.</li>
          <li><strong>Reset:</strong> Click the reset button (circular arrow icon) to reset the current interval to its full duration and pause the timer.</li>
          <li><strong>Mute/Unmute:</strong> Toggle soundscapes on or off using the volume icon.</li>
        </ul>
      ),
    },
    {
      title: "Customization (Settings)",
      content: (
        <>
          <p className="mb-2">Click the gear icon in the header to open Settings. You can customize:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Timer Durations:</strong> Set custom lengths for Work, Short Break, and Long Break intervals.</li>
            <li><strong>Long Break Interval:</strong> Define how many work sessions occur before a long break.</li>
            <li><strong>Auto-start:</strong> Enable/disable automatic starting of breaks and Pomodoros.</li>
            <li><strong>Notifications:</strong> Toggle browser notifications for interval ends.</li>
            <li><strong>Soundscapes:</strong> Choose different ambient sounds for work and break periods, and adjust the master volume.</li>
            <li><strong>Background Animation:</strong> Select a visual background effect or none.</li>
            <li><strong>Mouse Trail Effect:</strong> Enable or disable a particle effect that follows your mouse.</li>
            <li><strong>Coach Marks:</strong> Toggle helpful tooltips that explain UI elements.</li>
          </ul>
        </>
      ),
    },
    {
      title: "Tasks & Notes",
      content: (
        <>
          <p className="mb-2">Below the timer, you'll find sections for managing tasks and taking notes:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Today's Tasks:</strong> Add tasks you want to accomplish during your focus sessions. Mark them as complete or delete them.</li>
            <li><strong>Session Notes & Context:</strong> Use the textarea to jot down thoughts, distractions, or ideas that arise.</li>
            <li>Your tasks and notes can be included in the AI Session Analysis.</li>
          </ul>
        </>
      ),
    },
    {
      title: "Session Context",
      content: (
        <p className="mb-2">
          Before analyzing your session data (notes, tasks, or a full Pomodoro log), you can specify a "Session Context" (e.g., Work, Learning, General).
          This helps the AI provide more tailored feedback and suggestions relevant to your current activity.
        </p>
      ),
    },
    {
      title: "AI Session Analysis",
      content: (
        <>
          <p className="mb-2">
            {APP_NAME} features an AI-powered session analyzer. Click the sparkles icon in the header or the "Analyze Data" button in the notes section.
          </p>
          <p className="mb-2">
            The AI will review your completed intervals (if any), tasks, and notes for the current session, along with the selected Session Context.
            It provides a summary and actionable suggestions for improvement. This is especially useful after a Long Break or when you've accumulated some notes/tasks.
          </p>
        </>
      ),
    },
    {
      title: "Session History",
      content: (
        <p className="mb-2">
          Click the history icon (clock with arrow) in the header to view a log of your completed Pomodoro intervals.
          This helps you track your focus sessions over time. You can also clear the history from this panel.
        </p>
      ),
    },
    {
        title: "Theme & Appearance",
        content: (
            <ul className="list-disc pl-5 space-y-2">
                <li><strong>Dark/Light Mode:</strong> Toggle between dark and light themes using the sun/moon icon in the header.</li>
                <li><strong>Background Effects:</strong> Choose various animated backgrounds or a simple gradient in the Settings menu to personalize your focus environment.</li>
            </ul>
        )
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BookOpen className="mr-2 h-6 w-6 text-primary" />
            {APP_NAME} User Guide
          </DialogTitle>
          <DialogDescription>
            Learn how to make the most of your focus sessions.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1 pr-3">
          <Accordion type="single" collapsible className="w-full">
            {guideSections.map((section, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger>{section.title}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                  {section.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Got it!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
