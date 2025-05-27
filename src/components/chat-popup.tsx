
"use client";

import React, { useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X as CloseIcon, Send } from 'lucide-react';
import type { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useLanguageContext } from "@/contexts/language-context";

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  isLoadingAiResponse?: boolean;
}

export function ChatPopup({
  isOpen,
  onClose,
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
  isLoadingAiResponse = false,
}: ChatPopupProps) {
  const { t } = useLanguageContext();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Focus input when popup opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  
  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollableViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollableViewport) {
        scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (inputValue.trim()) {
        onSendMessage();
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-[calc(4rem+2rem)] right-6 z-[60] transition-all duration-300 ease-out", // Position above FAB
      "sm:bottom-24 sm:right-6", // Adjust for larger screens if needed
      isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
    )}>
      <Card className="w-[calc(100vw-3rem)] max-w-sm h-[70vh] max-h-[500px] shadow-xl flex flex-col sm:w-96">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
          <CardTitle className="text-lg">{t('chatWidget.popupTitle')}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('buttons.close') || "Close chat"}>
            <CloseIcon className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-0 flex-grow overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[80%] p-2 rounded-lg",
                    msg.sender === 'user' ? 'bg-primary text-primary-foreground ml-auto rounded-br-none' : 'bg-muted text-muted-foreground mr-auto rounded-bl-none'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <span className={cn(
                    "text-xs opacity-70 mt-1",
                     msg.sender === 'user' ? 'text-right' : 'text-left'
                  )}>
                    {format(msg.timestamp, 'p')}
                  </span>
                </div>
              ))}
              {isLoadingAiResponse && (
                 <div className="flex items-center space-x-2 p-2 mr-auto">
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"></div>
                 </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-2 border-t">
          <div className="flex w-full items-center space-x-2">
            <Textarea
              ref={inputRef}
              placeholder={t('chatWidget.inputPlaceholder')}
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
              className="flex-grow resize-none min-h-[40px] max-h-[100px] focus:ring-accent"
              disabled={isLoadingAiResponse}
            />
            <Button 
              onClick={onSendMessage} 
              disabled={!inputValue.trim() || isLoadingAiResponse}
              aria-label={t('chatWidget.sendButtonLabel') || "Send message"}
              size="icon"
              className="h-10 w-10"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
