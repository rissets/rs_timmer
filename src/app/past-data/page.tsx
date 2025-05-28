
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useSettingsContext } from '@/contexts/settings-context';
import { useLanguageContext } from '@/contexts/language-context';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, formatDateToKey } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, ListChecks, FileText, BookOpen, Loader2 } from 'lucide-react';
import type { Task, DefinedWordEntry, SessionType } from '@/lib/types';
import {
  loadTasksForDay,
  loadNotesForDay,
  loadDictionaryForDay,
  loadSessionContextForDay,
} from '@/lib/firebase/firestore-service';
import { useToast } from '@/hooks/use-toast';
import { SESSION_TYPE_OPTIONS } from '@/lib/constants';

export default function PastDataPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { isSettingsLoaded } = useSettingsContext();
  const { t } = useLanguageContext();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedPastDateForData, setSelectedPastDateForData] = useState<Date | undefined>(undefined);
  const [isLoadingPastData, setIsLoadingPastData] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  // States for past data
  const [pastTasks, setPastTasks] = useState<Task[]>([]);
  const [pastNotesForData, setPastNotesForData] = useState<string | null>(null);
  const [pastDefinedWordsList, setPastDefinedWordsList] = useState<DefinedWordEntry[]>([]);
  const [pastSessionContext, setPastSessionContext] = useState<SessionType | null>(null);
  
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>(['tasks', 'notes', 'dictionary']);

  useEffect(() => {
    if (!selectedPastDateForData || !currentUser) {
      // Clear data if no date is selected or user is not available
      setPastTasks([]);
      setPastNotesForData(null);
      setPastDefinedWordsList([]);
      setPastSessionContext(null);
      return;
    }

    const loadPastData = async () => {
      setIsLoadingPastData(true);
      // Clear previous data before fetching new data
      setPastTasks([]);
      setPastNotesForData(null);
      setPastDefinedWordsList([]);
      setPastSessionContext(null);

      try {
        const dateKey = formatDateToKey(selectedPastDateForData);
        const [loadedTasks, loadedNotes, loadedDict, loadedContext] = await Promise.all([
          loadTasksForDay(currentUser.uid, dateKey),
          loadNotesForDay(currentUser.uid, dateKey),
          loadDictionaryForDay(currentUser.uid, dateKey),
          loadSessionContextForDay(currentUser.uid, dateKey),
        ]);
        setPastTasks(loadedTasks);
        setPastNotesForData(loadedNotes); // Keep null if no notes, handle display later
        setPastDefinedWordsList(loadedDict);
        setPastSessionContext(loadedContext);
      } catch (error: any) {
        console.error("Error fetching past data:", error);
        toast({ title: t("errors.firestoreLoadTitle"), description: error.message || t("errors.firestoreLoadPastDataDescription"), variant: "destructive" });
        // Ensure states are reset on error
        setPastTasks([]);
        setPastNotesForData(t('notes.errorLoadingNotes')); 
        setPastDefinedWordsList([]);
        setPastSessionContext(null);
      } finally {
        setIsLoadingPastData(false);
        setIsDatePopoverOpen(false); // Close popover after selection and load
      }
    };

    loadPastData();

  }, [selectedPastDateForData, currentUser, t, toast]);

  if (authLoading || !isSettingsLoaded || (!currentUser && !authLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    if (typeof window !== 'undefined') {
      router.push('/auth/login');
    }
    return null;
  }

  return (
    <div className="flex flex-col items-center p-4 min-h-screen bg-background text-foreground">
      <header className="w-full max-w-2xl flex justify-between items-center py-4 mb-4">
        <Button variant="outline" onClick={() => router.back()} className="mr-auto">
          &larr; {t('buttons.back')}
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold text-center flex-grow">{t('pastDataPage.title')}</h1>
        <div className="w-[calc(theme(space.8)_+_theme(spacing.2))]"> {/* Placeholder for balance if needed */}</div>
      </header>

      <main className="flex-grow w-full max-w-md space-y-6">
        <Card className="w-full shadow-xl sticky top-4 z-10 bg-card/95 backdrop-blur-sm">
          <CardContent className="px-6 py-4 space-y-2">
            <div>
              <Label htmlFor="past-date-select" className="text-sm font-medium">{t('pastDataPage.selectDateLabel')}</Label>
              <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="past-date-select"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !selectedPastDateForData && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedPastDateForData ? format(selectedPastDateForData, "PPP") : <span>{t('notes.pickDate')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedPastDateForData}
                    onSelect={setSelectedPastDateForData}
                    disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {selectedPastDateForData && isLoadingPastData && (
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-lg">{t('pastDataPage.loadingData')}</span>
            </div>
        )}

        {selectedPastDateForData && !isLoadingPastData && (
            <Accordion
                type="multiple"
                className="w-full space-y-4"
                value={openAccordionItems}
                onValueChange={setOpenAccordionItems}
            >
                <AccordionItem value="tasks" className="border rounded-lg shadow-lg bg-card overflow-hidden">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-center">
                            <ListChecks className="mr-2 h-5 w-5 text-primary" />
                            <span className="text-lg font-semibold">{t('cards.tasksTitle')}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 py-4">
                        {pastTasks.length > 0 ? (
                            <ul className="space-y-2">
                                {pastTasks.map((task) => (
                                    <li key={task.id} className="flex items-start space-x-2 text-sm p-2 border rounded-md bg-muted/30">
                                        <span>{task.completed ? '✅' : '⬜'}</span>
                                        <span className={cn("flex-grow", task.completed ? 'line-through text-muted-foreground' : '')}>{task.text}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">{t('pastDataPage.noTasksForDay')}</p>
                        )}
                    </AccordionContent>
                </AccordionItem>

                 <AccordionItem value="notes" className="border rounded-lg shadow-lg bg-card overflow-hidden">
                     <AccordionTrigger className="px-6 py-4 hover:no-underline">
                         <div className="flex items-center">
                             <FileText className="mr-2 h-5 w-5 text-primary" />
                             <span className="text-lg font-semibold">{t('pastDataPage.notesContextTitle')}</span>
                         </div>
                     </AccordionTrigger>
                     <AccordionContent className="px-6 py-4 space-y-4">
                         <div>
                             <Label className="text-sm font-medium">{t('cards.sessionContextLabel')}</Label>
                              <p className="text-sm text-muted-foreground mt-1 p-2 border rounded-md bg-muted/30 min-h-[2.5rem] flex items-center">
                                  {pastSessionContext ? t(SESSION_TYPE_OPTIONS.find(opt => opt.id === pastSessionContext)?.nameKey || 'sessionTypes.general') : t('pastDataPage.noContextForDay')}
                              </p>
                         </div>
                         <div>
                             <Label className="text-sm font-medium">{t('cards.notesTitle')}</Label>
                             <ScrollArea className="mt-1 p-3 border rounded-md bg-muted/30 min-h-[100px] max-h-[300px]">
                                 {pastNotesForData && pastNotesForData.trim() !== "" ? (
                                     <p className="text-sm whitespace-pre-wrap text-foreground">{pastNotesForData}</p>
                                 ) : (
                                     <p className="text-sm text-muted-foreground italic">{pastNotesForData === t('notes.errorLoadingNotes') ? pastNotesForData : t('pastDataPage.noNotesForDay')}</p>
                                 )}
                             </ScrollArea>
                         </div>
                     </AccordionContent>
                 </AccordionItem>

                <AccordionItem value="dictionary" className="border rounded-lg shadow-lg bg-card overflow-hidden">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                         <div className="flex items-center">
                             <BookOpen className="mr-2 h-5 w-5 text-primary" />
                             <span className="text-lg font-semibold">{t('cards.dictionaryTitle')}</span>
                         </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 py-4">
                        {pastDefinedWordsList.length > 0 ? (
                            <ScrollArea className="space-y-4 max-h-[400px]">
                                {pastDefinedWordsList.slice().reverse().map((entry) => (
                                    <div key={entry.id} className="p-3 border rounded-md bg-muted/30 shadow-sm mb-3">
                                        <h5 className="font-semibold text-primary">{entry.word}</h5>
                                        <div className="mt-2">
                                            <p className="text-xs font-medium text-muted-foreground">English:</p>
                                            <p className="text-sm whitespace-pre-wrap text-foreground">{entry.englishDefinition}</p>
                                        </div>
                                        <div className="mt-2">
                                            <p className="text-xs font-medium text-muted-foreground">Indonesia:</p>
                                            <p className="text-sm whitespace-pre-wrap text-foreground">{entry.indonesianDefinition}</p>
                                        </div>
                                    </div>
                                ))}
                            </ScrollArea>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">{t('pastDataPage.noDictionaryForDay')}</p>
                        )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        )}
         {!selectedPastDateForData && !isLoadingPastData && (
            <div className="text-center text-muted-foreground py-10">
                <p className="text-lg">{t('pastDataPage.pleaseSelectDate')}</p>
            </div>
        )}
      </main>
      <footer className="w-full max-w-2xl text-center py-6 text-sm text-muted-foreground relative z-[1]">
        <p>{t('footerCopyright', { year: new Date().getFullYear().toString(), appName: t('appName') })}</p>
      </footer>
    </div>
  );
}

          
        
      
    