
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import type { DefinedWordEntry } from '@/lib/types';
import { useLanguageContext } from "@/contexts/language-context";
import { BookMarked, Brain, Download, Loader2, Languages } from 'lucide-react';

interface DictionaryCardProps {
  definedWordsList: DefinedWordEntry[];
  onDefineWord: (word: string) => Promise<void>;
  isDefining: boolean;
}

// Sub-components for better structure with Accordion
const DictionaryCardTitle = () => {
  const { t } = useLanguageContext();
  return (
    // This component is the content for AccordionTrigger.
    // It should only contain the main title elements.
    <div className="flex items-center">
      <BookMarked className="mr-2 h-5 w-5 text-primary" />
      <span className="text-lg font-semibold leading-none tracking-tight">
        {t('dictionaryCard.title')}
      </span>
    </div>
  );
};

const DictionaryCardContentComp = ({ definedWordsList, onDefineWord, isDefining }: DictionaryCardProps) => {
  const { t } = useLanguageContext();
  const [wordInput, setWordInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordInput.trim()) return;
    await onDefineWord(wordInput.trim());
    setWordInput("");
  };

  return (
    // AccordionContent in page.tsx has className="px-0".
    // CardContent by default adds p-6 pt-0.
    // We'll explicitly set padding here for clarity within the accordion structure.
    <CardContent className="px-6 pt-4 pb-6 space-y-4">
      {/* Description moved here, now part of collapsible content */}
      <p className="text-sm text-muted-foreground -mt-2 mb-2">
        {t('dictionaryCard.description')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="word-input-dict" className="text-sm font-medium">
            {t('dictionaryCard.wordInputLabel')}
          </Label>
          <div className="flex flex-col sm:flex-row gap-2 mt-1">
            <Input
              id="word-input-dict" // Changed ID to avoid conflict if another "word-input" exists
              type="text"
              placeholder={t('dictionaryCard.wordInputPlaceholder')}
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value)}
              className="focus:ring-accent flex-grow"
              disabled={isDefining}
            />
            <Button type="submit" disabled={isDefining || !wordInput.trim()} className="w-full sm:w-auto">
              {isDefining ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Brain className="mr-2 h-4 w-4" />
              )}
              {t('dictionaryCard.defineButton')}
            </Button>
          </div>
        </div>
      </form>

      {definedWordsList.length > 0 && (
        <div className="space-y-4 pt-4">
          <h4 className="text-md font-semibold flex items-center">
            <Languages className="mr-2 h-5 w-5 text-primary/80" />
            {t('dictionaryCard.sessionDefinitionsTitle')}
          </h4>
          <ScrollArea className="h-[250px] border rounded-md p-3 bg-muted/30">
            <div className="space-y-4">
              {definedWordsList.slice().reverse().map((entry) => (
                <div key={entry.id} className="p-3 border rounded-md bg-card shadow-sm">
                  <h5 className="font-semibold text-primary">{entry.word}</h5>
                  <div className="mt-2">
                    <p className="text-xs font-medium text-muted-foreground">English:</p>
                    <p className="text-sm whitespace-pre-wrap">{entry.englishDefinition}</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-medium text-muted-foreground">Indonesia:</p>
                    <p className="text-sm whitespace-pre-wrap">{entry.indonesianDefinition}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </CardContent>
  );
};

const DictionaryCardFooterComp = ({ onExportMarkdown }: { onExportMarkdown: () => void; }) => {
  const { t } = useLanguageContext();
  return (
    // CardFooter also needs explicit horizontal padding if AccordionContent is px-0
    <CardFooter className="px-6 pb-6 pt-0">
      <Button variant="outline" onClick={onExportMarkdown} className="w-full">
        <Download className="mr-2 h-4 w-4" />
        {t('dictionaryCard.exportMarkdownButton')}
      </Button>
    </CardFooter>
  );
};

export const DictionaryCard = {
    Title: DictionaryCardTitle,
    Content: DictionaryCardContentComp,
    Footer: DictionaryCardFooterComp,
};
