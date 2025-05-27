
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Plus } from "lucide-react";
import type { Task } from "@/lib/types";

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

  const handleAddTask = () => {
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
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Today's Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Add a new task..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="focus:ring-accent"
          />
          <Button onClick={handleAddTask} aria-label="Add task">
            <Plus className="h-4 w-4 mr-2" /> Add
          </Button>
        </div>
        <ScrollArea className="h-[200px] pr-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No tasks yet. Add some!</p>
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
                    onClick={() => onRemoveTask(task.id)}
                    className="h-7 w-7"
                    aria-label={`Delete task: ${task.text}`}
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
                Clear Completed Tasks
            </Button>
         </CardFooter>
      )}
    </Card>
  );
}
