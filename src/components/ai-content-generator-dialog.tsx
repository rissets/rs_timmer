
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Bot, Sparkles, ClipboardCopy, CornerDownLeft, Loader2 } from 'lucide-react';
import { useLanguageContext } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";
import { generateText } from '@/ai/flows/generate-text-flow';

interface AiContentGeneratorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAppendToNotes: (textToAppend: string) => void;
}

export function AiContentGeneratorDialog({ isOpen, onOpenChange, onAppendToNotes }: AiContentGeneratorDialogProps) {
  const { t } = useLanguageContext();
  const { toast } = useToast();
  const [userPrompt, setUserPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateContent = async () => {
    if (!userPrompt.trim()) {
      toast({ title: t('aiContentGenerator.errorPromptEmptyTitle'), description: t('aiContentGenerator.errorPromptEmptyDesc'), variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setGeneratedContent("");
    try {
      const result = await generateText({ userPrompt });
      setGeneratedContent(result.generatedText);
    } catch (error: any) {
      console.error("AI Content Generation Error:", error);
      toast({ title: t('ai.errorTitle'), description: error.message || t('ai.errorDescription'), variant: "destructive" });
      setGeneratedContent(t('aiContentGenerator.errorGenerating'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!generatedContent) {
      toast({ title: t('aiContentGenerator.nothingToCopy'), variant: "default" });
      return;
    }
    navigator.clipboard.writeText(generatedContent)
      .then(() => {
        toast({ title: t('aiContentGenerator.copySuccessTitle') });
      })
      .catch(err => {
        console.error("Failed to copy text:", err);
        toast({ title: t('aiContentGenerator.copyErrorTitle'), variant: "destructive" });
      });
  };

  const handleAppendToNotes = () => {
    if (!generatedContent) {
      toast({ title: t('aiContentGenerator.nothingToAppend'), variant: "default" });
      return;
    }
    onAppendToNotes(generatedContent);
    toast({ title: t('aiContentGenerator.appendSuccessTitle') });
    onOpenChange(false); // Close dialog after appending
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Bot className="mr-2 h-6 w-6 text-primary" />
            {t('aiContentGenerator.title')}
          </DialogTitle>
          <DialogDescription>
            {t('aiContentGenerator.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-grow overflow-y-auto pr-2">
          <div>
            <Label htmlFor="ai-prompt-textarea" className="text-sm font-medium">
              {t('aiContentGenerator.promptLabel')}
            </Label>
            <Textarea
              id="ai-prompt-textarea"
              placeholder={t('aiContentGenerator.promptPlaceholder')}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              className="min-h-[100px] mt-1 focus:ring-accent"
              disabled={isGenerating}
            />
          </div>
          <Button onClick={handleGenerateContent} disabled={isGenerating || !userPrompt.trim()} className="w-full">
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? t('aiContentGenerator.generatingButton') : t('aiContentGenerator.generateButton')}
          </Button>

          {generatedContent && !isGenerating && (
            <div className="space-y-2 pt-4">
              <h3 className="text-md font-semibold">{t('aiContentGenerator.generatedContentTitle')}</h3>
              <ScrollArea className="h-[200px] border rounded-md p-3 bg-muted/30">
                <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
              </ScrollArea>
              <div className="flex space-x-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                  <ClipboardCopy className="mr-2 h-4 w-4" /> {t('buttons.copy')}
                </Button>
                <Button variant="outline" size="sm" onClick={handleAppendToNotes}>
                  <CornerDownLeft className="mr-2 h-4 w-4" /> {t('buttons.appendToNotes')}
                </Button>
              </div>
            </div>
          )}
           {isGenerating && (
             <div className="flex justify-center items-center h-[200px] border rounded-md p-3 bg-muted/30">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3">{t('aiContentGenerator.generatingMessage')}</p>
             </div>
           )}
        </div>
        
        <DialogFooter className="mt-auto pt-4 border-t shrink-0">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t('buttons.close')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
