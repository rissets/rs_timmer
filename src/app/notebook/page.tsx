
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useSettingsContext } from '@/contexts/settings-context';
import { useLanguageContext } from '@/contexts/language-context';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { saveGeneralNotes, loadGeneralNotes } from '@/lib/firebase/firestore-service';
import { generateText } from '@/ai/flows/generate-text-flow';
import { APP_NAME } from '@/lib/constants';
import { ArrowLeft, Save, Sparkles, Wand2, ClipboardCopy, Loader2, Eye, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

type EditorMode = 'edit' | 'preview';

// Basic Markdown to HTML parser
const parseMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return "";

  let html = markdown;

  // Escape HTML to prevent XSS from user-pasted HTML, then selectively unescape for generated tags.
  // For simplicity in this context (user's own notes), we'll skip full sanitization for now.
  // A proper library would handle this much more robustly.
  html = html.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;');

  // Headers (###, ##, #)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold (**text** or __text__)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic (*text* or _text_)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Links [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Unordered lists (- item, * item) - basic, one level
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  // Wrap <li>s in <ul> if they are consecutive
  html = html.replace(/(<li>.*<\/li>\s*)+/g, '<ul>$&</ul>');
  
  // Ordered lists (1. item) - basic, one level
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  // Wrap <li>s in <ol> if they are consecutive and part of an ordered list pattern
  // This regex is tricky, for now we'll use the same ul wrapper and rely on CSS for numbering if needed,
  // or accept that it only supports one type of list at a time effectively with this simple parser.
  // A more sophisticated parser would handle mixed lists or nested lists.

  // Paragraphs (split by double newlines, then wrap lines not already in a block element)
  // This is a simplified paragraph handling. A full parser is more complex.
  html = html.split(/\n\s*\n/).map(paragraph => {
    if (paragraph.trim() === "") return "";
    if (paragraph.startsWith('<h3>') || paragraph.startsWith('<h2>') || paragraph.startsWith('<h1>') || paragraph.startsWith('<ul>') || paragraph.startsWith('<li>')) {
      return paragraph;
    }
    return `<p>${paragraph.replace(/\n/g, '<br/>')}</p>`; // Replace single newlines with <br> within paragraphs
  }).join('');


  return html;
};


export default function NotebookPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { isSettingsLoaded } = useSettingsContext();
  const { t } = useLanguageContext();
  const router = useRouter();
  const { toast } = useToast();

  const [notesContent, setNotesContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');

  // AI Content Generator Dialog State
  const [isAiGenerateDialogOpen, setIsAiGenerateDialogOpen] = useState(false);
  const [aiGeneratePrompt, setAiGeneratePrompt] = useState("");
  const [aiGeneratedText, setAiGeneratedText] = useState("");
  const [isGeneratingText, setIsGeneratingText] = useState(false);

  useEffect(() => {
    if (!authLoading && !currentUser && isSettingsLoaded) {
      router.push('/auth/login');
    }
  }, [currentUser, authLoading, router, isSettingsLoaded]);

  useEffect(() => {
    if (currentUser && !authLoading && isSettingsLoaded) {
      setIsLoading(true);
      loadGeneralNotes(currentUser.uid)
        .then(content => {
          setNotesContent(content || "");
        })
        .catch(error => {
          console.error("Error loading general notes:", error);
          toast({ title: t("errors.firestoreLoadTitle"), description: error.message || t("errors.firestoreLoadDescription"), variant: "destructive" });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [currentUser, authLoading, isSettingsLoaded, toast, t]);

  const handleSaveNotes = async () => {
    if (!currentUser) {
      toast({ title: t("errors.firestoreSaveTitle"), description: t("errors.actionUnavailableLoading"), variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await saveGeneralNotes(currentUser.uid, notesContent);
      toast({ title: t('notebookPage.saveSuccessTitle'), description: t('notebookPage.saveSuccessDescription') });
    } catch (error: any) {
      console.error("Error saving general notes:", error);
      toast({ title: t("errors.firestoreSaveTitle"), description: error.message || t("errors.firestoreSaveNotesDescription"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAiContent = async () => {
    if (!aiGeneratePrompt.trim()) {
      toast({ title: t('aiNoteGeneratorDialog.errorPromptEmptyTitle'), description: t('aiNoteGeneratorDialog.errorPromptEmptyDesc'), variant: "destructive" });
      return;
    }
    setIsGeneratingText(true);
    setAiGeneratedText("");
    try {
      const result = await generateText({ userPrompt: aiGeneratePrompt });
      setAiGeneratedText(result.generatedText);
    } catch (error: any) {
      console.error("AI Note Generation Error:", error);
      let errorMessage = t('ai.errorDescription');
       if (error.message) {
         if (error.message.includes('SERVICE_DISABLED') || error.message.includes('API has not been used') || error.message.includes('forbidden')) {
            errorMessage = t('errors.googleAIAPIServiceDisabled', { serviceName: "Generative Language API" });
         } else if (error.message.length < 200) {
            errorMessage = error.message;
         }
       }
      toast({ title: t('ai.errorTitle'), description: errorMessage, variant: "destructive" });
      setAiGeneratedText(t('aiNoteGeneratorDialog.errorGenerating'));
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleInsertAiTextToNotes = () => {
    if (!aiGeneratedText) {
      toast({ title: t('aiNoteGeneratorDialog.nothingToAppend'), variant: "default" });
      return;
    }
    // Insert at cursor or append. For simplicity, append for now.
    // A real WYSIWYG editor would handle cursor insertion.
    // Ensure we're in edit mode to see the change immediately in the textarea
    setEditorMode('edit');
    const currentText = notesContent;
    const separator = currentText.length > 0 && !currentText.endsWith('\n\n') ? "\n\n" : "";
    const textToInsert = `${separator}--- ${t('aiNoteGeneratorDialog.appendedTextHeader', { dateTime: new Date().toLocaleString() })} ---\n${aiGeneratedText}\n--- ${t('aiNoteGeneratorDialog.appendedTextFooter')} ---\n`;
    
    setNotesContent(prevNotes => prevNotes + textToInsert);
    toast({ title: t('aiNoteGeneratorDialog.appendSuccessTitleToNotes'), description: t('aiNoteGeneratorDialog.appendSuccessDescToNotes') });
    setIsAiGenerateDialogOpen(false);
    setAiGeneratePrompt("");
    setAiGeneratedText("");
  };

  const handleCopyAiGeneratedText = () => {
    if (!aiGeneratedText) {
      toast({ title: t('aiNoteGeneratorDialog.nothingToCopy'), variant: "default" });
      return;
    }
    navigator.clipboard.writeText(aiGeneratedText)
      .then(() => {
        toast({ title: t('aiNoteGeneratorDialog.copySuccessTitle') });
      })
      .catch(err => {
        console.error("Failed to copy text:", err);
        toast({ title: t('aiNoteGeneratorDialog.copyErrorTitle'), variant: "destructive" });
      });
  };


  if (authLoading || !isSettingsLoaded || (!currentUser && !authLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center max-w-5xl">
          <Button variant="outline" size="icon" onClick={() => router.push('/')} className="mr-4">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">{t('buttons.back')}</span>
          </Button>
          <h1 className="text-xl font-semibold text-foreground">{t('notebookPage.title')}</h1>
          <div className="ml-auto flex items-center space-x-2">
            <Button onClick={() => setIsAiGenerateDialogOpen(true)} variant="outline" size="sm">
              <Wand2 className="mr-2 h-4 w-4" />
              {t('notebookPage.aiGenerateButton')}
            </Button>
            <Button onClick={handleSaveNotes} disabled={isSaving || isLoading} size="sm">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? t('notebookPage.savingButton') : t('notebookPage.saveButton')}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container py-6 max-w-5xl flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center flex-grow">
             <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
        ) : (
          <Card className="flex-grow flex flex-col shadow-lg">
            <CardHeader className="py-3 px-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Button
                    variant={editorMode === 'edit' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setEditorMode('edit')}
                    className={cn("px-3", editorMode === 'edit' && "font-semibold")}
                    aria-pressed={editorMode === 'edit'}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {t('notebookPage.editModeButton')}
                  </Button>
                  <Button
                    variant={editorMode === 'preview' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setEditorMode('preview')}
                    className={cn("px-3", editorMode === 'preview' && "font-semibold")}
                    aria-pressed={editorMode === 'preview'}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {t('notebookPage.previewModeButton')}
                  </Button>
                </div>
                {/* Placeholder for more editor tools if needed */}
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-grow flex">
              {editorMode === 'edit' ? (
                <Textarea
                  placeholder={t('notebookPage.notesPlaceholderMarkdown')}
                  value={notesContent}
                  onChange={(e) => setNotesContent(e.target.value)}
                  className="w-full h-full resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 p-6 text-base"
                  aria-label={t('notebookPage.notesAreaLabel')}
                />
              ) : (
                <ScrollArea className="w-full h-full p-6">
                  <div
                    className="prose prose-sm sm:prose-base dark:prose-invert max-w-none notebook-preview"
                    dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(notesContent) }}
                  />
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t">
        <p>{t('footerCopyright', { year: new Date().getFullYear().toString(), appName: APP_NAME })}</p>
      </footer>

      {/* AI Content Generator Dialog */}
      <Dialog open={isAiGenerateDialogOpen} onOpenChange={setIsAiGenerateDialogOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <Sparkles className="mr-2 h-5 w-5 text-primary" />
                        {t('aiNoteGeneratorDialog.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('aiNoteGeneratorDialog.description')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="ai-notebook-prompt-textarea" className="text-sm font-medium">
                            {t('aiNoteGeneratorDialog.promptLabel')}
                        </Label>
                        <Textarea
                            id="ai-notebook-prompt-textarea"
                            placeholder={t('aiNoteGeneratorDialog.promptPlaceholder')}
                            value={aiGeneratePrompt}
                            onChange={(e) => setAiGeneratePrompt(e.target.value)}
                            className="min-h-[100px] mt-1 focus:ring-accent"
                            disabled={isGeneratingText}
                        />
                    </div>
                    <Button onClick={handleGenerateAiContent} disabled={isGeneratingText || !aiGeneratePrompt.trim()} className="w-full">
                        {isGeneratingText ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        {isGeneratingText ? t('aiNoteGeneratorDialog.generatingButton') : t('aiNoteGeneratorDialog.generateButton')}
                    </Button>

                    {(aiGeneratedText || isGeneratingText) && (
                        <div className="space-y-2 pt-2">
                            <h3 className="text-md font-semibold">{t('aiNoteGeneratorDialog.generatedContentTitle')}</h3>
                            {isGeneratingText ? (
                                <div className="flex justify-center items-center h-[150px] border rounded-md p-3 bg-muted/30">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    <p className="ml-3">{t('aiNoteGeneratorDialog.generatingMessage')}</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[200px] border rounded-md p-3 bg-muted/30">
                                    <p className="text-sm whitespace-pre-wrap">{aiGeneratedText}</p>
                                </ScrollArea>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter className="sm:justify-between gap-2 flex-wrap">
                    <Button variant="outline" onClick={handleCopyAiGeneratedText} disabled={!aiGeneratedText || isGeneratingText}>
                        <ClipboardCopy className="mr-2 h-4 w-4" /> {t('buttons.copy')}
                    </Button>
                    <div className="flex gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="ghost">
                                {t('buttons.close')}
                            </Button>
                        </DialogClose>
                        <Button onClick={handleInsertAiTextToNotes} disabled={!aiGeneratedText || isGeneratingText}>
                            <Save className="mr-2 h-4 w-4" /> 
                            {t('buttons.appendToNotes')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

    