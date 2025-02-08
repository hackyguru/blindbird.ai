import React from 'react';
import { Shuffle, Grid, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { TypeAnimation } from 'react-type-animation';

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

export default function HomePage() {
  return (
    <div className="flex flex-col h-full">
      {/* Main scrollable content */}
      <div className="flex-1 overflow-auto">
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

          {/* Chat messages will go here */}
          <div className="space-y-6 mb-24">
            {/* Messages will be rendered here */}
          </div>
        </div>
      </div>

      {/* Fixed input at bottom */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <div className="relative max-w-[800px] mx-auto">
          <div className="absolute bottom-0 left-8 right-8 h-32" />
        </div>
      </div>
      <motion.div 
        className="flex-shrink-0 relative pb-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="max-w-[800px] mx-auto px-8">
          <motion.div 
            className="bg-white/40 dark:bg-neutral-900/40 border border-white/20 dark:border-neutral-800/50 backdrop-blur-xl rounded-2xl flex items-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] pointer-events-auto"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="flex-1 relative">
              <Input
                type="text"
                className="flex-1 bg-transparent border-0 rounded-full h-12 px-6 text-sm text-gray-800 dark:text-neutral-200 placeholder-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
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
            </div>
            <div className="pr-2">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="icon"
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
      </motion.div>
    </div>
  );
}

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