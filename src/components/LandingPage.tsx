
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowRight, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface LandingPageProps {
  onGetStarted: () => void;
  onAskQuestion: (question: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onAskQuestion }) => {
  const [question, setQuestion] = useState("");

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      onAskQuestion(question.trim());
    } else {
      // If no question, just go to chat
      onGetStarted();
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in-50 slide-in-from-bottom-10">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          Axioschat
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl">
          The next generation of Web3 conversational AI, powered by the 
          <span className="font-semibold"> Flock Web3 Agent Model</span>
        </p>
        
        {/* Immediate Question Input */}
        <Card className="w-full max-w-2xl mb-8 border shadow-md bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <form onSubmit={handleSubmitQuestion} className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask anything about Web3, blockchain, or smart contracts..."
                  className="resize-none min-h-[60px] h-[60px] flex-1 bg-background/50 border-secondary/30"
                />
                <Button 
                  type="submit" 
                  className="h-[60px] min-w-[100px] flex items-center justify-center gap-2 bg-primary/90 hover:bg-primary transition-colors self-stretch"
                >
                  <Send size={16} />
                  Ask Now
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <div className="animate-bounce mt-8">
          <ArrowDown className="text-muted-foreground" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Capabilities</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              title="Web3 Knowledge" 
              description="Access comprehensive knowledge about blockchain technologies, smart contracts, and decentralized applications."
            />
            <FeatureCard 
              title="Real-time Interactions" 
              description="Connect your wallet and interact with blockchain data in real-time through natural conversation."
            />
            <FeatureCard 
              title="Developer Tools" 
              description="Get help with smart contract development, code reviews, and blockchain integration."
            />
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 text-center animate-in fade-in-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Ready to experience the future of Web3 AI?</h2>
          <p className="text-muted-foreground mb-8">
            Connect your wallet and start chatting with the most advanced Web3 AI assistant.
          </p>
          <Button onClick={onGetStarted} size="lg" className="px-8 gap-2 bg-primary/90 hover:bg-primary transition-all duration-300 hover:scale-105">
            Get Started Now
            <ArrowRight size={16} />
          </Button>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ title, description }: { title: string; description: string }) => (
  <div className="bg-card/80 backdrop-blur-sm border rounded-lg p-6 transition-all hover:shadow-md hover:translate-y-[-5px] duration-300 animate-in fade-in-50 slide-in-from-bottom-10">
    <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-primary to-accent/70 bg-clip-text text-transparent">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default LandingPage;
