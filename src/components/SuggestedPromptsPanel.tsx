import React, { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area"; 
import { Button } from "@/components/ui/button";
import { Lightbulb, ChevronRight, ChevronLeft, BookOpen, Star, Sparkles, MessageSquarePlus, Braces } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Removed framer-motion dependency completely for stability

interface SuggestedPromptsPanelProps {
  onSelectQuestion: (question: string) => void;
  onCollapseChange?: (collapsed: boolean) => void;
  defaultCollapsed?: boolean;
}

// Define categories of suggested prompts
const PROMPT_CATEGORIES = {
  blockchain: [
    "What is a blockchain consensus mechanism?",
    "Explain the difference between PoW and PoS",
    "How do layer 2 scaling solutions work?",
    "What determines transaction fees in Ethereum?",
    "How does sharding improve blockchain scalability?"
  ],
  development: [
    "How do I deploy a smart contract?",
    "What are events in Solidity?",
    "How do I implement ERC721 vs ERC1155?",
    "What's the best practice for gas optimization?",
    "How do I securely generate random numbers in Solidity?"
  ],
  defi: [
    "How do lending protocols work?",
    "Explain impermanent loss in DeFi",
    "What is yield farming?",
    "How do oracles like Chainlink work?",
    "What are risks with algorithmic stablecoins?"
  ]
};

const SuggestedPromptsPanel: React.FC<SuggestedPromptsPanelProps> = ({ 
  onSelectQuestion, 
  onCollapseChange,
  defaultCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [activeCategory, setActiveCategory] = useState<'blockchain' | 'development' | 'defi'>('blockchain');
  const [hoveredPrompt, setHoveredPrompt] = useState<string | null>(null);

  const handleCollapseChange = (collapsed: boolean) => {
    try {
      setIsCollapsed(collapsed);
      if (onCollapseChange) {
        onCollapseChange(collapsed);
      }
    } catch (error) {
      console.error('Error changing collapse state:', error);
    }
  };

  const handlePromptClick = (prompt: string) => {
    try {
      onSelectQuestion(prompt);
    } catch (error) {
      console.error('Error selecting question:', error);
    }
  };

  if (isCollapsed) {
  return (
      <div className="h-full border rounded-lg flex flex-col">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => handleCollapseChange(false)}
          className="h-full w-full rounded-none flex items-center justify-center"
        >
          <ChevronLeft size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border rounded-lg overflow-hidden bg-background/50 backdrop-blur-sm">
      <div className="p-3 border-b flex justify-between items-center bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Prompt Ideas
          </h3>
        </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCollapseChange(true)}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

      <Tabs defaultValue="blockchain" className="flex-1 flex flex-col">
        <TabsList className="px-3 pt-3 pb-0 justify-center bg-transparent h-auto gap-1">
          <TabsTrigger 
            value="blockchain" 
            onClick={() => setActiveCategory('blockchain')}
            className={cn(
              "text-xs rounded-lg data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-500 dark:data-[state=active]:text-indigo-400",
              "flex gap-1 items-center h-8"
            )}
          >
            <BookOpen className="h-3 w-3" />
            <span>Blockchain</span>
          </TabsTrigger>
          <TabsTrigger 
            value="development" 
            onClick={() => setActiveCategory('development')}
            className={cn(
              "text-xs rounded-lg data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-500 dark:data-[state=active]:text-purple-400",
              "flex gap-1 items-center h-8"
            )}
          >
            <Braces className="h-3 w-3" />
            <span>Dev</span>
          </TabsTrigger>
          <TabsTrigger 
            value="defi" 
            onClick={() => setActiveCategory('defi')}
            className={cn(
              "text-xs rounded-lg data-[state=active]:bg-pink-500/10 data-[state=active]:text-pink-500 dark:data-[state=active]:text-pink-400",
              "flex gap-1 items-center h-8"
            )}
          >
            <Star className="h-3 w-3" />
            <span>DeFi</span>
          </TabsTrigger>
        </TabsList>

        <div className="px-3 py-2">
                      <Button 
            variant="outline"
            size="sm"
            onClick={() => handlePromptClick("How can you help me with Web3 development?")}
            className="w-full text-xs h-auto py-2 border-dashed border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-100/50 dark:hover:bg-indigo-800/30 text-indigo-600 dark:text-indigo-400"
          >
            <MessageSquarePlus className="h-3.5 w-3.5 mr-2" />
            <span>Start a conversation</span>
          </Button>
        </div>
        
        <ScrollArea className="flex-1 px-3 pb-3">
          <TabsContent 
            value="blockchain" 
            className="mt-0 data-[state=active]:mt-2 space-y-2"
          >
            {PROMPT_CATEGORIES.blockchain.map((prompt) => (
              <div
                        key={prompt} 
                className="transition-colors duration-200"
              >
                <Button 
                        variant="outline" 
                  size="sm"
                  className={cn(
                    "justify-start text-xs h-auto py-2.5 px-3 font-normal w-full",
                    "bg-gradient-to-r from-background to-indigo-50/30 dark:from-background dark:to-indigo-900/10",
                    "border-indigo-100 dark:border-indigo-800/20 hover:border-indigo-300 dark:hover:border-indigo-700",
                    "hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all duration-200",
                    "text-left rounded-lg group",
                    hoveredPrompt === prompt && "shadow-md border-indigo-200 dark:border-indigo-700/40"
                  )}
                  onMouseEnter={() => setHoveredPrompt(prompt)}
                  onMouseLeave={() => setHoveredPrompt(null)}
                  onClick={() => handlePromptClick(prompt)}
                      >
                        <div className="flex items-start gap-2 w-full">
                    <Lightbulb 
                      size={14} 
                      className={cn(
                        "mt-0.5 text-indigo-500 flex-shrink-0 transition-all",
                        hoveredPrompt === prompt ? "text-indigo-600 dark:text-indigo-400" : "text-indigo-400 dark:text-indigo-500/70"
                      )} 
                    />
                    <span className="break-words whitespace-normal text-muted-foreground group-hover:text-foreground transition-colors">{prompt}</span>
                        </div>
                      </Button>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent 
            value="development" 
            className="mt-0 data-[state=active]:mt-2 space-y-2"
          >
            {PROMPT_CATEGORIES.development.map((prompt) => (
              <div
                key={prompt}
                className="transition-colors duration-200"
              >
                <Button 
                  variant="outline" 
                  size="sm"
                  className={cn(
                    "justify-start text-xs h-auto py-2.5 px-3 font-normal w-full",
                    "bg-gradient-to-r from-background to-purple-50/30 dark:from-background dark:to-purple-900/10",
                    "border-purple-100 dark:border-purple-800/20 hover:border-purple-300 dark:hover:border-purple-700",
                    "hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-all duration-200",
                    "text-left rounded-lg group",
                    hoveredPrompt === prompt && "shadow-md border-purple-200 dark:border-purple-700/40"
                  )}
                  onMouseEnter={() => setHoveredPrompt(prompt)}
                  onMouseLeave={() => setHoveredPrompt(null)}
                  onClick={() => handlePromptClick(prompt)}
                >
                  <div className="flex items-start gap-2 w-full">
                    <Braces 
                      size={14} 
                      className={cn(
                        "mt-0.5 flex-shrink-0 transition-all",
                        hoveredPrompt === prompt ? "text-purple-600 dark:text-purple-400" : "text-purple-400 dark:text-purple-500/70"
                      )} 
                    />
                    <span className="break-words whitespace-normal text-muted-foreground group-hover:text-foreground transition-colors">{prompt}</span>
                  </div>
                </Button>
                </div>
              ))}
          </TabsContent>
          
          <TabsContent 
            value="defi" 
            className="mt-0 data-[state=active]:mt-2 space-y-2"
          >
            {PROMPT_CATEGORIES.defi.map((prompt) => (
              <div
                key={prompt}
                className="transition-colors duration-200"
              >
                <Button 
                  variant="outline" 
                  size="sm"
                  className={cn(
                    "justify-start text-xs h-auto py-2.5 px-3 font-normal w-full",
                    "bg-gradient-to-r from-background to-pink-50/30 dark:from-background dark:to-pink-900/10",
                    "border-pink-100 dark:border-pink-800/20 hover:border-pink-300 dark:hover:border-pink-700",
                    "hover:bg-pink-50/50 dark:hover:bg-pink-900/20 transition-all duration-200",
                    "text-left rounded-lg group",
                    hoveredPrompt === prompt && "shadow-md border-pink-200 dark:border-pink-700/40"
                  )}
                  onMouseEnter={() => setHoveredPrompt(prompt)}
                  onMouseLeave={() => setHoveredPrompt(null)}
                  onClick={() => handlePromptClick(prompt)}
                >
                  <div className="flex items-start gap-2 w-full">
                    <Star 
                      size={14} 
                      className={cn(
                        "mt-0.5 flex-shrink-0 transition-all",
                        hoveredPrompt === prompt ? "text-pink-600 dark:text-pink-400" : "text-pink-400 dark:text-pink-500/70"
                      )} 
                    />
                    <span className="break-words whitespace-normal text-muted-foreground group-hover:text-foreground transition-colors">{prompt}</span>
                  </div>
                </Button>
            </div>
            ))}
          </TabsContent>
          </ScrollArea>
      </Tabs>
    </div>
  );
};

export default SuggestedPromptsPanel;
