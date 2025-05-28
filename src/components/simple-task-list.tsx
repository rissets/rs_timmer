
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Clock, XCircle } from "lucide-react";
import type { Task } from "@/lib/types";
import { useLanguageContext } from "@/contexts/language-context";
import { cn } from '@/lib/utils';

interface SimpleTaskListProps {
  tasks: Task[];
  onAddTask: (taskText: string, reminderTime?: string) => void;
  onToggleTask: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
  onClearCompletedTasks: () => void;
}

const generateTimeOptions = (max: number, step: number = 1, pad: number = 2): { value: string; label: string }[] => {
  const options = [];
  for (let i = 0; i < max; i += step) {
    const value = i.toString().padStart(pad, '0');
    options.push({ value, label: value });
  }
  return options;
};

const hoursOptions = generateTimeOptions(24);
const minutesOptions = generateTimeOptions(60);

export function SimpleTaskList({
  tasks,
  onAddTask,
  onToggleTask,
  onRemoveTask,
  onClearCompletedTasks
}: SimpleTaskListProps) {
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskReminderTime, setNewTaskReminderTime] = useState<string>(""); // "HH:mm" or ""
  const { t } = useLanguageContext();

  const handleHourChange = (hour: string) => {
    const currentMinute = newTaskReminderTime ? newTaskReminderTime.split(':')[1] : "00";
    setNewTaskReminderTime(`${hour}:${currentMinute}`);
  };

  const handleMinuteChange = (minute: string) => {
    const currentHour = newTaskReminderTime ? newTaskReminderTime.split(':')[0] : "00";
    setNewTaskReminderTime(`${currentHour}:${minute}`);
  };

  const clearReminderTime = () => {
    setNewTaskReminderTime("");
  };

  const handleAddTaskInternal = () => {
    if (newTaskText.trim()) {
      onAddTask(newTaskText.trim(), newTaskReminderTime || undefined);
      setNewTaskText("");
      setNewTaskReminderTime("");
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleAddTaskInternal();
    }
  };

  const currentHourValue = newTaskReminderTime ? newTaskReminderTime.split(':')[0] : undefined;
  const currentMinuteValue = newTaskReminderTime ? newTaskReminderTime.split(':')[1] : undefined;

  return (
    <>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <div>
            <Label htmlFor="new-task-text">{t('tasks.addTaskPlaceholder')}</Label>
            <Input
              id="new-task-text"
              type="text"
              placeholder={t('tasks.addTaskPlaceholder')}
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="focus:ring-accent mt-1"
            />
          </div>
          <div>
            <Label>{t('tasks.reminderTimeLabel')}</Label>
            <div className="flex items-center gap-2 mt-1">
              <Select value={currentHourValue} onValueChange={handleHourChange}>
                <SelectTrigger className="w-[70px]" aria-label={t('tasks.hourLabel')}>
                  <SelectValue placeholder={t('tasks.hourPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {hoursOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>:</span>
              <Select value={currentMinuteValue} onValueChange={handleMinuteChange}>
                <SelectTrigger className="w-[70px]" aria-label={t('tasks.minuteLabel')}>
                  <SelectValue placeholder={t('tasks.minutePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {minutesOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newTaskReminderTime && (
                <Button variant="ghost" size="icon" onClick={clearReminderTime} title={t('tasks.clearReminderTooltip')} className="h-8 w-8">
                  <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              )}
            </div>
          </div>
          <Button onClick={handleAddTaskInternal} aria-label={t('buttons.add')} className="w-full sm:w-auto mt-3">
            <Plus className="h-4 w-4 mr-2" /> {t('buttons.add')}
          </Button>
        </div>

        <ScrollArea className="h-[200px] pr-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t('tasks.noTasks')}</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-center space-x-3 p-2 border rounded-md hover:bg-accent/10">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => onToggleTask(task.id)}
                    aria-labelledby={`task-label-${task.id}`}
                  />
                  <div className="flex-grow">
                    <label
                      htmlFor={`task-${task.id}`}
                      id={`task-label-${task.id}`}
                      className={`text-sm cursor-pointer ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {task.text}
                    </label>
                    {task.reminderTime && (
                      <div className={cn(
                        "text-xs text-muted-foreground flex items-center mt-0.5",
                        task.completed && "line-through",
                        task.reminderSent && !task.completed && "text-primary"
                      )}>
                        <Clock className="h-3 w-3 mr-1" />
                        {task.reminderTime}
                        {task.reminderSent && !task.completed && <span className="ml-1 text-xs">({t('tasks.reminderSent')})</span>}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveTask(task.id)}
                    className="h-7 w-7"
                    aria-label={t('tasks.deleteTask', { taskText: task.text })}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
      {tasks.some(task => task.completed) && (
         <CardFooter>
            <Button variant="outline" onClick={onClearCompletedTasks} className="w-full">
                {t('buttons.clearCompletedTasks')}
            </Button>
         </CardFooter>
      )}
    </>
  );
}
