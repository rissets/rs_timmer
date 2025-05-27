
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare } from 'lucide-react';
import { useLanguageContext } from "@/contexts/language-context";

interface ChatWidgetButtonProps {
  onClick: () => void;
  messageCount?: number; // Optional: to show a badge with unread messages
}

export function ChatWidgetButton({ onClick, messageCount }: ChatWidgetButtonProps) {
  const { t } = useLanguageContext();

  return (
    <Button
      onClick={onClick}
      variant="default" // Or "primary" based on your theme's intent
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 flex items-center justify-center"
      aria-label={t('chatWidget.toggleButtonLabel') || "Open Chat"}
      title={t('chatWidget.toggleButtonLabel') || "Open Chat"}
    >
      <MessageSquare className="h-7 w-7" />
      {messageCount && messageCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
          {messageCount > 9 ? '9+' : messageCount}
        </span>
      )}
    </Button>
  );
}
