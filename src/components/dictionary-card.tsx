
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; // Removed Card
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
    <div className="flex flex-col space-y-1.5"> {/* Mimicking CardHeader structure */}
      <h3 className="text-lg font-semibold leading-none tracking-tight flex items-center"> {/* Mimicking CardTitle */}
        <BookMarked className="mr-2 h-5 w-5 text-primary" />
        {t('dictionaryCard.title')}
      </h3>
      <p className="text-sm text-muted-foreground">{t('dictionaryCard.description')}</p> {/* Mimicking CardDescription */}
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
    <CardContent className="space-y-4 pt-6"> {/* Added pt-6 */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="word-input" className="text-sm font-medium">
            {t('dictionaryCard.wordInputLabel')}
          </Label>
          <div className="flex flex-col sm:flex-row gap-2 mt-1">
            <Input
              id="word-input"
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
          <h4 className="text-md font-semibold flex items-center"> {/* Changed h3 to h4 for semantic hierarchy */}
            <Languages className="mr-2 h-5 w-5 text-primary/80" />
            {t('dictionaryCard.sessionDefinitionsTitle')}
          </h4>
          <ScrollArea className="h-[250px] border rounded-md p-3 bg-muted/30">
            <div className="space-y-4">
              {definedWordsList.slice().reverse().map((entry) => (
                <div key={entry.id} className="p-3 border rounded-md bg-card shadow-sm">
                  <h5 className="font-semibold text-primary">{entry.word}</h5> {/* Changed h4 to h5 */}
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
    <CardFooter>
      <Button variant="outline" onClick={onExportMarkdown} className="w-full">
        <Download className="mr-2 h-4 w-4" />
        {t('dictionaryCard.exportMarkdownButton')}
      </Button>
    </CardFooter>
  );
};

// Main export remains the same, but now sub-components are available
export const DictionaryCard = {
    Title: DictionaryCardTitle,
    Content: DictionaryCardContentComp,
    Footer: DictionaryCardFooterComp,
};

    