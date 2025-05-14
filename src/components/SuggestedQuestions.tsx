
import React from 'react';
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string) => void;
}

const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ onSelectQuestion }) => {
  const questions = [
    "How do I deploy a smart contract to Ethereum?",
    "Explain gas optimization techniques",
    "What are the best practices for NFT smart contracts?",
    "How can I integrate my dApp with Uniswap?",
    "Explain how to use MetaMask in a React application",
    "What are the security concerns with smart contracts?",
    "How do decentralized exchanges work?"
  ];

  return (
    <div className="bg-card border rounded-lg p-4 h-full">
      <div className="flex items-center mb-4">
        <Lightbulb className="mr-2" size={16} />
        <h3 className="text-sm font-medium">Suggested Questions</h3>
      </div>
      
      <div className="space-y-2">
        {questions.map((question, index) => (
          <Button
            key={index}
            variant="ghost"
            className="w-full justify-start text-left p-2 h-auto"
            onClick={() => onSelectQuestion(question)}
          >
            <span className="text-sm">{question}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQuestions;
