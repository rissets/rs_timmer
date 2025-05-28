
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Clock } from "lucide-react";
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

export function SimpleTaskList({
  tasks,
  onAddTask,
  onToggleTask,
  onRemoveTask,
  onClearCompletedTasks
}: SimpleTaskListProps) {
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskReminderTime, setNewTaskReminderTime] = useState("");
  const { t } = useLanguageContext();

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

  return (
    <>
      <CardContent className="space-y-4 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-end">
          <div className="flex-grow">
            <Label htmlFor="new-task-text" className="sr-only">{t('tasks.addTaskPlaceholder')}</Label>
            <Input
              id="new-task-text"
              type="text"
              placeholder={t('tasks.addTaskPlaceholder')}
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="focus:ring-accent"
            />
          </div>
          <div className="space-y-1"> {/* Group label and input for time */}
            <Label htmlFor="new-task-reminder-time" className="text-xs text-muted-foreground block">{t('tasks.reminderTimeLabel')}</Label>
            <Input
              id="new-task-reminder-time"
              type="time"
              value={newTaskReminderTime}
              onChange={(e) => setNewTaskReminderTime(e.target.value)}
              className="focus:ring-accent w-full sm:w-32" /* Consistent width on sm+, full on xs */
              aria-label={t('tasks.reminderTimeLabel')}
            />
          </div>
          <Button onClick={handleAddTaskInternal} aria-label={t('buttons.add')} className="w-full sm:w-auto">
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
                        task.reminderSent && !task.completed && "text-primary" // Highlight if reminder sent and not completed
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
