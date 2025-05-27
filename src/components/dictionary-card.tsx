
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import type { DefinedWordEntry } from '@/lib/types';
import { useLanguageContext } from "@/contexts/language-context";
import { BookMarked, Brain, Download, Loader2, Languages } from 'lucide-react';

interface DictionaryCardProps {
  definedWordsList: DefinedWordEntry[];
  onDefineWord: (word: string) => Promise<void>;
  onExportMarkdown: () => void;
  isDefining: boolean;
}

export function DictionaryCard({
  definedWordsList,
  onDefineWord,
  onExportMarkdown,
  isDefining,
}: DictionaryCardProps) {
  const { t } = useLanguageContext();
  const [wordInput, setWordInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordInput.trim()) return;
    await onDefineWord(wordInput.trim());
    setWordInput("");
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <BookMarked className="mr-2 h-5 w-5 text-primary" />
          {t('dictionaryCard.title')}
        </CardTitle>
        <CardDescription>{t('dictionaryCard.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <h3 className="text-md font-semibold flex items-center">
              <Languages className="mr-2 h-5 w-5 text-primary/80" />
              {t('dictionaryCard.sessionDefinitionsTitle')}
            </h3>
            <ScrollArea className="h-[250px] border rounded-md p-3 bg-muted/30">
              <div className="space-y-4">
                {definedWordsList.slice().reverse().map((entry) => (
                  <div key={entry.id} className="p-3 border rounded-md bg-card shadow-sm">
                    <h4 className="font-semibold text-primary">{entry.word}</h4>
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
      {definedWordsList.length > 0 && (
        <CardFooter>
          <Button variant="outline" onClick={onExportMarkdown} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            {t('dictionaryCard.exportMarkdownButton')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
