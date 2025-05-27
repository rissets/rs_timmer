
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useSettingsContext } from "@/contexts/settings-context";
import { SOUNDSCAPE_OPTIONS, BACKGROUND_ANIMATION_OPTIONS, DEFAULT_SETTINGS } from "@/lib/constants";
import type { Settings, BackgroundAnimationType, UserSoundscapeListItem, SoundscapeOption } from "@/lib/types";
import { Settings as SettingsIcon, HelpCircle, Music4, UploadCloud, ListMusic, Trash2, Link2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLanguageContext } from "@/contexts/language-context"; 
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { addSoundscape, getAllSoundscapeListItems, deleteSoundscape as deleteSoundscapeFromDB } from "@/lib/audio-storage";

// Base schema for individual settings
const baseSettingsSchema = {
  workMinutes: z.coerce.number().min(1).max(120),
  shortBreakMinutes: z.coerce.number().min(1).max(60),
  longBreakMinutes: z.coerce.number().min(1).max(120),
  longBreakInterval: z.coerce.number().min(1).max(10),
  autoStartBreaks: z.boolean(),
  autoStartPomodoros: z.boolean(),
  soundscapeWork: z.string().optional(),
  soundscapeBreak: z.string().optional(),
  volume: z.number().min(0).max(1),
  notificationsEnabled: z.boolean(),
  backgroundAnimation: z.custom<BackgroundAnimationType>((val) => 
    BACKGROUND_ANIMATION_OPTIONS.some(opt => opt.id === val)
  ).default(DEFAULT_SETTINGS.backgroundAnimation),
  mouseTrailEffectEnabled: z.boolean().default(DEFAULT_SETTINGS.mouseTrailEffectEnabled),
  showCoachMarks: z.boolean().default(DEFAULT_SETTINGS.showCoachMarks),
};

// Schema for customSoundscapeUrls: an object where keys are strings and values are URLs or empty strings
const customSoundscapeUrlsSchema = z.record(
  z.string(), // Key (e.g., soundscape ID like 'lofiVibesUrl')
  z.string().url({ message: "Invalid URL format. Please enter a valid audio stream URL." }).optional().or(z.literal("")) // Value (URL or empty string)
);

const settingsSchema = z.object({
  ...baseSettingsSchema,
  customSoundscapeUrls: customSoundscapeUrlsSchema.optional(),
});


type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsDialog() {
  const { settings, setSettings, isSettingsLoaded } = useSettingsContext();
  const { t } = useLanguageContext(); 
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [userSoundscapes, setUserSoundscapes] = useState<UserSoundscapeListItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [combinedSoundscapeOptions, setCombinedSoundscapeOptions] = useState<SoundscapeOption[]>(SOUNDSCAPE_OPTIONS);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
        ...DEFAULT_SETTINGS,
        ...settings,
        customSoundscapeUrls: {
          ...DEFAULT_SETTINGS.customSoundscapeUrls,
          ...(settings.customSoundscapeUrls || {}),
        }
      },
  });

  const loadUserSoundscapes = async () => {
    try {
      const items = await getAllSoundscapeListItems();
      setUserSoundscapes(items);
    } catch (error) {
      console.error("Failed to load user soundscapes:", error);
      toast({ title: t('settingsDialog.errors.loadUserSoundscapesFailed'), variant: "destructive" });
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUserSoundscapes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isSettingsLoaded) {
      form.reset({
        ...DEFAULT_SETTINGS,
        ...settings,
        customSoundscapeUrls: { // Ensure customSoundscapeUrls is an object
          ...DEFAULT_SETTINGS.customSoundscapeUrls,
          ...(settings.customSoundscapeUrls || {}),
        },
      });
    }
  }, [settings, form, isSettingsLoaded]);
  
  useEffect(() => {
    const userSoundscapeOptionsFormatted: SoundscapeOption[] = userSoundscapes.map(us => ({
      id: `user_${us.id}`,
      nameKey: us.name, // For user sounds, nameKey is the actual name
      type: 'userUploaded',
      params: { indexedDbId: us.id }
    }));
    const newCombinedFullOptions = [...SOUNDSCAPE_OPTIONS, ...userSoundscapeOptionsFormatted];
    setCombinedSoundscapeOptions(newCombinedFullOptions);

    // Validate and reset form values if current selection is no longer valid
    // This typically happens if a user-uploaded soundscape was selected and then deleted
    if (isSettingsLoaded && newCombinedFullOptions.length > 0) {
      const currentWorkId = form.getValues('soundscapeWork');
      if (currentWorkId && !newCombinedFullOptions.some(opt => opt.id === currentWorkId)) {
        form.setValue('soundscapeWork', DEFAULT_SETTINGS.soundscapeWork, { shouldDirty: true, shouldValidate: true });
      }

      const currentBreakId = form.getValues('soundscapeBreak');
      if (currentBreakId && !newCombinedFullOptions.some(opt => opt.id === currentBreakId)) {
        form.setValue('soundscapeBreak', DEFAULT_SETTINGS.soundscapeBreak, { shouldDirty: true, shouldValidate: true });
      }
    }
  }, [userSoundscapes, form, isSettingsLoaded, settings, t]); // `settings` is included because form.getValues() depends on the form's current state, which is initialized from settings


  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({ title: t('settingsDialog.errors.invalidFileType'), variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({ title: t('settingsDialog.errors.fileTooLarge'), variant: "destructive" });
        return;
    }

    setIsUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      await addSoundscape(file.name, file.type, arrayBuffer);
      toast({ title: t('settingsDialog.uploadSuccessTitle') });
      await loadUserSoundscapes(); // Refresh the list
    } catch (error: any) {
      console.error("Error uploading soundscape:", error);
      toast({ title: t('settingsDialog.errors.uploadFailed'), description: error?.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Reset file input
    }
  }

  async function handleDeleteUserSoundscape(id: number, name: string) {
    if (!confirm(t('settingsDialog.confirmDeleteSoundscape', { name }))) return;
    try {
      // Check if this soundscape is currently selected in settings
      if (settings.soundscapeWork === `user_${id}` || settings.soundscapeBreak === `user_${id}`) {
        toast({ title: t('settingsDialog.errors.soundscapeInUseTitle'), description: t('settingsDialog.errors.soundscapeInUseDescription'), variant: "destructive" });
        return;
      }
      await deleteSoundscapeFromDB(id);
      toast({ title: t('settingsDialog.deleteSuccessTitle', { name }) });
      await loadUserSoundscapes();
    } catch (error) {
      console.error("Error deleting soundscape:", error);
      toast({ title: t('settingsDialog.errors.deleteFailed'), variant: "destructive" });
    }
  }


  function onSubmit(data: SettingsFormValues) {
    const newSettings: Settings = {
      ...data,
      customSoundscapeUrls: data.customSoundscapeUrls || {}, // Ensure it's an object
    };
    setSettings(newSettings);
    setIsOpen(false);
  }

  if (!isSettingsLoaded) {
    return (
      <Button variant="ghost" size="icon" disabled title={t('tooltips.settings') || 'Open settings'}>
        <SettingsIcon className="h-5 w-5" />
      </Button>
    );
  }

  const urlSoundscapeOptions = SOUNDSCAPE_OPTIONS.filter(opt => opt.type === 'url');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('tooltips.settings') || 'Open settings'}>
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('settingsDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('settingsDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
            <FormField
              control={form.control}
              name="showCoachMarks"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center">
                      <HelpCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                      {t('settingsDialog.showInitialGuide')}
                    </FormLabel>
                    <FormDescription>
                      {t('settingsDialog.showInitialGuideDescription')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label={t('settingsDialog.showInitialGuide')}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="workMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settingsDialog.workMinutes')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shortBreakMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settingsDialog.shortBreakMinutes')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longBreakMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settingsDialog.longBreakMinutes')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="longBreakInterval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settingsDialog.longBreakInterval')}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('settingsDialog.longBreakIntervalDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="autoStartBreaks"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>{t('settingsDialog.autoStartBreaks')}</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="autoStartPomodoros"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>{t('settingsDialog.autoStartPomodoros')}</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="notificationsEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>{t('settingsDialog.enableNotifications')}</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="mouseTrailEffectEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>{t('settingsDialog.mouseTrailEffect')}</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="soundscapeWork"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settingsDialog.soundscapeWork')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('settingsDialog.selectSoundscapePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {combinedSoundscapeOptions.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.type === 'userUploaded' ? opt.nameKey : t(opt.nameKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="soundscapeBreak"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settingsDialog.soundscapeBreak')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('settingsDialog.selectSoundscapePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {combinedSoundscapeOptions.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>
                           {opt.type === 'userUploaded' ? opt.nameKey : t(opt.nameKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="volume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settingsDialog.volume', { percentage: Math.round((field.value || 0) * 100).toString() })}</FormLabel>
                    <FormControl>
                       <Slider
                        value={[field.value || 0]} 
                        max={1}
                        step={0.01}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="backgroundAnimation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settingsDialog.backgroundAnimation')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('settingsDialog.selectAnimationPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BACKGROUND_ANIMATION_OPTIONS.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>{t(opt.nameKey)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom Soundscape Upload Section */}
            <div className="space-y-4 pt-4">
              <Separator />
              <div className="flex items-center space-x-2 pt-2">
                <UploadCloud className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">{t('settingsDialog.myCustomSoundscapes.title')}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('settingsDialog.myCustomSoundscapes.description')}
              </p>
              <FormItem>
                <FormLabel htmlFor="soundscape-upload">{t('settingsDialog.myCustomSoundscapes.uploadLabel')}</FormLabel>
                <Input 
                  id="soundscape-upload" 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleFileUpload} 
                  disabled={isUploading}
                  className="focus:ring-accent"
                />
                {isUploading && <p className="text-sm text-muted-foreground">{t('settingsDialog.myCustomSoundscapes.uploading')}</p>}
              </FormItem>

              {userSoundscapes.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-md font-semibold flex items-center">
                    <ListMusic className="mr-2 h-5 w-5 text-primary/80" />
                    {t('settingsDialog.myCustomSoundscapes.uploadedListTitle')}
                  </h4>
                  <ul className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-1">
                    {userSoundscapes.map((sound) => (
                      <li key={sound.id} className="flex items-center justify-between p-1.5 hover:bg-accent/10 rounded-md">
                        <span className="text-sm truncate" title={sound.name}>{sound.name}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => handleDeleteUserSoundscape(sound.id, sound.name)}
                          title={t('settingsDialog.myCustomSoundscapes.deleteButtonTooltip', {name: sound.name})}
                          type="button" // Important: prevent form submission
                        >
                          <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Custom Soundscape URL Inputs Section (Removed this feature as per previous request) */}

            <DialogFooter>
              <Button type="submit">{t('buttons.saveChanges')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
