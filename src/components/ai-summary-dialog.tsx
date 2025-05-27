
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
import { useLanguageContext } from "@/contexts/language-context"; // Added

interface AiSummaryDialogProps {
  summaryData: AiSessionSummary | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
}

export function AiSummaryDialog({ summaryData, isOpen, onOpenChange, isLoading }: AiSummaryDialogProps) {
  const { t } = useLanguageContext(); // Added
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-accent" />
            {t('aiSummaryDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('aiSummaryDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="ml-3">{t('aiSummaryDialog.loading')}</p>
            </div>
          ) : summaryData ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">{t('aiSummaryDialog.summaryTitle')}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{summaryData.summary}</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{t('aiSummaryDialog.improvementsTitle')}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{summaryData.improvements}</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">{t('aiSummaryDialog.noData')}</p>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('buttons.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
