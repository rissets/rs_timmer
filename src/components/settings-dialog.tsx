
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
import type { Settings, BackgroundAnimationType } from "@/lib/types";
import { Settings as SettingsIcon, HelpCircle } from "lucide-react";
import React from "react";
import { useLanguageContext } from "@/contexts/language-context"; // Added

const settingsSchema = z.object({
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
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsDialog() {
  const { settings, setSettings, isSettingsLoaded } = useSettingsContext();
  const { t } = useLanguageContext(); // Added
  const [isOpen, setIsOpen] = React.useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
        ...DEFAULT_SETTINGS,
        ...settings,
      },
  });

  React.useEffect(() => {
    if (isSettingsLoaded) {
      form.reset({
        ...DEFAULT_SETTINGS,
        ...settings,
      });
    }
  }, [settings, form, isSettingsLoaded]);

  function onSubmit(data: SettingsFormValues) {
    setSettings(data as Settings);
    setIsOpen(false);
  }

  if (!isSettingsLoaded) {
    return (
      <Button variant="ghost" size="icon" disabled title={t('tooltips.settings') || 'Open settings'}>
        <SettingsIcon className="h-5 w-5" />
      </Button>
    );
  }

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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('settingsDialog.selectSoundscapePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SOUNDSCAPE_OPTIONS.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>{t(opt.nameKey)}</SelectItem>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('settingsDialog.selectSoundscapePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SOUNDSCAPE_OPTIONS.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>{t(opt.nameKey)}</SelectItem>
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
                    <FormLabel>{t('settingsDialog.volume', { percentage: Math.round(field.value * 100).toString() })}</FormLabel>
                    <FormControl>
                       <Slider
                        defaultValue={[field.value]}
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <DialogFooter>
              <Button type="submit">{t('buttons.saveChanges')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
