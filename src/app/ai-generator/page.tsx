
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Sparkles, ClipboardCopy, Loader2, ArrowLeft } from 'lucide-react';
import { useLanguageContext } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";
import { generateText } from '@/ai/flows/generate-text-flow';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@/lib/constants';

export default function AiGeneratorPage() {
  const { t } = useLanguageContext();
  const { toast } = useToast();
  const router = useRouter();
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
      let errorMessage = t('ai.errorDescription');
       if (error.message) {
         if (error.message.includes('SERVICE_DISABLED') || error.message.includes('API has not been used') || error.message.includes('forbidden')) {
            errorMessage = t('errors.googleAIAPIServiceDisabled', { serviceName: "Generative Language API" });
         } else if (error.message.length < 200) { // Keep error message relatively short
            errorMessage = error.message;
         }
       }
      toast({ title: t('ai.errorTitle'), description: errorMessage, variant: "destructive" });
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

  return (
    <div className="flex flex-col items-center p-4 min-h-screen bg-background text-foreground">
      <header className="w-full max-w-2xl flex justify-between items-center py-4 mb-4">
        <Button variant="outline" onClick={() => router.push('/')} className="mr-auto">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('buttons.back')}
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold text-center flex-grow flex items-center justify-center">
            <Bot className="mr-2 h-6 w-6 text-primary" />
            {t('aiContentGenerator.pageTitle')}
        </h1>
        <div className="w-[calc(theme(space.8)_+_theme(spacing.2))]"> {/* Placeholder for balance */}</div>
      </header>

      <main className="flex-grow w-full max-w-xl space-y-6">
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center">
              {t('aiContentGenerator.title')}
            </CardTitle>
            <CardDescription>
              {t('aiContentGenerator.pageDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="ai-prompt-textarea" className="text-sm font-medium">
                {t('aiContentGenerator.promptLabel')}
              </Label>
              <Textarea
                id="ai-prompt-textarea"
                placeholder={t('aiContentGenerator.promptPlaceholder')}
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="min-h-[120px] mt-1 focus:ring-accent"
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

            {(generatedContent || isGenerating) && (
              <div className="space-y-2 pt-4">
                <h3 className="text-md font-semibold">{t('aiContentGenerator.generatedContentTitle')}</h3>
                {isGenerating ? (
                    <div className="flex justify-center items-center h-[200px] border rounded-md p-3 bg-muted/30">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-3">{t('aiContentGenerator.generatingMessage')}</p>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="h-[250px] border rounded-md p-3 bg-muted/30">
                            <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
                        </ScrollArea>
                        <div className="flex space-x-2 pt-2">
                            <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                            <ClipboardCopy className="mr-2 h-4 w-4" /> {t('buttons.copy')}
                            </Button>
                        </div>
                    </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <footer className="w-full max-w-2xl text-center py-6 text-sm text-muted-foreground">
        <p>{t('footerCopyright', { year: new Date().getFullYear().toString(), appName: APP_NAME })}</p>
      </footer>
    </div>
  );
}
