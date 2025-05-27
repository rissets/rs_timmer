
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card"; // Removed Card, CardHeader, CardTitle
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Plus } from "lucide-react";
import type { Task } from "@/lib/types";
import { useLanguageContext } from "@/contexts/language-context";

interface SimpleTaskListProps {
  tasks: Task[];
  onAddTask: (taskText: string) => void;
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
  const { t } = useLanguageContext();

  const handleAddTask = () => {
 console.log('onAddTask triggered');
    if (newTaskText.trim()) {
      onAddTask(newTaskText.trim());
      setNewTaskText("");
    }
  };


  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleAddTask();
    }
  };

  return (
    <>
      <CardContent className="space-y-4 pt-6"> {/* Added pt-6 for padding consistency */}
        <div className="flex flex-col gap-2 sm:flex-row sm:space-x-2 sm:gap-0">
          <Input
            type="text"
            placeholder={t('tasks.addTaskPlaceholder')}
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="focus:ring-accent"
          />
          <Button onClick={handleAddTask} aria-label={t('buttons.add')} className="w-full sm:w-auto">
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
                  <label
                    htmlFor={`task-${task.id}`}
                    id={`task-label-${task.id}`}
                    className={`flex-grow text-sm cursor-pointer ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                  >
                    {task.text}
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
 onClick={() => {
 console.log('onRemoveTask triggered for task:', task.id);
 onRemoveTask(task.id); }}
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
            <Button variant="outline" onClick={() => {
 console.log('onClearCompletedTasks triggered');
 onClearCompletedTasks(); }} className="w-full">
                {t('buttons.clearCompletedTasks')}
            </Button>
         </CardFooter>
      )}
    </>
  );
}

    