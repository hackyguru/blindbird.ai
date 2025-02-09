import React, { useState, useEffect, useRef } from 'react';
import { Shuffle, Grid, FileText, Activity, Pause, Network, Play, MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { TypeAnimation } from 'react-type-animation';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatSession } from '@/types/chat';
import { createChatSession, getChatSessions, addMessageToSession } from '@/utils/chatStorage';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useWakuChat } from '@/hooks/useWakuChat';
import axios from 'axios';
import { useNodeStatus } from '@/hooks/useNodeStatus';
import { useOperatorMode } from '@/hooks/useOperatorMode';
import { cn } from '@/lib/utils';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

interface NewChatScreenProps {
  currentSession: ChatSession | null;
  onSessionCreate: (session: ChatSession) => void;
  isNetwork: boolean;
}

// Inference Mode Screens
export const NewChatScreen: React.FC<NewChatScreenProps> = ({ currentSession, onSessionCreate, isNetwork }) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isNodeActive = useNodeStatus();
  const { messages, sendMessage, clearMessages } = useWakuChat(isNodeActive, !isNetwork);

  // Clear messages when switching sessions or creating new chat
  useEffect(() => {
    clearMessages();
  }, [currentSession?.id]);

  // Handle Waku messages and store them in sessions
  useEffect(() => {
    if (!isNetwork && messages.length > 0 && currentSession) {
      const handleWakuMessages = async () => {
        const existingMessageCount = currentSession.messages.length;
        const newMessages = messages.slice(existingMessageCount);
        
        for (const msg of newMessages) {
          const content = atob(msg.payload);
          await addMessageToSession(
            currentSession.id,
            content,
            msg.isResponse ? 'assistant' : 'user'
          );
          const updatedSession = await getChatSessions().then(
            sessions => sessions.find(s => s.id === currentSession.id)
          );
          if (updatedSession) {
            onSessionCreate(updatedSession);
          }
        }
      };

      void handleWakuMessages();
    }
  }, [messages, currentSession, isNetwork, onSessionCreate]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    if (!isNetwork) {
      // Inference mode - create session first if needed
      if (!currentSession) {
        const newSession = await createChatSession(inputValue);
        onSessionCreate(newSession);
      }
      // Send message through Waku
      const success = await sendMessage(inputValue);
      if (success) {
        setInputValue('');
      }
    } else {
      // Operator mode - use existing mock functionality
      try {
        if (!currentSession) {
          const newSession = await createChatSession(inputValue);
          onSessionCreate(newSession);

          setTimeout(async () => {
            try {
              const updatedSession = await addMessageToSession(
                newSession.id,
                "I'm here to help! What would you like to know?",
                'assistant'
              );
              onSessionCreate(updatedSession);
            } catch (error) {
              console.error('Error sending assistant response:', error);
            }
          }, 1000);
        } else {
          // Add message to existing session
          const updatedSession = await addMessageToSession(currentSession.id, inputValue, 'user');
          onSessionCreate(updatedSession);

          // Add mock assistant response after a delay
          setTimeout(async () => {
            try {
              const responseSession = await addMessageToSession(
                updatedSession.id,
                "I understand your message. How can I assist you further?",
                'assistant'
              );
              onSessionCreate(responseSession);
            } catch (error) {
              console.error('Error sending assistant response:', error);
            }
          }, 1000);
        }
        setInputValue('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages container */}
      <AnimatePresence mode="wait">
        {!currentSession ? (
          // Welcome screen with "Hello, Guru"
          <motion.div 
            key="welcome"
            className="flex-1 overflow-auto rounded-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="max-w-[800px] mx-auto px-8 py-16">
              {/* Greeting */}
              <motion.div 
                className="mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.h1 
                  className="text-[40px] leading-tight font-medium text-gray-900 dark:text-neutral-50 mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Hello, Guru
                </motion.h1>
                <motion.p 
                  className="text-[26px] leading-tight text-gray-600 dark:text-neutral-400"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  How can I help you today?
                </motion.p>
              </motion.div>

              {/* Feature cards */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8"
                variants={container}
                initial="hidden"
                animate="show"
              >
                <motion.div variants={item}>
                  <FeatureCard
                    icon={<Shuffle className="w-5 h-5" />}
                    title="Templates"
                    gradient="from-blue-400/10 to-purple-400/10 dark:from-blue-500/10 dark:to-purple-500/10"
                  />
                </motion.div>
                <motion.div variants={item}>
                  <FeatureCard
                    icon={<Grid className="w-5 h-5" />}
                    title="Agents"
                    gradient="from-blue-400/10 via-indigo-400/10 to-blue-400/10 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-blue-500/10"
                  />
                </motion.div>
                <motion.div variants={item}>
                  <FeatureCard
                    icon={<FileText className="w-5 h-5" />}
                    title="Capabilities"
                    gradient="from-green-400/10 to-emerald-400/10 dark:from-green-500/10 dark:to-emerald-500/10"
                  />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          // Chat session view
          <>
            {/* Messages container */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl flex flex-col">
              {/* Messages */}
              <motion.div 
                ref={chatContainerRef}
                key="chat"
                className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:hover:bg-white/20 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-800/40 dark:[&::-webkit-scrollbar-thumb]:hover:bg-neutral-700/40 [&::-webkit-scrollbar-thumb]:rounded-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="min-h-full flex flex-col justify-end px-8 py-6 pb-32">
                  {currentSession.messages.map((message, index) => (
                    <ChatMessage
                      key={message.id}
                      message={{
                        id: message.id,
                        content: message.content,
                        role: message.sender,
                        timestamp: message.timestamp
                      }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Model selector floating on top */}
              <div className="absolute top-1 left-8 z-10">
                <Select
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                >
                  <SelectTrigger className="w-[200px] h-8 rounded-xl bg-white/40 dark:bg-neutral-900/40 border-white/20 dark:border-neutral-800/50 backdrop-blur-xl text-gray-800 dark:text-neutral-200 hover:bg-white/50 dark:hover:bg-neutral-900/50 transition-colors">
                    <SelectValue placeholder="Select AI Model" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/80 dark:bg-neutral-900/80 border-white/20 dark:border-neutral-800/50 backdrop-blur-xl rounded-xl">
                    <SelectGroup>
                      <SelectLabel className="text-gray-500 dark:text-neutral-400">OpenAI Models</SelectLabel>
                      <SelectItem value="gpt-4" className="text-gray-800 dark:text-neutral-200 focus:bg-gray-100/50 dark:focus:bg-neutral-800/50">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo" className="text-gray-800 dark:text-neutral-200 focus:bg-gray-100/50 dark:focus:bg-neutral-800/50">GPT-3.5 Turbo</SelectItem>
                      <SelectSeparator className="bg-gray-200/50 dark:bg-neutral-800/50" />
                      <SelectLabel className="text-gray-500 dark:text-neutral-400">Anthropic Models</SelectLabel>
                      <SelectItem value="claude-3-opus" className="text-gray-800 dark:text-neutral-200 focus:bg-gray-100/50 dark:focus:bg-neutral-800/50">Claude 3 Opus</SelectItem>
                      <SelectItem value="claude-3-sonnet" className="text-gray-800 dark:text-neutral-200 focus:bg-gray-100/50 dark:focus:bg-neutral-800/50">Claude 3 Sonnet</SelectItem>
                      <SelectSeparator className="bg-gray-200/50 dark:bg-neutral-800/50" />
                      <SelectLabel className="text-gray-500 dark:text-neutral-400">Google Models</SelectLabel>
                      <SelectItem value="gemini-pro" className="text-gray-800 dark:text-neutral-200 focus:bg-gray-100/50 dark:focus:bg-neutral-800/50">Gemini Pro</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Input box always visible */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="py-4">
          <div className="max-w-[800px] mx-auto px-8">
            <motion.div 
              className="bg-white/40 dark:bg-neutral-900/40 border border-white/20 dark:border-neutral-800/50 backdrop-blur-xl rounded-2xl flex items-center shadow-[0_8px_32px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgb(0,0,0,0.1)]"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <div className="flex-1 relative">
                <Input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-0 rounded-full h-12 px-6 text-sm text-gray-800 dark:text-neutral-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                {!inputValue && !isFocused && (
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-sm text-gray-500 dark:text-neutral-500">
                    <TypeAnimation
                      sequence={[
                        'Ask me anything...',
                        2000,
                        'Ask me about cars...',
                        2000,
                        'Ask me about people...',
                        2000,
                        'Ask me to write code...',
                        2000,
                      ]}
                      wrapper="span"
                      speed={50}
                      repeat={Infinity}
                    />
                  </div>
                )}
              </div>
              <div className="pr-2">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="icon"
                    onClick={handleSendMessage}
                    className="rounded-full w-8 h-8 bg-white dark:bg-neutral-900 hover:bg-neutral-100/50 dark:hover:bg-neutral-800"
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-700 dark:text-neutral-400">
                      <path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Feature card component
function FeatureCard({ 
  icon, 
  title, 
  gradient 
}: { 
  icon: React.ReactNode; 
  title: string; 
  gradient: string;
}) {
  return (
    <motion.div 
      className={`bg-gradient-to-br ${gradient} p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all duration-200 border border-white/20 dark:border-neutral-800/50 backdrop-blur-xl`}
      whileHover={{ 
        scale: 1.03,
        transition: { type: "spring", stiffness: 400, damping: 17 }
      }}
      whileTap={{ scale: 0.97 }}
    >
      <motion.div 
        className="bg-white/20 dark:bg-neutral-800/20 w-10 h-10 rounded-xl flex items-center justify-center text-gray-700 dark:text-neutral-300 shadow-lg backdrop-blur-xl mb-[84px]"
        whileHover={{ rotate: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {icon}
      </motion.div>
      <h3 className="text-[15px] font-medium text-gray-800 dark:text-neutral-100">{title}</h3>
    </motion.div>
  );
}

export const NewAgentScreen: React.FC = () => {
  return (
    <div className="flex flex-col h-full p-6 rounded-3xl">
      <h1 className="text-2xl font-semibold mb-4">New Agent</h1>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-medium">Create a New Agent</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Design and configure a new AI agent with custom capabilities and behaviors.
          </p>
        </div>
      </div>
    </div>
  );
};

export const BrowseAgentsScreen: React.FC = () => {
  return (
    <div className="flex flex-col h-full p-6 rounded-3xl">
      <h1 className="text-2xl font-semibold mb-4">Browse Agents</h1>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-medium">Discover Available Agents</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Explore and connect with various AI agents available on the network.
          </p>
        </div>
      </div>
    </div>
  );
};

// Operator Mode Screens
export const ConfigurationScreen: React.FC = () => {
  return (
    <div className="flex flex-col h-full p-6 rounded-3xl">
      <h1 className="text-2xl font-semibold mb-4">Configuration</h1>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-medium">Node Configuration</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Configure your node settings and parameters for optimal performance on the network.
          </p>
        </div>
      </div>
    </div>
  );
};

export const ConnectionsScreen: React.FC = () => {
  return (
    <div className="flex flex-col h-full p-6 rounded-3xl">
      <h1 className="text-2xl font-semibold mb-4">Connections</h1>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-medium">Network Connections</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Monitor and manage your connections to other nodes in the Waku network.
          </p>
        </div>
      </div>
    </div>
  );
};

export const StatusScreen: React.FC = () => {
  return (
    <div className="flex flex-col h-full p-6 rounded-3xl">
      <h1 className="text-2xl font-semibold mb-4">Status</h1>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-medium">Node Status</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            View your node's current status, performance metrics, and network statistics.
          </p>
        </div>
      </div>
    </div>
  );
};

// Add this interface at the top with other imports
interface IncomingMessage {
  timestamp: number;
  content: string;
  status: 'received' | 'processed' | 'responded';
}

// Update the NodeStatusScreen component
export const NodeStatusScreen: React.FC<{ isRunning: boolean; onToggle: () => void }> = ({ isRunning, onToggle }) => {
  const isNodeActive = useNodeStatus();
  const { isSubscribed, receivedMessages } = useOperatorMode(isNodeActive, isRunning);

  return (
    <div className="flex flex-col h-full p-6 rounded-3xl">
      <div className="flex-1 flex flex-col">
        {isRunning ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/40 dark:bg-neutral-900/40 border border-white/20 dark:border-neutral-800/50 backdrop-blur-xl rounded-2xl p-4">
                <h3 className="text-sm font-medium text-gray-800 dark:text-neutral-200 mb-2">Node Status</h3>
                <div className={cn(
                  "text-sm px-2 py-1 rounded-full w-fit",
                  isNodeActive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                )}>
                  {isNodeActive ? 'Connected' : 'Disconnected'}
                </div>
              </div>
              <div className="bg-white/40 dark:bg-neutral-900/40 border border-white/20 dark:border-neutral-800/50 backdrop-blur-xl rounded-2xl p-4">
                <h3 className="text-sm font-medium text-gray-800 dark:text-neutral-200 mb-2">Subscription Status</h3>
                <div className={cn(
                  "text-sm px-2 py-1 rounded-full w-fit",
                  isSubscribed ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"
                )}>
                  {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
                </div>
              </div>
            </div>
            
            <div className="flex-1 bg-white/40 dark:bg-neutral-900/40 border border-white/20 dark:border-neutral-800/50 backdrop-blur-xl rounded-2xl p-4">
              <h3 className="text-sm font-medium text-gray-800 dark:text-neutral-200 mb-4">Incoming Messages</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {receivedMessages.length > 0 ? (
                  receivedMessages.map((msg, index) => (
                    <div key={msg.timestamp} className="flex items-center justify-between bg-white/40 dark:bg-neutral-800/40 rounded-xl p-3">
                      <div className="flex-1 mr-4">
                        <p className="text-sm text-gray-800 dark:text-neutral-200">
                          {msg.content}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-neutral-400">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        msg.status === 'received' ? "bg-blue-500/20 text-blue-500" :
                        msg.status === 'processing' ? "bg-yellow-500/20 text-yellow-500" :
                        "bg-green-500/20 text-green-500"
                      )}>
                        {msg.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 dark:text-neutral-400 py-4">
                    Waiting for messages...
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/40 dark:bg-neutral-900/40 border border-white/20 dark:border-neutral-800/50 backdrop-blur-xl mb-4">
              <Pause className="w-10 h-10 text-gray-600 dark:text-neutral-400" />
            </div>
            <h2 className="text-2xl font-medium text-gray-800 dark:text-neutral-200">Node is Paused</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Start the node to begin processing messages and contributing to the network.
            </p>
            <div className="pt-4">
              <Button
                onClick={onToggle}
                className="h-12 px-6 rounded-xl bg-emerald-500/80 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Node
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Add this new component for the initial operator mode view
export const OperatorWelcomeScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className="flex flex-col h-full p-6 rounded-3xl">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/40 dark:bg-neutral-900/40 border border-white/20 dark:border-neutral-800/50 backdrop-blur-xl mb-4">
            <Network className="w-10 h-10 text-gray-600 dark:text-neutral-400" />
          </div>
          <h2 className="text-2xl font-medium text-gray-800 dark:text-neutral-200">Welcome to Operator Mode</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Start your node to begin processing requests and contributing to the decentralized network.
          </p>
          <div className="pt-4">
            <Button
              onClick={onStart}
              className="h-12 px-6 rounded-xl bg-emerald-500/80 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Node
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Update the chat sessions sidebar section
<div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-neutral-600">
  <motion.div
    variants={container}
    initial="hidden"
    animate="show"
    className="space-y-2 p-2"
  >
    {chatSessions.map((session) => (
      <motion.div
        key={session.id}
        variants={item}
        className="relative group"
      >
        <Button
          variant="ghost"
          onClick={() => handleSessionSelect(session)}
          className={cn(
            "w-full justify-start text-[13px] rounded-xl transition-all backdrop-blur-sm",
            selectedSession?.id === session.id
              ? "bg-gray-100/70 dark:bg-white/10 text-gray-800 dark:text-gray-100 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-300"
          )}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {session.name || `Chat ${chatSessions.length - chatSessions.indexOf(session)}`}
        </Button>
      </motion.div>
    ))}
  </motion.div>
</div> 