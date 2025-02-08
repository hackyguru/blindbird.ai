import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "relative inline-flex items-center justify-center rounded-xl bg-white/40 dark:bg-neutral-900/40 border border-white/20 dark:border-neutral-800/50 backdrop-blur-xl p-1",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-neutral-400 transition-all select-none",
      "hover:text-gray-900 dark:hover:text-neutral-200",
      "focus-visible:outline-none",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:text-gray-800 dark:data-[state=active]:text-neutral-200",
      "data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  >
    <motion.span 
      className="relative z-10"
      initial={{ scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {props.children}
    </motion.span>
    <motion.span
      className={cn(
        "absolute inset-0 z-0 rounded-lg",
        "bg-white/50 dark:bg-white/10",
        "backdrop-blur-sm",
        "border border-white/50 dark:border-white/[0.08]",
      )}
      initial={false}
      animate={{
        opacity: props["data-state"] === "active" ? 1 : 0,
        scale: props["data-state"] === "active" ? 1 : 0.95,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
      }}
      layoutId={`${props["data-value"]}-highlight`}
    />
  </TabsPrimitive.Trigger>
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none",
      className
    )}
    {...props}
  >
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: props["data-state"] === "active" ? 1 : 0,
        y: props["data-state"] === "active" ? 0 : 10
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 0.8
      }}
    >
      {props.children}
    </motion.div>
  </TabsPrimitive.Content>
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
