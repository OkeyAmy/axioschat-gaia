
import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronLeft, LightbulbIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestedQuestionsCollapsibleProps {
  onSelectQuestion: (question: string) => void;
}

const SuggestedQuestionsCollapsible: React.FC<SuggestedQuestionsCollapsibleProps> = ({ onSelectQuestion }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Example categories and questions
  const categories = [
    {
      name: "Smart Contracts",
      questions: [
        "How do I deploy a smart contract?",
        "What are common security vulnerabilities?",
        "How do I verify my contract on Etherscan?"
      ]
    },
    {
      name: "DeFi",
      questions: [
        "How do lending protocols work?",
        "What is yield farming?",
        "Explain impermanent loss"
      ]
    },
    {
      name: "NFTs",
      questions: [
        "How do I mint an NFT collection?",
        "What are the benefits of ERC721 vs ERC1155?",
        "How do I add metadata to my NFTs?"
      ]
    }
  ];

  return (
    <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
      <div className={cn(
        "bg-card border rounded-lg h-full transition-all duration-300",
        isCollapsed ? "w-14" : "w-full"
      )}>
        <div className="p-4 flex items-center justify-between">
          {!isCollapsed && <h3 className="text-sm font-medium">Suggested Questions</h3>}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto">
              {isCollapsed ? <LightbulbIcon size={16} /> : <ChevronLeft size={16} />}
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="p-4 space-y-4">
              {categories.map((category) => (
                <Card key={category.name} className="border shadow-sm">
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="space-y-2">
                      {category.questions.map((question) => (
                        <Button 
                          key={question} 
                          variant="ghost" 
                          className="w-full justify-start text-sm h-auto py-2 font-normal"
                          onClick={() => onSelectQuestion(question)}
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default SuggestedQuestionsCollapsible;
