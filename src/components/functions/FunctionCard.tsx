import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon, ChevronDown, ChevronUp, Sparkles, ExternalLink, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

interface FunctionCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  badge?: {
    text: string;
    variant?: "default" | "outline" | "secondary" | "beta" | "new";
  };
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  infoLink?: string;
  infoText?: string;
}

export const FunctionCard: React.FC<FunctionCardProps> = ({
  title,
  description,
  icon: Icon,
  children,
  className,
  footer,
  badge,
  collapsible = false,
  defaultCollapsed = false,
  infoLink,
  infoText
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isHovered, setIsHovered] = useState(false);

  const getBadgeStyles = (variant: string = "default") => {
    switch (variant) {
      case "beta":
        return "bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20";
      case "new":
        return "bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20";
      case "outline":
        return "bg-background text-muted-foreground border-border hover:bg-accent";
      case "secondary":
        return "bg-secondary text-secondary-foreground hover:bg-secondary/80";
      default:
        return "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn("overflow-hidden", className)}
    >
      <Card 
        className={cn(
          "overflow-hidden border border-transparent transition-all duration-300",
          "shadow-sm hover:shadow-md",
          isHovered 
            ? "border-indigo-200/50 dark:border-indigo-800/30 bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-900 dark:to-indigo-950/20" 
            : "border-border bg-card"
        )}
      >
        <CardHeader className={cn(
          "p-5 pb-0 flex flex-row items-start justify-between gap-4",
          collapsible && "cursor-pointer",
        )} 
          onClick={collapsible ? () => setIsCollapsed(prev => !prev) : undefined}
        >
          <div className="flex items-start gap-3">
            {Icon && (
              <div className={cn(
                "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                isHovered
                  ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-indigo-100/60 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-300"
              )}>
                <Icon size={20} className="transition-transform duration-300 ease-in-out" 
                  style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
                />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                {badge && (
                  <Badge variant="outline" className={cn(
                    "ml-2 text-xs py-0 px-2 font-normal", 
                    getBadgeStyles(badge.variant)
                  )}>
                    {badge.text}
                  </Badge>
                )}
              </div>
              {description && (
                <CardDescription className="text-sm mt-1">{description}</CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {infoLink && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full hover:bg-indigo-100/60 dark:hover:bg-indigo-900/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(infoLink, '_blank');
                      }}
                    >
                      <Info size={16} className="text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{infoText || "Learn more"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {collapsible && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-indigo-100/60 dark:hover:bg-indigo-900/30"
              >
                {isCollapsed ? (
                  <ChevronDown size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronUp size={16} className="text-muted-foreground" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="p-5 pt-5">
                {children}
              </CardContent>
              
              {footer && (
                <CardFooter className="px-5 py-4 bg-muted/20 border-t flex items-center justify-between">
                  {footer}
                </CardFooter>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};
