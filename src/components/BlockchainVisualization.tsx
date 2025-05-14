import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, Check, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Block {
  id: number;
  hash: string;
  prevHash: string;
  data: string;
  timestamp: string;
  verified: boolean;
}

const generateHash = (length: number = 8) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const getShortHash = (hash: string) => {
  return `#${hash.substring(0, 6)}...`;
};

const BlockchainVisualization: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [animationRunning, setAnimationRunning] = useState(false);

  // Generate initial blockchain on mount
  useEffect(() => {
    const genesisBlock: Block = {
      id: 0,
      hash: generateHash(12),
      prevHash: '0000000000000000',
      data: 'Genesis Block',
      timestamp: new Date().toISOString(),
      verified: true
    };

    const block1: Block = {
      id: 1,
      hash: generateHash(12),
      prevHash: genesisBlock.hash,
      data: 'Transaction Data #1',
      timestamp: new Date().toISOString(),
      verified: true
    };

    const block2: Block = {
      id: 2,
      hash: generateHash(12),
      prevHash: block1.hash,
      data: 'Transaction Data #2',
      timestamp: new Date().toISOString(),
      verified: true
    };

    const block3: Block = {
      id: 3,
      hash: generateHash(12),
      prevHash: block2.hash,
      data: 'Transaction Data #3',
      timestamp: new Date().toISOString(),
      verified: true
    };

    setBlocks([genesisBlock, block1, block2, block3]);

    // Start automatic animation after a delay
    const timer = setTimeout(() => {
      startBlockAnimation();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const startBlockAnimation = () => {
    setAnimationRunning(true);
    let index = 0;
    
    const interval = setInterval(() => {
      if (index >= blocks.length) {
        clearInterval(interval);
        setTimeout(() => {
          setActiveBlockIndex(null);
          setAnimationRunning(false);
        }, 1000);
        return;
      }
      
      setActiveBlockIndex(index);
      index++;
    }, 1500);

    return () => clearInterval(interval);
  };

  const addNewBlock = () => {
    if (blocks.length > 0 && !animationRunning) {
      const lastBlock = blocks[blocks.length - 1];
      const newBlock: Block = {
        id: lastBlock.id + 1,
        hash: generateHash(12),
        prevHash: lastBlock.hash,
        data: `Transaction Data #${lastBlock.id + 1}`,
        timestamp: new Date().toISOString(),
        verified: true
      };
      
      setBlocks([...blocks, newBlock]);
      
      // Animate to show the new block being added
      setTimeout(() => {
        setActiveBlockIndex(blocks.length);
        
        setTimeout(() => {
          setActiveBlockIndex(null);
        }, 1500);
      }, 100);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative w-full">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-64 h-64 -top-10 -right-10 rounded-full bg-indigo-500/5 blur-3xl" />
        <div className="absolute w-64 h-64 -bottom-10 -left-10 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      {/* Main container */}
      <div className="w-full relative">
        {/* Toggle details button */}
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="absolute top-0 right-0 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-full px-2 py-1 font-medium z-20"
        >
          {showDetails ? "Hide" : "Show"} Details
        </button>

        {/* Add block button */}
        <button 
          onClick={addNewBlock}
          disabled={animationRunning}
          className={cn(
            "absolute bottom-0 right-0 text-xs rounded-full px-3 py-1.5 font-medium z-20 transition-colors",
            "border border-indigo-200 dark:border-indigo-800/30",
            animationRunning 
              ? "bg-gray-100 dark:bg-gray-800 text-muted-foreground cursor-not-allowed" 
              : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/30"
          )}
        >
          Add Block
        </button>

        {/* Blocks visualization */}
        <div className="flex flex-col items-center justify-center relative">
          <AnimatePresence>
            {blocks.map((block, index) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  scale: activeBlockIndex === index ? 1.05 : 1,
                  borderColor: activeBlockIndex === index ? 'rgba(99, 102, 241, 0.8)' : ''
                }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.15,
                  ease: "easeOut"
                }}
                className={cn(
                  "w-full max-w-lg mb-4 relative",
                  index === blocks.length - 1 && "mb-0"
                )}
              >
                {/* Connection line */}
                {index < blocks.length - 1 && (
                  <div className="absolute w-0.5 h-4 bg-gradient-to-b from-indigo-400 to-indigo-300 dark:from-indigo-600 dark:to-indigo-700 left-1/2 -translate-x-1/2 -bottom-4 z-0" />
                )}

                {/* Block */}
                <div 
                  className={cn(
                    "rounded-xl border border-indigo-200/50 dark:border-indigo-800/30 bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-900 dark:to-indigo-950/20",
                    "shadow-sm hover:shadow-md transition-all duration-300 p-4 relative overflow-hidden",
                    activeBlockIndex === index && "border-indigo-500 shadow-lg shadow-indigo-500/10"
                  )}
                >
                  {/* Background decorative elements */}
                  <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
                    <div className="absolute w-20 h-20 -top-5 -right-5 rounded-full bg-indigo-300/10 dark:bg-indigo-700/10" />
                    <div className="absolute w-16 h-16 -bottom-5 -left-5 rounded-full bg-purple-300/10 dark:bg-purple-700/10" />
                  </div>

                  {/* Block header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center text-white",
                        "bg-gradient-to-br from-indigo-500 to-purple-500"
                      )}>
                        <Database size={12} />
                      </div>
                      <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Block #{block.id}</h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="text-xs text-muted-foreground">{formatTimestamp(block.timestamp)}</div>
                      {block.verified && (
                        <div className="bg-green-500/10 text-green-500 rounded-full p-0.5">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Block content */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="text-xs font-medium flex items-center gap-1 text-indigo-500 dark:text-indigo-400">
                      <Lock size={12} />
                      Hash: <span className="font-mono">{getShortHash(block.hash)}</span>
                    </div>
                    {showDetails && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <ArrowRight size={10} />
                        Prev: <span className="font-mono">{getShortHash(block.prevHash)}</span>
                      </div>
                    )}
                  </div>

                  {/* Block data */}
                  {showDetails && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 p-2 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-md border border-indigo-100/50 dark:border-indigo-800/20"
                    >
                      <div className="text-xs font-mono text-muted-foreground">
                        {block.data}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default BlockchainVisualization; 