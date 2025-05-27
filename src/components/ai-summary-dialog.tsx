
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
import type { AiSessionSummary } from '@/lib/types';
import { Sparkles } from 'lucide-react';

interface AiSummaryDialogProps {
  summaryData: AiSessionSummary | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
}

export function AiSummaryDialog({ summaryData, isOpen, onOpenChange, isLoading }: AiSummaryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-accent" />
            AI Session Analysis
          </DialogTitle>
          <DialogDescription>
            Here's a summary of your session and suggestions for improvement.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="ml-3">Analyzing your session...</p>
            </div>
          ) : summaryData ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">Session Summary</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{summaryData.summary}</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Suggested Improvements</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{summaryData.improvements}</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No summary data available.</p>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
