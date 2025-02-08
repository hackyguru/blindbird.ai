import React, { useEffect, useState, useRef } from "react";
import { Home, Users, History, Plus, Moon, Sun, RadioTower, Settings, Download, Network, MessageCircle, Info, Cog, Link2, Activity, Bot, FolderSearch, X, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { motion, AnimatePresence } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Route } from "@/types/routes";
import { NewChatScreen, NewAgentScreen, BrowseAgentsScreen, ConfigurationScreen, ConnectionsScreen, StatusScreen } from "@/screens";
import { getChatSessions } from '@/utils/chatStorage';
import { ChatSession } from '@/types/chat';
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Animation variants
const sidebarVariants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

// Component for the rotating background
const RotatingBackground = ({ rotation }: { rotation: number }) => (
  <motion.div 
    className="fixed bottom-[-30%] right-[-30%] w-[1000px] h-[1000px] z-0 flex items-center justify-center overflow-hidden"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1 }}
  >
    <img 
      src="/images/codexrock.webp" 
      alt="background" 
      className="w-full h-full object-cover opacity-50 dark:opacity-20"
      style={{ 
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        transition: 'transform 0.5s linear'
      }}
    />
  </motion.div>
);

// Component for the logo section
const LogoSection = () => {
  const { theme } = useTheme();
  
  return (
    <motion.div 
      className="flex items-center space-x-2 px-4 py-3"
      variants={itemVariants}
    >
      <img 
        src={theme === 'dark' ? '/images/blindbird-white.png' : '/images/blindbird-black.png'} 
        alt="WakuAI" 
        className="w-10 h-10" 
      />
      <span className="font-medium text-2xl text-gray-800 dark:text-neutral-50">blindbird.ai</span>
    </motion.div>
  );
};

// Component for inference mode navigation
const InferenceModeNav = ({ 
  setActiveRoute, 
  onSessionSelect,
  onNewChat,
  activeSession,
  activeRoute
}: { 
  setActiveRoute: (route: Route) => void;
  onSessionSelect: (session: ChatSession) => void;
  onNewChat: () => void;
  activeSession: ChatSession | null;
  activeRoute: Route;
}) => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat sessions
  const loadSessions = async () => {
    try {
      const sessions = await getChatSessions();
      setChatSessions(sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setChatSessions([]);
    }
  };

  // Delete chat session
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the button click
    try {
      const sessions = await getChatSessions();
      const updatedSessions = sessions.filter(session => session.id !== sessionId);
      await window.electronAPI.store.set('sessions', updatedSessions);
      
      // If the deleted session was active, reset it
      if (activeSession?.id === sessionId) {
        onNewChat();
      }
      
      // Trigger UI update
      window.dispatchEvent(new CustomEvent('chat-storage-changed'));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleDoubleClick = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
    // Focus will be handled by useEffect
  };

  const handleTitleSubmit = async () => {
    if (!editingSessionId) return;
    
    try {
      const sessions = await getChatSessions();
      const updatedSessions = sessions.map(session => 
        session.id === editingSessionId 
          ? { ...session, title: editingTitle }
          : session
      );
      
      await window.electronAPI.store.set('sessions', updatedSessions);
      setEditingSessionId(null);
      
      // Trigger UI update
      window.dispatchEvent(new CustomEvent('chat-storage-changed'));
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
    }
  };

  // Add useEffect for auto-focus
  useEffect(() => {
    if (editingSessionId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingSessionId]);

  useEffect(() => {
    // Initial load
    loadSessions();

    // Listen for storage changes
    const handleStorageChange = () => {
      loadSessions();
    };

    window.addEventListener('chat-storage-changed', handleStorageChange);
    return () => window.removeEventListener('chat-storage-changed', handleStorageChange);
  }, []);

  return (
    <motion.div
      className="space-y-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Button 
        variant="outline" 
        className={cn(
          "w-full h-10 justify-start text-[13px] rounded-xl backdrop-blur-sm",
          activeRoute === 'new-chat' && !activeSession
            ? "bg-gray-100/70 dark:bg-white/10 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-neutral-800"
            : "text-gray-600 dark:text-neutral-400 border-gray-200 dark:border-neutral-800 hover:bg-gray-100/50 dark:hover:bg-neutral-800/50 shadow-sm"
        )}
        onClick={onNewChat}
      >
        <Plus className="mr-3 h-4 w-4" />
        New chat
      </Button>
      <div onClick={() => setActiveRoute('new-agent')}>
        <NavItem 
          icon={<Bot size={16} />} 
          label="New agent" 
          route="new-agent"
          currentRoute={activeRoute}
        />
      </div>
      <div onClick={() => setActiveRoute('browse-agents')}>
        <NavItem 
          icon={<FolderSearch size={16} />} 
          label="Browse agents" 
          route="browse-agents"
          currentRoute={activeRoute}
        />
      </div>
      
      {/* Divider */}
      <div className="py-3">
        <div className="h-[1px] bg-gray-200/50 dark:bg-neutral-800/50" />
      </div>

      {/* Recent History Section */}
      {chatSessions.length > 0 && (
        <>
          <div className="px-3 py-1">
            <p className="text-xs font-medium text-gray-500 dark:text-neutral-500 uppercase tracking-wider">
              Recent History
            </p>
          </div>

          {/* Chat Sessions */}
          <div className="space-y-1 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-700">
            {chatSessions.map((session) => (
              <Button
                key={session.id}
                variant="ghost"
                className={cn(
                  "group w-full h-10 justify-start text-[13px] rounded-xl relative pr-8",
                  activeSession?.id === session.id
                    ? "bg-gray-100/70 dark:bg-white/10 text-gray-800 dark:text-gray-100"
                    : "text-gray-600 dark:text-neutral-400 hover:bg-gray-100/50 dark:hover:bg-neutral-800/50"
                )}
                onClick={() => onSessionSelect(session)}
                onDoubleClick={() => handleDoubleClick(session)}
              >
                <MessageCircle className="mr-3 h-4 w-4 flex-shrink-0" />
                {editingSessionId === session.id ? (
                  <Input
                    ref={inputRef}
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={handleTitleSubmit}
                    className="h-6 px-0 py-0 w-[120px] bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-[13px] mr-6"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate max-w-[120px]">{session.title}</span>
                )}
                <div 
                  className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDeleteSession(session.id, e)}
                >
                  <div className="p-0.5 hover:bg-white/40 dark:hover:bg-neutral-700/40 rounded-full">
                    <X className="h-2.5 w-2.5 text-gray-500 dark:text-neutral-400" />
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
};

// Component for operator mode navigation
const OperatorModeNav = ({ setActiveRoute, activeRoute }: { setActiveRoute: (route: Route) => void; activeRoute: Route }) => {
  const [isRunning, setIsRunning] = useState(false);

  return (
    <motion.div
      className="space-y-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Button 
        variant="outline" 
        className={cn(
          "w-full h-10 justify-start text-[13px] rounded-xl backdrop-blur-sm",
          isRunning
            ? "bg-emerald-400/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20"
            : "text-gray-600 dark:text-neutral-400 border-gray-200 dark:border-neutral-800 hover:bg-gray-100/50 dark:hover:bg-neutral-800/50"
        )}
        onClick={() => setIsRunning(!isRunning)}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isRunning ? 0 : 0 }}
          className="mr-3 h-4 w-4"
        >
          {isRunning ? (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Pause className="h-4 w-4" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -180 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Play className="h-4 w-4" />
            </motion.div>
          )}
        </motion.div>
        {isRunning ? 'Running' : 'Start'}
      </Button>

      {/* Options Section */}
      <div className="py-3">
        <div className="px-3 py-1">
          <p className="text-xs font-medium text-gray-500 dark:text-neutral-500 uppercase tracking-wider">
            Options
          </p>
        </div>

        <div className="space-y-1">
          <div onClick={() => setActiveRoute('configuration')}>
            <NavItem 
              icon={<Cog size={16} />} 
              label="Configuration" 
              route="configuration"
              currentRoute={activeRoute}
            />
          </div>
          <div onClick={() => setActiveRoute('connections')}>
            <NavItem 
              icon={<Link2 size={16} />} 
              label="Connections" 
              route="connections"
              currentRoute={activeRoute}
            />
          </div>
          <div onClick={() => setActiveRoute('status')}>
            <NavItem 
              icon={<Activity size={16} />} 
              label="Status" 
              route="status"
              currentRoute={activeRoute}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Component for mode switcher
const ModeSwitcher = ({ isNetwork, setIsNetwork }: { isNetwork: boolean; setIsNetwork: (value: boolean) => void }) => (
  <motion.div 
    className="mx-2 mb-8"
    variants={itemVariants}
  >
    <motion.div
      className="bg-white/40 dark:bg-neutral-900/40 border border-white/20 dark:border-neutral-800/50 backdrop-blur-xl rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <ModeSwitcherHeader isNetwork={isNetwork} />
      <ModeSwitcherToggle isNetwork={isNetwork} setIsNetwork={setIsNetwork} />
    </motion.div>
  </motion.div>
);

// Component for mode switcher header
const ModeSwitcherHeader = ({ isNetwork }: { isNetwork: boolean }) => (
  <div className="flex items-center justify-between px-4 py-3">
    <motion.p 
      className="text-sm font-medium text-gray-800 dark:text-neutral-200"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key={isNetwork ? 'operator' : 'inference'}
    >
      {isNetwork ? 'Operator Mode' : 'Inference Mode'}
    </motion.p>
    <Popover>
      <PopoverTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="cursor-pointer text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300"
        >
          <Info className="h-[14px] w-[14px]" />
        </motion.div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 backdrop-blur-xl bg-white/40 dark:bg-neutral-900/40 border-white/20 dark:border-neutral-800/50"
        side="top"
        align="start"
        alignOffset={-20}
        sideOffset={10}
        avoidCollisions={false}
      >
        <div className="text-xs leading-relaxed text-gray-600 dark:text-neutral-300">
          {isNetwork ? (
            <p>
              Operator mode uses Waku based p2p discovery topics to find requests from users who are intending to interact with a AI model without compromising on their privacy. By using this mode, you serve as a node operator who adds value to the network by providing inference. In the future, you can expect to be incentivized by a micropayment for all the jobs completed with a reputable inference. However, this project is currently working on tokenomics.
            </p>
          ) : (
            <p>
              Inference mode uses Waku based p2p inference topics to interact with an AI model without revealing your identity. You can send prompts to a AI model or interact with a AI agent that uses a distributed inference preserving privacy. In the future, you can expect to perform a micropayment for your interactions using this mode.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  </div>
);

// Component for mode switcher toggle
const ModeSwitcherToggle = ({ isNetwork, setIsNetwork }: { isNetwork: boolean; setIsNetwork: (value: boolean) => void }) => (
  <div className="p-1 border-t border-white/10 dark:border-neutral-800/50">
    <div className="grid grid-cols-2 relative">
      <motion.div
        layoutId="highlight"
        className="absolute w-1/2 h-full bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-white/50 dark:border-white/[0.08] rounded-[10px] shadow-sm"
        initial={false}
        animate={{
          x: !isNetwork ? 0 : "100%"
        }}
        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
      />
      <SwitcherIcon 
        icon={<MessageCircle className="h-[18px] w-[18px]" />}
        isActive={!isNetwork}
        onClick={() => setIsNetwork(false)}
      />
      <SwitcherIcon 
        icon={<Network className="h-[18px] w-[18px]" />}
        isActive={isNetwork}
        onClick={() => setIsNetwork(true)}
      />
    </div>
  </div>
);

// Component for switcher icon
const SwitcherIcon = ({ icon, isActive, onClick }: { icon: React.ReactNode; isActive: boolean; onClick: () => void }) => (
  <motion.div 
    className="relative flex items-center justify-center cursor-pointer h-[38px]"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
  >
    <motion.div
      animate={{
        scale: isActive ? 1 : 0.9,
        opacity: isActive ? 1 : 0.5
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative z-10 flex items-center justify-center"
    >
      <div className={`transition-colors ${
        isActive 
          ? 'text-gray-800 dark:text-gray-100' 
          : 'text-gray-500 dark:text-neutral-500'
      }`}>
        {icon}
      </div>
    </motion.div>
  </motion.div>
);

// Component for the control buttons
const ControlButton = ({ icon, onClick, hasIndicator, indicatorColor }: { 
  icon: React.ReactNode; 
  onClick?: () => void; 
  hasIndicator?: boolean;
  indicatorColor?: string;
}) => (
  <motion.div 
    whileHover={{ scale: 1.1 }} 
    whileTap={{ scale: 0.9 }}
    className="w-9 h-9 rounded-full bg-white/40 dark:bg-neutral-900/40 border border-white/20 dark:border-neutral-800/50 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex items-center justify-center cursor-pointer relative"
    onClick={onClick}
  >
    {hasIndicator && (
      <div className={`absolute w-[6px] h-[6px] rounded-full ${indicatorColor} right-[2px] top-[2px]`}>
        <div className={`absolute inset-0 rounded-full ${indicatorColor} animate-ping`} />
      </div>
    )}
    {icon}
  </motion.div>
);

// Main layout component
export default function BaseLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [rotation, setRotation] = useState(0);
  const [isNetwork, setIsNetwork] = useState(false);
  const [activeRoute, setActiveRoute] = useState<Route>('new-chat');
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);

  // Rotation animation effect
  useEffect(() => {
    let animationFrameId: number;
    let startTime: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      setRotation((progress / 180000) * 360 % 360);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // Effect to handle mode changes
  useEffect(() => {
    // Reset session and route when mode changes
    setActiveSession(null);
    setActiveRoute(isNetwork ? 'configuration' : 'new-chat');
  }, [isNetwork]);

  // Function to handle session selection
  const handleSessionSelect = (session: ChatSession) => {
    setActiveSession(session);
    setActiveRoute('new-chat');
  };

  // Function to handle new chat
  const handleNewChat = () => {
    setActiveSession(null);
    setActiveRoute('new-chat');
  };

  // Function to render the active screen
  const renderActiveScreen = () => {
    switch (activeRoute) {
      // Inference Mode Screens
      case 'new-chat':
        return <NewChatScreen currentSession={activeSession} onSessionCreate={handleSessionSelect} />;
      case 'new-agent':
        return <NewAgentScreen />;
      case 'browse-agents':
        return <BrowseAgentsScreen />;
      
      // Operator Mode Screens
      case 'configuration':
        return <ConfigurationScreen />;
      case 'connections':
        return <ConnectionsScreen />;
      case 'status':
        return <StatusScreen />;
      
      default:
        return <NewChatScreen currentSession={activeSession} onSessionCreate={handleSessionSelect} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#f7f5f4] dark:bg-black overflow-hidden">
      {/* Title bar safe area */}
      <div className="absolute top-0 left-0 right-0 h-8 draglayer" />

      <RotatingBackground rotation={rotation} />

      {/* Main container */}
      <div className="relative flex w-full h-full z-10 p-4 sm:p-6 md:p-8">
        <div className="flex w-full h-full gap-4 sm:gap-6 md:gap-8">
          {/* Sidebar */}
          <motion.div 
            className="w-[240px] flex-shrink-0 flex flex-col"
            variants={sidebarVariants}
            initial="hidden"
            animate="show"
          >
            <div className="h-8" />
            <LogoSection />

            {/* Navigation */}
            <motion.nav 
              className="flex-1 px-2 mt-4 space-y-1"
              variants={itemVariants}
            >
              {!isNetwork ? (
                <InferenceModeNav 
                  setActiveRoute={setActiveRoute} 
                  onSessionSelect={handleSessionSelect}
                  onNewChat={handleNewChat}
                  activeSession={activeSession}
                  activeRoute={activeRoute}
                />
              ) : (
                <OperatorModeNav 
                  setActiveRoute={setActiveRoute} 
                  activeRoute={activeRoute}
                />
              )}
            </motion.nav>

            <div className="flex-1" />
            <ModeSwitcher isNetwork={isNetwork} setIsNetwork={setIsNetwork} />
          </motion.div>

          {/* Main content area */}
          <div className="flex-1 flex">
            <motion.div 
              className="flex-1 flex flex-col min-w-0 bg-white/10 dark:bg-neutral-900/30 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-neutral-800/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] m-1"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.5,
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
            >
              <div className="h-8" />
              <main className="flex-1 overflow-auto">
                {renderActiveScreen()}
              </main>
            </motion.div>

            {/* Side controls */}
            <motion.div 
              className="flex flex-col ml-2 sm:ml-3 md:ml-4 h-full py-1"
              variants={itemVariants}
            >
              {/* Top controls */}
              <div className="space-y-3 mt-8">
                <Sheet>
                  <SheetTrigger asChild>
                    <div>
                      <ControlButton 
                        icon={<RadioTower className="text-emerald-500 animate-pulse w-4 h-4" />}
                        hasIndicator
                        indicatorColor="bg-emerald-500"
                      />
                    </div>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[400px] sm:w-[540px] border-0 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl shadow-[0_8px_32px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgb(0,0,0,0.1)]">
                    <SheetHeader className="px-6 pt-6">
                      <SheetTitle className="text-xl font-medium text-gray-800 dark:text-neutral-200">Node Status</SheetTitle>
                    </SheetHeader>
                    <div className="px-6">
                      <div className="h-[1px] bg-white/20 dark:bg-neutral-800/50 my-6" />
                      <div className="space-y-6">
                        <Tabs defaultValue="light" className="w-full">
                          <TabsList className="w-full grid grid-cols-2 bg-white/20 dark:bg-neutral-800/20 backdrop-blur-sm border border-white/20 dark:border-neutral-800/50 rounded-xl p-1">
                            <TabsTrigger 
                              value="light" 
                              className="rounded-lg text-sm font-medium text-gray-600 dark:text-neutral-400 data-[state=active]:bg-white/40 dark:data-[state=active]:bg-neutral-900/40 data-[state=active]:text-gray-800 dark:data-[state=active]:text-neutral-200 data-[state=active]:shadow-sm"
                            >
                              Light Node
                            </TabsTrigger>
                            <TabsTrigger 
                              value="full" 
                              className="rounded-lg text-sm font-medium text-gray-600 dark:text-neutral-400 data-[state=active]:bg-white/40 dark:data-[state=active]:bg-neutral-900/40 data-[state=active]:text-gray-800 dark:data-[state=active]:text-neutral-200 data-[state=active]:shadow-sm"
                            >
                              Full Node
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="light" className="mt-6 space-y-4">
                            {/* Light Node Content */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-neutral-400">Connection Status</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-sm font-medium text-emerald-500">Connected</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-neutral-400">Active Peers</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">24</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-neutral-400">Network Latency</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">45ms</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-neutral-400">Uptime</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">2h 34m</span>
                            </div>
                          </TabsContent>
                          <TabsContent value="full" className="mt-6 space-y-4">
                            {/* Full Node Content */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-neutral-400">Connection Status</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-sm font-medium text-emerald-500">Connected</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-neutral-400">Active Peers</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">128</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-neutral-400">Network Latency</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">35ms</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-neutral-400">Uptime</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">5h 12m</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-neutral-400">Blocks Synced</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">1,234,567</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-neutral-400">Storage Used</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">256 GB</span>
                            </div>
                          </TabsContent>
                        </Tabs>

                        {/* Network Stats */}
                        <div>
                          <h3 className="text-sm font-medium text-gray-800 dark:text-neutral-200 mb-4">Network Statistics</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-neutral-400">Messages Processed</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">1,234</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-neutral-400">Bandwidth Usage</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">2.3 GB</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-neutral-400">Success Rate</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">99.9%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                <Sheet>
                  <SheetTrigger asChild>
                    <div>
                      <ControlButton icon={<Settings className="w-4 h-4 text-gray-600 dark:text-neutral-400" />} />
                    </div>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[400px] sm:w-[540px] border-0 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl shadow-[0_8px_32px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgb(0,0,0,0.1)]">
                    <SheetHeader className="px-6 pt-6">
                      <SheetTitle className="text-xl font-medium text-gray-800 dark:text-neutral-200">Settings</SheetTitle>
                    </SheetHeader>
                    <div className="px-6">
                      <div className="h-[1px] bg-white/20 dark:bg-neutral-800/50 my-6" />
                      <div className="space-y-6">
                        {/* Settings content will go here */}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                <Dialog>
                  <DialogTrigger asChild>
                    <div>
                      <ControlButton 
                        icon={<Download className="w-4 h-4 text-gray-600 dark:text-neutral-400" />}
                        hasIndicator
                        indicatorColor="bg-blue-500"
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] border-0 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl shadow-[0_8px_32px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgb(0,0,0,0.1)]">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-medium text-gray-800 dark:text-neutral-200">Update Available</DialogTitle>
                      <DialogDescription className="text-gray-600 dark:text-neutral-400">
                        A new version of WakuAI is available. Would you like to download and install the update?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="h-[1px] bg-white/20 dark:bg-neutral-800/50 my-4" />
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-neutral-400">
                        <Download className="w-4 h-4" />
                        <span>Version 1.2.0</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-neutral-400">
                        This update includes new features, improvements, and bug fixes.
                      </p>
                    </div>
                    <DialogFooter className="mt-6">
                      <Button
                        variant="ghost"
                        className="rounded-xl bg-white/40 dark:bg-neutral-900/40 border border-white/20 dark:border-neutral-800/50 backdrop-blur-xl text-gray-600 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-neutral-900/60"
                      >
                        Later
                      </Button>
                      <Button
                        className="rounded-xl bg-blue-500/80 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-500/20"
                      >
                        Download Update
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex-1" />

              {/* Bottom controls */}
              <div className="space-y-3 mb-8">
                <ControlButton 
                  icon={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 rounded-full hover:bg-gray-100/50 dark:hover:bg-neutral-800/50 backdrop-blur-sm"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                      <AnimatePresence mode="wait">
                        {theme === "dark" ? (
                          <motion.div
                            key="sun"
                            initial={{ opacity: 0, rotate: -180 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 180 }}
                            transition={{ duration: 0.2 }}
                          >
                            <motion.div
                              className="relative z-10 flex items-center justify-center"
                              animate={{
                                scale: 1,
                                opacity: 1
                              }}
                              transition={{ duration: 0.2 }}
                            >
                              <Sun className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors" />
                            </motion.div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="moon"
                            initial={{ opacity: 0, rotate: 180 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: -180 }}
                            transition={{ duration: 0.2 }}
                          >
                            <motion.div
                              className="relative z-10 flex items-center justify-center"
                              animate={{
                                scale: 1,
                                opacity: 1
                              }}
                              transition={{ duration: 0.2 }}
                            >
                              <Moon className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors" />
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  }
                />
                <Sheet>
                  <SheetTrigger asChild>
                    <div className="w-9 h-9 rounded-full bg-white/40 dark:bg-neutral-900/40 border border-white/20 dark:border-neutral-800/50 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] overflow-hidden cursor-pointer hover:scale-105 transition-transform">
                      <img src="https://api.dicebear.com/9.x/glass/svg?seed=7" alt="avatar" className="w-full h-full" />
                    </div>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[400px] sm:w-[540px] border-0 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl shadow-[0_8px_32px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgb(0,0,0,0.1)]">
                    <SheetHeader className="px-6 pt-6">
                      <SheetTitle className="text-xl font-medium text-gray-800 dark:text-neutral-200">Profile</SheetTitle>
                    </SheetHeader>
                    <div className="px-6">
                      <div className="h-[1px] bg-white/20 dark:bg-neutral-800/50 my-6" />
                      
                      {/* Profile Content */}
                      <div className="space-y-8">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-20 h-20 rounded-full bg-white/40 dark:bg-neutral-900/40 border-2 border-white/20 dark:border-neutral-800/50 backdrop-blur-xl overflow-hidden">
                            <img src="https://api.dicebear.com/9.x/glass/svg?seed=7" alt="avatar" className="w-full h-full" />
                          </div>
                          <div className="flex items-center space-x-2 px-4 py-2 bg-white/20 dark:bg-neutral-800/20 rounded-full backdrop-blur-sm">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm font-medium text-emerald-500">Connected</span>
                          </div>
                        </div>

                        {/* Wallet Info */}
                        <div className="space-y-4">
                          <div className="flex flex-col space-y-2">
                            <span className="text-sm text-gray-600 dark:text-neutral-400">Connected Wallet</span>
                            <div className="group relative flex items-center space-x-2 p-4 bg-white/20 dark:bg-neutral-800/20 rounded-xl backdrop-blur-sm">
                              <span className="text-sm font-medium text-gray-800 dark:text-neutral-200 font-mono truncate">
                                {/* Show different lengths based on screen size */}
                                <span className="hidden sm:inline">0x71C7...976F</span>
                                <span className="sm:hidden">0x71C7...6F</span>
                              </span>
                              {/* Tooltip */}
                              <div className="absolute left-1/2 -translate-x-1/2 -top-12 px-3 py-2 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-lg border border-white/20 dark:border-neutral-800/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
                                <span className="text-xs font-mono text-gray-800 dark:text-neutral-200">0x71C7656EC7ab88b098defB751B7401B5f6d8976F</span>
                                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-white/60 dark:bg-neutral-900/60 rotate-45 border-r border-b border-white/20 dark:border-neutral-800/50"></div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Network Info */}
                          <div className="flex flex-col space-y-2">
                            <span className="text-sm text-gray-600 dark:text-neutral-400">Network</span>
                            <div className="flex items-center justify-between p-4 bg-white/20 dark:bg-neutral-800/20 rounded-xl backdrop-blur-sm">
                              <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">Ethereum Mainnet</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-sm text-emerald-500">Connected</span>
                              </div>
                            </div>
                          </div>

                          {/* Transaction History */}
                          <div className="flex flex-col space-y-2">
                            <span className="text-sm text-gray-600 dark:text-neutral-400">Recent Transactions</span>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between p-4 bg-white/20 dark:bg-neutral-800/20 rounded-xl backdrop-blur-sm">
                                <div className="flex items-center space-x-3">
                                  <Download className="w-4 h-4 text-blue-500" />
                                  <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">Received</span>
                                </div>
                                <span className="text-sm text-gray-600 dark:text-neutral-400">0.1 ETH</span>
                              </div>
                              <div className="flex items-center justify-between p-4 bg-white/20 dark:bg-neutral-800/20 rounded-xl backdrop-blur-sm">
                                <div className="flex items-center space-x-3">
                                  <Download className="w-4 h-4 text-blue-500 rotate-180" />
                                  <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">Sent</span>
                                </div>
                                <span className="text-sm text-gray-600 dark:text-neutral-400">0.05 ETH</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Disconnect Button */}
                        <Button
                          variant="ghost"
                          className="w-full rounded-xl bg-white/40 dark:bg-neutral-900/40 border border-white/20 dark:border-neutral-800/50 backdrop-blur-xl text-gray-600 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-neutral-900/60"
                        >
                          Disconnect Wallet
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Navigation item component
function NavItem({ 
  icon, 
  label, 
  route,
  currentRoute,
}: { 
  icon: React.ReactNode; 
  label: string; 
  route: Route;
  currentRoute: Route;
}) {
  const isActive = route === currentRoute;
  
  return (
    <Button 
      variant="ghost"
      className={cn(
        "w-full h-10 justify-start text-[13px] rounded-xl transition-all backdrop-blur-sm",
        isActive 
          ? "bg-gray-100/70 dark:bg-white/10 text-gray-800 dark:text-gray-100 shadow-sm" 
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-300"
      )}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </Button>
  );
}