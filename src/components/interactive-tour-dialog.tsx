
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
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Check, X } from 'lucide-react';
import { useLanguageContext } from "@/contexts/language-context"; // Added

interface InteractiveTourDialogProps {
  isOpen: boolean;
  currentStep: number;
  totalSteps: number;
  stepData: { title: string; content: React.ReactNode } | null;
  onNext: () => void;
  onSkip: () => void;
}

export function InteractiveTourDialog({
  isOpen,
  currentStep,
  totalSteps,
  stepData,
  onNext,
  onSkip,
}: InteractiveTourDialogProps) {
  const { t } = useLanguageContext(); // Added
  if (!isOpen || !stepData) {
    return null;
  }

  const progressPercentage = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onSkip(); }}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ArrowRight className="mr-2 h-5 w-5 text-primary" />
            {stepData.title} 
          </DialogTitle>
          <DialogDescription>
            {t('interactiveTourDialog.stepProgress', { currentStep: (currentStep + 1).toString(), totalSteps: totalSteps.toString() })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 text-sm text-muted-foreground space-y-2">
          {stepData.content}
        </div>

        <Progress value={progressPercentage} className="w-full h-2 mt-2 mb-4" />
        
        <DialogFooter className="flex justify-between w-full">
          <Button type="button" variant="ghost" onClick={onSkip} className="mr-auto">
            <X className="mr-2 h-4 w-4" /> {t('buttons.skipTour')}
          </Button>
          <Button type="button" onClick={onNext}>
            {currentStep === totalSteps - 1 ? (
              <>
                {t('buttons.finish')} <Check className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                {t('buttons.next')} <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
