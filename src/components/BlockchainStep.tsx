import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BlockchainStepProps {
  number: string;
  title: string;
  description: string;
}

const BlockchainStep: React.FC<BlockchainStepProps> = ({ 
  number, 
  title, 
  description 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ x: 5 }}
      transition={{ duration: 0.2 }}
    >
      <div className={cn(
        "flex items-start gap-4 p-4 rounded-xl transition-all duration-300",
        isHovered 
          ? "bg-gradient-to-r from-indigo-50/80 to-purple-50/50 dark:from-indigo-900/30 dark:to-purple-900/20 shadow-sm" 
          : "bg-transparent"
      )}>
        {/* Step number with animated background */}
        <div className="relative">
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full font-bold text-white z-10 relative",
            "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20"
          )}>
            {number}
            <motion.div 
              className="absolute w-full h-full rounded-full bg-indigo-400/30 z-0"
              animate={{ 
                scale: isHovered ? [1, 1.15, 1] : 1,
              }}
              transition={{ 
                duration: 1.5, 
                repeat: isHovered ? Infinity : 0,
                repeatType: "loop" 
              }}
            />
          </div>
          {/* Connecting line to next step */}
          <div className="absolute left-1/2 -translate-x-1/2 top-10 w-0.5 h-6 bg-gradient-to-b from-indigo-500/50 to-transparent"></div>
        </div>
        
        {/* Step content */}
        <div className="flex-1">
          <h4 className={cn(
            "text-lg font-semibold mb-1 transition-colors duration-300",
            isHovered 
              ? "text-indigo-600 dark:text-indigo-400" 
              : "text-foreground"
          )}>
            {title}
          </h4>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default BlockchainStep; 