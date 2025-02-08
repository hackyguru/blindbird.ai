import React from 'react';
import { motion } from 'framer-motion';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] px-4 py-3 rounded-2xl backdrop-blur-xl",
          isUser
            ? "bg-white/40 dark:bg-neutral-900/40 border border-white/20 dark:border-neutral-800/50 ml-12"
            : "bg-white/20 dark:bg-neutral-800/40 border border-white/10 dark:border-neutral-700/50 mr-12"
        )}
      >
        <p className={cn(
          "text-sm",
          isUser
            ? "text-gray-800 dark:text-neutral-200"
            : "text-gray-700 dark:text-neutral-300"
        )}>
          {message.content}
        </p>
      </div>
    </motion.div>
  );
}; 