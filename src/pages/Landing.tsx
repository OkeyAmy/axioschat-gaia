"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Send, Sparkles, Brain, Rocket, Database, Code, Bot, ChevronRight, BadgeCheck, Zap, ChevronDown, BookOpen, Repeat, Shield, Coins, CheckCircle, XCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import Header from "@/components/Header"
import { cn } from "@/lib/utils"

const Landing = () => {
  const [question, setQuestion] = useState("")
  const navigate = useNavigate()

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    const params = question.trim() ? `?question=${encodeURIComponent(question.trim())}` : ""
    navigate(`/chat${params}`)
  }

  const handleGetStarted = () => {
    navigate("/chat")
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-background/95">
      <Header />
      <div className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center py-16 md:py-24 px-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-xl shadow-purple-500/20 animate-float">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
            AxiosChat
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl">
            The next generation of Web3 conversational AI, powered by
            <span className="font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent"> Qwen technology by Gaia Network</span>
          </p>

          {/* Immediate Question Input */}
          <Card className="w-full max-w-2xl mb-10 border shadow-lg rounded-2xl bg-background/70 backdrop-blur-md animate-fade-in">
            <CardContent className="p-5">
              <form onSubmit={handleSubmitQuestion} className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask anything about Web3, blockchain, or smart contracts..."
                    className="resize-none min-h-[60px] flex-1 rounded-xl border-muted-foreground/20 focus-visible:ring-indigo-500"
                  />
                  <Button 
                    type="submit" 
                    className="h-full min-w-[100px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium shadow-md"
                  >
                    <Send size={16} />
                    Ask
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <Badge icon={Zap} text="Lightning Fast" />
            <Badge icon={Brain} text="Advanced AI" />
            <Badge icon={BadgeCheck} text="Secure & Private" />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gradient-to-b from-muted/30 to-background/90 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-indigo-500 blur-3xl" />
            <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-purple-500 blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-block p-2 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 mb-4 backdrop-blur-sm">
                <Bot className="h-7 w-7 text-indigo-500" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Powerful Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Experience the most advanced AI tools for Web3 exploration and development
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={Brain}
                title="Web3 Knowledge"
                description="Access comprehensive knowledge about blockchain technologies, smart contracts, and decentralized applications."
                delay="0ms"
                tagLabel="Most Popular"
              />
              <FeatureCard
                icon={Database}
                title="Real-time Interactions"
                description="Connect your wallet and interact with blockchain data in real-time through natural conversation."
                delay="150ms"
                tagLabel="New"
              />
              <FeatureCard
                icon={Code}
                title="Developer Tools"
                description="Get help with smart contract development, code reviews, and blockchain integration."
                delay="300ms"
                tagLabel="Advanced"
              />
            </div>
          </div>
        </section>

        {/* Learn Section */}
        <section className="py-24 px-4 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-full h-full bg-gradient-to-b from-background via-indigo-500/5 to-background opacity-70" />
            <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="decorative-lines opacity-10" />
          </div>

          <div className="container mx-auto max-w-7xl relative z-10">
            <div className="text-center mb-16">
              <div className="inline-block p-2 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 mb-4 backdrop-blur-sm">
                <BookOpen className="h-7 w-7 text-purple-500" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-indigo-400 to-purple-600 bg-clip-text text-transparent">Explore Web3 Concepts</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Dive into the world of decentralized technologies with our interactive learning resources
              </p>
            </div>

            {/* Interactive Learning Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
              <LearningTab 
                icon={Coins}
                title="Cryptocurrencies" 
                color="from-blue-500 to-indigo-600"
                active={true}
              />
              <LearningTab 
                icon={Code}
                title="Smart Contracts" 
                color="from-indigo-500 to-purple-600"
              />
              <LearningTab 
                icon={Repeat}
                title="Blockchain Basics" 
                color="from-purple-500 to-pink-600"
              />
              <LearningTab 
                icon={Shield}
                title="Web3 Security" 
                color="from-pink-500 to-red-600"
              />
            </div>

            {/* Learning Content Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-16">
              <ExpandableCard 
                title="What is a Cryptocurrency?"
                summary="Digital or virtual currencies that use cryptography for security"
                content="Cryptocurrencies are digital or virtual currencies that use cryptography for security and operate on decentralized networks based on blockchain technology. Bitcoin, created in 2009, was the first cryptocurrency and remains the most valuable. Unlike traditional currencies issued by governments (fiat money), cryptocurrencies operate without a central authority, making them theoretically immune to government interference or manipulation."
                delay="0ms"
              />
              
              <ExpandableCard 
                title="Types of Crypto Tokens"
                summary="Different classifications of tokens and their use cases"
                content="Crypto tokens can be classified into several categories: Payment tokens like Bitcoin used primarily as a medium of exchange, utility tokens that provide access to a product or service, security tokens that represent ownership in an asset, governance tokens that give voting rights in DAOs, and non-fungible tokens (NFTs) that represent unique digital items. Each token type serves different purposes in the blockchain ecosystem."
                delay="150ms"
              />
              
              <ExpandableCard 
                title="Understanding Wallets"
                summary="How crypto wallets work and their importance"
                content="Crypto wallets don't actually store cryptocurrencies - they store your private keys, which prove your ownership of digital assets on the blockchain. Wallets come in different forms: hardware wallets (physical devices), software wallets (desktop/mobile apps), web wallets (browser-based), and paper wallets (printed keys). Hardware wallets offer the highest security, while software wallets provide better convenience for regular transactions."
                delay="300ms"
              />
            </div>

            {/* Interactive Blockchain Visualization */}
            <div className="bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-2xl p-8 mb-16 relative overflow-hidden backdrop-blur-sm">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">How Blockchain Works</h3>
                  <p className="text-muted-foreground mb-4">
                    Blockchain is a distributed database or ledger shared among computer network nodes. It stores information electronically in digital format, maintaining a secure and decentralized record of transactions.
                  </p>
                  <div className="space-y-3">
                    <BlockchainStep number="01" title="Transaction Request" description="A new transaction is requested and broadcast to the peer-to-peer network." />
                    <BlockchainStep number="02" title="Block Creation" description="The transaction is bundled with others into a new block." />
                    <BlockchainStep number="03" title="Verification" description="Network nodes validate the block through consensus mechanisms like Proof of Work or Proof of Stake." />
                    <BlockchainStep number="04" title="Confirmation" description="The validated block is added to the existing blockchain, creating a permanent and immutable record." />
                  </div>
                </div>
                <div className="relative h-64 md:h-80 flex items-center justify-center">
                  <BlockchainVisualization />
                </div>
              </div>
            </div>

            {/* Learning Resources */}
            <div className="mt-16 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="text-center mb-10">
                <h3 className="text-xl md:text-2xl font-semibold mb-3">Test Your Web3 Knowledge</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Take our quick quiz to see how well you understand blockchain concepts
                </p>
              </div>
              
              <div className="max-w-3xl mx-auto">
                <QuizComponent />
              </div>
              
              <div className="text-center mt-10">
                <h3 className="text-xl md:text-2xl font-semibold mb-4">Ready to dive deeper?</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Explore our comprehensive Web3 library or ask AxiosChat any question about blockchain technology
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                  >
                    Browse Library
                  </Button>
                  <Button 
                    variant="outline" 
                    className="rounded-xl border-indigo-500/30 hover:bg-indigo-500/10"
                    onClick={handleGetStarted}
                  >
                    Ask AxiosChat
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works section */}
        <section className="py-20 px-4 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden opacity-5">
            <div className="absolute top-40 right-20 w-72 h-72 rounded-full bg-purple-500 blur-3xl" />
            <div className="absolute bottom-40 left-20 w-72 h-72 rounded-full bg-indigo-500 blur-3xl" />
          </div>

          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-16">
              <div className="inline-block p-2 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 mb-4 backdrop-blur-sm">
                <Rocket className="h-7 w-7 text-purple-500" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A simple and powerful workflow to accelerate your Web3 journey
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Connecting line on desktop */}
              <div className="hidden md:block absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-0 opacity-70" />
              
              <StepCard
                number="1"
                title="Ask Your Question"
                description="Type any blockchain or Web3 related question in natural language."
              />
              <StepCard
                number="2"
                title="Connect Your Wallet"
                description="Securely connect your wallet for real-time blockchain interactions."
              />
              <StepCard
                number="3"
                title="Get Smart Answers"
                description="Receive detailed answers and execute on-chain functions directly."
              />
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 px-4 text-center bg-gradient-to-b from-background to-muted/20">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Ready to experience the future of Web3 AI?</h2>
            <p className="text-muted-foreground mb-8">
              Connect your wallet and start chatting with the most advanced Web3 AI assistant.
            </p>
            <Button 
              onClick={handleGetStarted} 
              size="lg" 
              className="px-8 gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium shadow-md transition-all hover:shadow-lg"
            >
              Get Started Now
              <ArrowRight size={16} />
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description,
  delay,
  tagLabel
}: { 
  icon: React.ElementType,
  title: string; 
  description: string;
  delay: string;
  tagLabel?: string;
}) => (
  <div 
    className="bg-background/80 backdrop-blur-sm border border-muted-foreground/10 rounded-xl p-6 
    transition-all duration-300 hover:shadow-xl hover:border-indigo-500/30 hover:translate-y-[-4px] 
    group relative overflow-hidden animate-fade-in" 
    style={{ animationDelay: delay }}
  >
    {/* Gradient hover effect */}
    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-5 transition-all duration-300 group-hover:shadow-md relative z-10">
      <Icon className="h-6 w-6 text-white" />
    </div>
    
    {tagLabel && (
      <div className="absolute top-3 right-3 py-1 px-2 text-xs font-medium rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm">
        {tagLabel}
      </div>
    )}
    
    <h3 className="text-xl font-semibold mb-3 group-hover:text-indigo-500 transition-colors">{title}</h3>
    <p className="text-muted-foreground mb-4">{description}</p>
    
    <div className="flex items-center text-sm font-medium text-indigo-500 opacity-60 group-hover:opacity-100 transition-all group-hover:translate-x-1">
      <span>Learn more</span>
      <ChevronRight className="h-4 w-4 ml-1" />
    </div>
  </div>
)

const StepCard = ({ 
  number, 
  title, 
  description 
}: { 
  number: string; 
  title: string; 
  description: string 
}) => (
  <div className="flex flex-col items-center text-center relative z-10 transition-all duration-300 hover:translate-y-[-4px]">
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg mb-6 shadow-lg hover:shadow-indigo-500/30 transition-all animate-pulse-slow relative">
      <span className="relative z-10">{number}</span>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-muted-foreground max-w-xs mx-auto">{description}</p>
    <div className="mt-4 p-3 rounded-xl bg-muted/50 hover:bg-muted/90 transition-colors w-full max-w-[220px] mx-auto opacity-0 hover:opacity-100">
      <div className="text-xs text-center text-muted-foreground">
        {number === "1" && "Ask directly on the landing page"}
        {number === "2" && "Uses secure Web3 protocols"}
        {number === "3" && "Powered by Qwen AI via Gaia Network"}
      </div>
    </div>
  </div>
)

const Badge = ({ 
  icon: Icon, 
  text 
}: {
  icon: React.ElementType,
  text: string
}) => (
  <div className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-3 py-1.5 rounded-full text-sm font-medium">
    <Icon className="h-3.5 w-3.5 text-indigo-500" />
    <span>{text}</span>
  </div>
)

const LearningTab = ({ 
  icon: Icon,
  title,
  color,
  active = false
}: { 
  icon: React.ElementType,
  title: string,
  color: string,
  active?: boolean
}) => (
  <div 
    className={cn(
      "rounded-xl p-4 text-center transition-all duration-300 cursor-pointer hover:shadow-md",
      active 
        ? `bg-gradient-to-r ${color} text-white shadow-lg` 
        : "bg-background/80 border border-muted-foreground/10 hover:border-indigo-500/30"
    )}
  >
    <div className="flex items-center justify-center mb-2">
      <Icon className={cn(
        "h-6 w-6", 
        active ? "text-white" : "text-indigo-500"
      )} />
    </div>
    <h3 className="font-medium">{title}</h3>
  </div>
)

const ExpandableCard = ({
  title,
  summary,
  content,
  delay
}: {
  title: string,
  summary: string,
  content: string,
  delay: string
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div 
      className={cn(
        "rounded-xl bg-background/80 backdrop-blur-sm border border-muted-foreground/10 overflow-hidden transition-all duration-300 animate-fade-in",
        isExpanded ? "shadow-lg" : "hover:shadow-md"
      )}
      style={{ animationDelay: delay }}
    >
      <div 
        className="p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold">{title}</h3>
          <ChevronDown className={cn(
            "h-5 w-5 text-muted-foreground transition-transform", 
            isExpanded ? "transform rotate-180" : ""
          )} />
        </div>
        <p className="text-muted-foreground">{summary}</p>
      </div>
      
      <div 
        className={cn(
          "px-6 overflow-hidden transition-all duration-300",
          isExpanded ? "max-h-64 pb-6" : "max-h-0"
        )}
      >
        <div className="pt-2 border-t border-muted-foreground/10">
          <p className="text-foreground/80 leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  )
}

const BlockchainStep = ({
  number,
  title,
  description
}: {
  number: string,
  title: string,
  description: string
}) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
      {number}
    </div>
    <div>
      <h4 className="font-medium">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
)

const BlockchainVisualization = () => {
  const blocks = Array(6).fill(0);
  return (
    <div className="relative w-full max-w-md mx-auto">
      {blocks.map((_, index) => (
        <div 
          key={index}
          className="absolute transform transition-all duration-1000"
          style={{
            top: `${10 + (index * 10)}%`,
            left: index % 2 === 0 ? '5%' : '20%',
            zIndex: blocks.length - index,
            animation: `float ${4 + index * 0.5}s ease-in-out infinite ${index * 0.3}s`
          }}
        >
          <BlockModel index={index} />
        </div>
      ))}
      
      {/* Connecting lines */}
      <svg className="absolute inset-0 w-full h-full z-0 opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path 
          d="M30,15 L40,25 L50,35 L60,45 L70,55 L80,65" 
          fill="none" 
          stroke="url(#gradient)" 
          strokeWidth="0.5" 
          strokeDasharray="2 1"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

const BlockModel = ({ index }: { index: number }) => {
  return (
    <div 
      className={`relative w-48 h-20 rounded-xl bg-gradient-to-r shadow-lg transform transition-all duration-300 group hover:scale-105 cursor-pointer backdrop-blur-sm border border-white/10
        ${index === 0 ? 'from-blue-500 to-indigo-600' :
          index === 1 ? 'from-indigo-500 to-purple-600' :
          index === 2 ? 'from-purple-500 to-pink-600' :
          index === 3 ? 'from-pink-500 to-rose-600' :
          index === 4 ? 'from-rose-500 to-orange-600' : 'from-orange-500 to-amber-600'
        }`}
    >
      <div className="p-3 text-white">
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono opacity-80">Block #{index + 1}</span>
          <span className="text-xs font-mono opacity-80">Hash: {index}f8c...</span>
        </div>
        <div className="mt-2 flex gap-2">
          <div className="w-3 h-3 rounded-full bg-white/30" />
          <div className="w-3 h-3 rounded-full bg-white/30" />
          <div className="w-3 h-3 rounded-full bg-white/30" />
        </div>
        <div className="absolute bottom-2 right-3 text-xs font-mono opacity-0 group-hover:opacity-80 transition-opacity">
          Transactions: {5 + index}
        </div>
      </div>
    </div>
  )
}

const QuizComponent = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  
  const questions = [
    {
      question: "What is the primary purpose of blockchain technology?",
      options: [
        "To create cryptocurrencies",
        "To create a decentralized, immutable ledger",
        "To replace banks and financial institutions",
        "To increase internet speed"
      ],
      correctAnswer: 1
    },
    {
      question: "What does NFT stand for?",
      options: [
        "New Financial Technology",
        "Non-Fungible Token",
        "Network File Transfer",
        "New Format Type"
      ],
      correctAnswer: 1
    },
    {
      question: "Which consensus mechanism does Bitcoin use?",
      options: [
        "Proof of Stake",
        "Proof of Authority",
        "Proof of Work",
        "Delegated Proof of Stake"
      ],
      correctAnswer: 2
    }
  ];
  
  const handleAnswerClick = (answerIndex: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    
    if (answerIndex === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
    
    // Wait before moving to next question
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setIsAnswered(false);
      } else {
        setShowResults(true);
      }
    }, 1500);
  };
  
  const resetQuiz = () => {
    setCurrentQuestion(0);
    setShowResults(false);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
  };
  
  if (showResults) {
    return (
      <div className="bg-background/80 backdrop-blur-sm rounded-xl p-8 border border-indigo-500/20 shadow-lg animate-fade-in">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-4">Quiz Results</h3>
          <p className="text-xl mb-6">
            You scored <span className="font-bold text-indigo-500">{score}</span> out of {questions.length}
          </p>
          <p className="text-muted-foreground mb-6">
            {score === questions.length ? 
              "Perfect score! You're a Web3 expert!" : 
              score >= questions.length / 2 ? 
                "Great job! You have a good understanding of Web3 concepts." : 
                "Good try! Keep learning more about Web3 technologies."}
          </p>
          <Button
            onClick={resetQuiz}
            className="mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
          >
            Take Quiz Again
          </Button>
        </div>
      </div>
    );
  }
  
  const currentQ = questions[currentQuestion];
  
  return (
    <div className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-muted-foreground/10 shadow-md animate-fade-in">
      <div className="mb-6 flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">
          Question {currentQuestion + 1} of {questions.length}
        </span>
        <span className="text-sm font-medium text-muted-foreground">
          Score: {score}
        </span>
      </div>
      
      <h3 className="text-xl font-semibold mb-6">{currentQ.question}</h3>
      
      <div className="space-y-3">
        {currentQ.options.map((option, index) => (
          <div 
            key={index}
            onClick={() => handleAnswerClick(index)}
            className={cn(
              "p-4 border rounded-lg cursor-pointer transition-all duration-200",
              isAnswered && index === selectedAnswer && index === currentQ.correctAnswer 
                ? "border-green-500 bg-green-500/10" 
                : isAnswered && index === selectedAnswer 
                ? "border-red-500 bg-red-500/10" 
                : isAnswered && index === currentQ.correctAnswer
                ? "border-green-500 bg-green-500/10"
                : selectedAnswer === index
                ? "border-indigo-500 bg-indigo-500/5"
                : "border-muted-foreground/20 hover:border-indigo-500/30 hover:bg-indigo-500/5"
            )}
          >
            <div className="flex items-center justify-between">
              <span>{option}</span>
              {isAnswered && index === currentQ.correctAnswer && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {isAnswered && index === selectedAnswer && index !== currentQ.correctAnswer && (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 mb-2 h-1 w-full bg-muted-foreground/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default Landing
