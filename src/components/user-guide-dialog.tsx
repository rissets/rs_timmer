
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
import { useLanguageContext } from "@/contexts/language-context"; 

interface UserGuideDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserGuideDialog({ isOpen, onOpenChange }: UserGuideDialogProps) {
  const { t } = useLanguageContext(); 

  const guideSections = [
    {
      titleKey: "userGuideDialog.sections.introduction.title",
      contentKey: "userGuideDialog.sections.introduction.content",
    },
    {
      titleKey: "userGuideDialog.sections.pwa.title",
      contentKey: "userGuideDialog.sections.pwa.content",
    },
    {
      titleKey: "userGuideDialog.sections.authentication.title",
      contentKey: "userGuideDialog.sections.authentication.content",
    },
    {
      titleKey: "userGuideDialog.sections.timerControls.title",
      contentKey: "userGuideDialog.sections.timerControls.content",
    },
    {
      titleKey: "userGuideDialog.sections.collapsibleCards.title",
      contentKey: "userGuideDialog.sections.collapsibleCards.content",
    },
    {
      titleKey: "userGuideDialog.sections.dailyDataStorage.title",
      contentKey: "userGuideDialog.sections.dailyDataStorage.content",
    },
    {
      titleKey: "userGuideDialog.sections.tasks.title",
      contentKey: "userGuideDialog.sections.tasks.content",
    },
    {
      titleKey: "userGuideDialog.sections.sessionNotesContext.title",
      contentKey: "userGuideDialog.sections.sessionNotesContext.content",
    },
    {
      titleKey: "userGuideDialog.sections.viewingPastNotes.title",
      contentKey: "userGuideDialog.sections.viewingPastNotes.content",
    },
    {
      titleKey: "userGuideDialog.sections.dictionaryCard.title",
      contentKey: "userGuideDialog.sections.dictionaryCard.content",
    },
     {
      titleKey: "userGuideDialog.sections.aiAnalysis.title",
      contentKey: "userGuideDialog.sections.aiAnalysis.content",
    },
    {
      titleKey: "userGuideDialog.sections.chatWidget.title", 
      contentKey: "userGuideDialog.sections.chatWidget.content",
    },
    {
      titleKey: "userGuideDialog.sections.sessionHistory.title",
      contentKey: "userGuideDialog.sections.sessionHistory.content",
    },
    {
      titleKey: "userGuideDialog.sections.viewPastDataPage.title",
      contentKey: "userGuideDialog.sections.viewPastDataPage.content",
    },
    {
      titleKey: "userGuideDialog.sections.settings.title",
      contentKey: "userGuideDialog.sections.settings.content",
    },
    {
        titleKey: "userGuideDialog.sections.customSoundscapes.title",
        contentKey: "userGuideDialog.sections.customSoundscapes.content",
    },
    {
        titleKey: "userGuideDialog.sections.themeAndAppearance.title",
        contentKey: "userGuideDialog.sections.themeAndAppearance.content",
    }
  ];

  // Helper function to parse simple markdown-like list items
  const renderContent = (contentKey: string) => {
    const rawContent = t(contentKey, { appName: APP_NAME });
    const lines = rawContent.split('\\n'); // Assuming \\n for newlines in JSON
    
    let inList = false;
    const renderedLines = lines.map((line, index) => {
      if (line.startsWith('* ')) {
        if (!inList) {
          inList = true;
          // This is a bit of a hack for lists. Proper markdown parsing would be better.
          return <ul key={`ul-${index}`} className="list-disc pl-5 space-y-1 mb-2">{<li key={index}>{line.substring(2)}</li>}</ul>;
        }
        return <li key={index}>{line.substring(2)}</li>;
      } else {
        if (inList) {
          inList = false; 
        }
        return <p key={index} className="mb-2 last:mb-0">{line}</p>;
      }
    });
    // This is a simplified renderer. If a list is the last element, 
    // the closing </ul> might not be handled perfectly by this structure.
    // For complex markdown, a dedicated library would be better.
    return <>{renderedLines}</>;
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BookOpen className="mr-2 h-6 w-6 text-primary" />
            {t('userGuideDialog.title', { appName: APP_NAME })}
          </DialogTitle>
          <DialogDescription>
            {t('userGuideDialog.description', { appName: APP_NAME })}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1 pr-3">
          <Accordion type="single" collapsible className="w-full">
            {guideSections.map((section, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger>{t(section.titleKey)}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                  {renderContent(section.contentKey)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            {t('buttons.gotIt')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
