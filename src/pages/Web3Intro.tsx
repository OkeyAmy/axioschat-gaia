"use client"

import React, { useState, useEffect, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import Header from "@/components/Header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BarChart3,
  Coins,
  ExternalLink,
  GanttChart,
  Lightbulb,
  LinkIcon,
  Lock,
  Send,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Wallet,
  Code,
  Brain,
  School,
  MessageSquare,
} from "lucide-react"
import SuggestedPromptsPanel from "@/components/SuggestedPromptsPanel"
import TransactionQueue from "@/components/TransactionQueue"
import { cn } from "@/lib/utils"
import useApiKeys from "@/hooks/useApiKeys"
import { toast } from "@/components/ui/use-toast"
import ModelSelector from "@/components/ModelSelector"
import FunctionQueue from "@/components/FunctionQueue"
import { useAccount } from "wagmi"
import { Checkbox } from "@/components/ui/checkbox"
import {
  callLlama,
  callOpenAI,
  parseLlamaResponse,
  createFunctionCall,
  isReadOnlyFunction,
  type ChatMessage,
  type FunctionCall,
} from "@/services/aiService"

type DeFiSection = {
  id: string
  name: string
  icon: React.ElementType
  description: string
  concepts: Array<{
    title: string
    description: string
    resources: Array<{
      name: string
      url: string
      description: string
    }>
  }>
  suggestedQuestions: string[]
  systemPrompt?: string
}

type Message = {
  role: "user" | "assistant" | "system" | "function"
  content: string
  name?: string
}

const Web3Intro: React.FC = () => {
  const { address, isConnected } = useAccount()
  const [messageInput, setMessageInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Welcome to Web3 Intro! What would you like to learn about DeFi today?" },
  ])
  const [functionCalls, setFunctionCalls] = useState<FunctionCall[]>([])
  const [activeSection, setActiveSection] = useState("intro")
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(window.innerWidth < 1200)
  const [isSuggestionsCollapsed, setIsSuggestionsCollapsed] = useState(window.innerWidth < 1400)
  const [isProcessing, setIsProcessing] = useState(false)
  const [useLocalAI, setUseLocalAI] = useState(true)
  const [localEndpoint, setLocalEndpoint] = useState("http://localhost:11434")
  const [showEndpointSettings, setShowEndpointSettings] = useState(false)
  const [currentChain, setCurrentChain] = useState(1)
  const { apiKeys, updateApiKey } = useApiKeys()
  const [showFunctionMessages, setShowFunctionMessages] = useState(false)

  const defiSections: DeFiSection[] = [
    {
      id: "intro",
      name: "Introduction to DeFi",
      icon: Lightbulb,
      description:
        "DeFi (Decentralized Finance) is an ecosystem of financial applications built on blockchain networks. It aims to recreate traditional financial systems in a decentralized way, removing intermediaries.",
      concepts: [
        {
          title: "What is DeFi?",
          description:
            "DeFi stands for Decentralized Finance and refers to financial applications built on blockchain technologies, typically using smart contracts.",
          resources: [
            {
              name: "Ethereum.org DeFi Page",
              url: "https://ethereum.org/en/defi/",
              description: "Official Ethereum explanation of DeFi",
            },
          ],
        },
        {
          title: "Key Principles",
          description: "Permissionless, transparent, and non-custodial are the core principles of DeFi.",
          resources: [
            {
              name: "Finematics",
              url: "https://finematics.com/",
              description: "Educational website about DeFi",
            },
          ],
        },
      ],
      suggestedQuestions: [
        "What are the main benefits of DeFi?",
        "How is DeFi different from traditional finance?",
        "What are the risks associated with DeFi?",
      ],
      systemPrompt: `You are a helpful Web3 educator introducing the basics of DeFi (Decentralized Finance) to a newcomer.
      
      Explain concepts in simple terms, avoiding jargon when possible. Focus on helping the user understand the fundamental principles, benefits, and risks of DeFi.
      
      When explaining:
      - Use analogies to traditional finance when helpful
      - Highlight the key innovations of DeFi (permissionless, transparent, non-custodial)
      - Be balanced in discussing both benefits and risks
      - Provide examples of popular DeFi protocols when relevant
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`,
    },
    {
      id: "lending",
      name: "Lending & Borrowing",
      icon: LinkIcon,
      description:
        "Lending and borrowing platforms allow users to lend their cryptocurrencies and earn interest or borrow assets by providing collateral.",
      concepts: [
        {
          title: "Overcollateralization",
          description: "Most DeFi loans require users to deposit more value than they borrow as security.",
          resources: [
            {
              name: "Aave",
              url: "https://aave.com/",
              description: "Decentralized lending platform",
            },
            {
              name: "Compound",
              url: "https://compound.finance/",
              description: "Algorithmic money market protocol",
            },
          ],
        },
      ],
      suggestedQuestions: [
        "How do interest rates work in DeFi lending?",
        "What happens if my collateral value drops?",
        "What is a liquidation in DeFi lending?",
      ],
      systemPrompt: `You are a helpful Web3 educator teaching about DeFi lending and borrowing protocols.
      
      Focus on explaining how users can lend their assets to earn interest or borrow against collateral. Explain concepts like overcollateralization, liquidation risks, and interest rate models.
      
      When explaining:
      - Compare to traditional lending when helpful
      - Explain the risks of liquidation and how to avoid it
      - Discuss popular lending platforms like Aave and Compound
      - Explain variable vs. stable interest rates
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`,
    },
    {
      id: "dex",
      name: "Decentralized Exchanges",
      icon: Shuffle,
      description:
        "Decentralized exchanges (DEXs) allow users to trade cryptocurrencies directly from their wallets without the need for an intermediary.",
      concepts: [
        {
          title: "Automated Market Makers",
          description:
            "AMMs use liquidity pools and mathematical formulas to determine asset prices instead of order books.",
          resources: [
            {
              name: "Uniswap",
              url: "https://uniswap.org/",
              description: "Automated market maker DEX",
            },
            {
              name: "PancakeSwap",
              url: "https://pancakeswap.finance/",
              description: "DEX on BNB Chain",
            },
          ],
        },
      ],
      suggestedQuestions: ["What is impermanent loss?", "How do liquidity pools work?", "What is slippage in trading?"],
      systemPrompt: `You are a helpful Web3 educator teaching about Decentralized Exchanges (DEXs) and how they work.
      
      Focus on explaining how users can swap tokens without intermediaries, how AMMs (Automated Market Makers) work, and concepts like liquidity pools, impermanent loss, and slippage.
      
      When explaining:
      - Compare to centralized exchanges when helpful
      - Explain how liquidity pools enable trading
      - Discuss the risks of impermanent loss for liquidity providers
      - Explain how to minimize slippage when trading
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`,
    },
    {
      id: "staking",
      name: "Staking & Yield Farming",
      icon: Lock,
      description:
        "Staking involves locking up cryptocurrencies to support network operations and earn rewards. Yield farming involves strategically providing liquidity to maximize returns.",
      concepts: [
        {
          title: "Proof of Stake",
          description:
            'A consensus mechanism where validators are selected based on the amount of cryptocurrency they hold and are willing to "stake".',
          resources: [
            {
              name: "Lido",
              url: "https://lido.fi/",
              description: "Liquid staking solution",
            },
          ],
        },
      ],
      suggestedQuestions: [
        "What is the difference between staking and yield farming?",
        "How are staking rewards calculated?",
        "What is liquid staking?",
      ],
      systemPrompt: `You are a helpful Web3 educator teaching about staking and yield farming in DeFi.
      
      Focus on explaining how users can earn passive income by staking their assets or providing liquidity. Explain concepts like Proof of Stake, liquid staking, yield farming strategies, and APY/APR.
      
      When explaining:
      - Differentiate between staking for consensus and staking for yield
      - Explain the risks and rewards of different strategies
      - Discuss popular staking platforms and yield farming protocols
      - Explain how rewards are calculated and distributed
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`,
    },
    {
      id: "nft",
      name: "NFTs & Marketplaces",
      icon: BarChart3,
      description:
        "Non-Fungible Tokens (NFTs) represent ownership of unique items. NFT marketplaces facilitate buying, selling, and trading of these digital assets.",
      concepts: [
        {
          title: "Digital Ownership",
          description: "NFTs prove ownership of digital assets on the blockchain.",
          resources: [
            {
              name: "OpenSea",
              url: "https://opensea.io/",
              description: "NFT marketplace",
            },
            {
              name: "Blur",
              url: "https://blur.io/",
              description: "NFT marketplace for professional traders",
            },
          ],
        },
      ],
      suggestedQuestions: [
        "How do NFT royalties work?",
        "What makes an NFT valuable?",
        "What are the environmental concerns with NFTs?",
      ],
      systemPrompt: `You are a helpful Web3 educator teaching about NFTs (Non-Fungible Tokens) and NFT marketplaces.
      
      Focus on explaining how NFTs represent digital ownership, how they're created, bought, and sold, and their various use cases beyond digital art.
      
      When explaining:
      - Explain the technical aspects of NFTs in simple terms
      - Discuss how royalties work for creators
      - Explain how to evaluate NFT projects and their potential value
      - Discuss popular NFT marketplaces and their features
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`,
    },
    {
      id: "dao",
      name: "DAOs & Governance",
      icon: GanttChart,
      description:
        "Decentralized Autonomous Organizations (DAOs) are community-led entities with no central authority. Governance tokens give holders voting rights in these organizations.",
      concepts: [
        {
          title: "On-Chain Governance",
          description: "Voting and proposal systems implemented directly on the blockchain.",
          resources: [
            {
              name: "MakerDAO",
              url: "https://makerdao.com/",
              description: "DAO governing the DAI stablecoin",
            },
          ],
        },
      ],
      suggestedQuestions: [
        "How does voting work in a DAO?",
        "What is a governance token?",
        "What are the challenges facing DAOs?",
      ],
      systemPrompt: `You are a helpful Web3 educator teaching about DAOs (Decentralized Autonomous Organizations) and on-chain governance.
      
      Focus on explaining how DAOs enable decentralized decision-making, how governance tokens work, and the challenges and opportunities of DAO governance.
      
      When explaining:
      - Compare DAOs to traditional organizations
      - Explain how proposals and voting work
      - Discuss different governance models (token-weighted, quadratic, etc.)
      - Provide examples of successful DAOs and their governance structures
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`,
    },
    {
      id: "wallets",
      name: "Wallets & Security",
      icon: Wallet,
      description:
        "Cryptocurrency wallets store private keys needed to access and manage your digital assets. Security practices are critical to protect your holdings.",
      concepts: [
        {
          title: "Types of Wallets",
          description: "Hot wallets (online) vs. cold wallets (offline) and their security implications.",
          resources: [
            {
              name: "MetaMask",
              url: "https://metamask.io/",
              description: "Browser extension wallet",
            },
            {
              name: "Ledger",
              url: "https://www.ledger.com/",
              description: "Hardware wallet",
            },
          ],
        },
      ],
      suggestedQuestions: [
        "What is a seed phrase and how do I protect it?",
        "How do I recognize and avoid scams?",
        "What happens if I lose access to my wallet?",
      ],
      systemPrompt: `You are a helpful Web3 educator teaching about cryptocurrency wallets and security best practices.
      
      Focus on explaining how wallets work, the different types available, and how users can secure their assets and protect themselves from scams.
      
      When explaining:
      - Explain the difference between custodial and non-custodial wallets
      - Emphasize the importance of seed phrase security
      - Discuss common scams and how to avoid them
      - Provide guidance on wallet selection based on user needs
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`,
    },
    {
      id: "defi2",
      name: "DeFi 2.0 & Beyond",
      icon: Coins,
      description:
        "DeFi 2.0 refers to the next generation of DeFi protocols that address limitations of the first wave, focusing on sustainability, capital efficiency, and risk management.",
      concepts: [
        {
          title: "Protocol-Owned Liquidity",
          description: "Protocols that own their own liquidity rather than relying on incentivized users.",
          resources: [
            {
              name: "Olympus DAO",
              url: "https://www.olympusdao.finance/",
              description: "Protocol with bonding mechanism",
            },
          ],
        },
      ],
      suggestedQuestions: [
        "What problems does DeFi 2.0 solve?",
        "What is protocol-owned liquidity?",
        "How are DeFi protocols becoming more sustainable?",
      ],
      systemPrompt: `You are a helpful Web3 educator teaching about advanced DeFi concepts and the evolution of DeFi protocols.
      
      Focus on explaining how DeFi 2.0 protocols are addressing the limitations of earlier DeFi systems, innovations in capital efficiency, and emerging trends in the space.
      
      When explaining:
      - Discuss the sustainability challenges of early DeFi protocols
      - Explain concepts like protocol-owned liquidity and its benefits
      - Discuss innovations in risk management and insurance
      - Highlight emerging trends and potential future developments
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`,
    },
    {
      id: "flock",
      name: "Flock.io & AI for Web3",
      icon: Brain,
      description:
        "Flock.io is a platform that combines AI with Web3 technologies, offering specialized models trained on blockchain and crypto data to help developers build better Web3 applications.",
      concepts: [
        {
          title: "AI for Web3",
          description:
            "Specialized AI models trained on blockchain data can help with smart contract development, security analysis, and understanding complex DeFi protocols.",
          resources: [
            {
              name: "Flock.io",
              url: "https://flock.io/",
              description: "AI platform for Web3 developers",
            },
          ],
        },
        {
          title: "Web3 Foundation Models",
          description:
            "Foundation models like Flock's Web3 models are pre-trained on massive datasets of blockchain transactions, smart contracts, and crypto market data.",
          resources: [
            {
              name: "Flock Documentation",
              url: "https://docs.flock.io/",
              description: "Learn how to use Flock's Web3 models",
            },
          ],
        },
      ],
      suggestedQuestions: [
        "How can AI help with smart contract development?",
        "What are the benefits of using Web3-specific AI models?",
        "How can Flock.io models improve security in DeFi applications?",
      ],
      systemPrompt: `You are a helpful Web3 educator teaching about the intersection of AI and blockchain technologies, with a focus on Flock.io.
      
Focus on explaining how specialized AI models can enhance Web3 development, improve security analysis, and help users navigate the complex world of blockchain and DeFi.
      
When explaining:
- Describe how AI models trained on blockchain data differ from general-purpose models
- Explain practical use cases for AI in Web3 development
- Discuss how Flock's models can help with smart contract analysis and security
- Highlight the benefits of using AI to understand complex DeFi protocols
      
If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`,
    },
    {
      id: "educhain",
      name: "EduChain: Arbitrum L3",
      icon: School,
      description:
        "EduChain is an educational Arbitrum Layer 3 blockchain designed for learning and experimenting with blockchain technology in a controlled environment.",
      concepts: [
        {
          title: "Arbitrum Layer 3",
          description:
            "EduChain is built as an Arbitrum Layer 3 chain, leveraging Arbitrum's rollup technology to provide a scalable and low-cost environment for educational purposes.",
          resources: [
            {
              name: "Arbitrum Orbit",
              url: "https://docs.arbitrum.io/launch-orbit-chain/orbit-overview",
              description: "Framework for launching L3 chains",
            },
          ],
        },
        {
          title: "EduChain Specifications",
          description:
            "EduChain has a chain ID of 94692861356 and is built on top of Arbitrum Sepolia (chain ID 421614), providing a sandbox for educational blockchain development.",
          resources: [
            {
              name: "Arbitrum Documentation",
              url: "https://docs.arbitrum.io/",
              description: "Learn about Arbitrum's technology",
            },
          ],
        },
      ],
      suggestedQuestions: [
        "What is an Arbitrum L3 chain?",
        "How can I connect to EduChain?",
        "What are the benefits of using a dedicated educational blockchain?",
      ],
      systemPrompt: `You are a helpful Web3 educator teaching about EduChain, an educational Arbitrum Layer 3 blockchain.
      
Focus on explaining how EduChain works as an educational environment, how it relates to Arbitrum's technology stack, and how users can interact with it for learning purposes.
      
When explaining:
- Describe the relationship between Ethereum, Arbitrum (L2), and EduChain (L3)
- Explain how EduChain provides a safe environment for learning blockchain development
- Discuss the technical specifications of EduChain (Chain ID: 94692861356, Parent Chain: Arbitrum Sepolia)
- Highlight the benefits of using a dedicated educational chain versus public testnets
      
EduChain Technical Details:
- Chain ID: 94692861356
- Parent Chain: Arbitrum Sepolia (Chain ID: 421614)
- Bridge Address: 0xde835286442c6446E36992c036EFe261AcD87F6d
- Inbox Address: 0x0592d3861Ea929B5d108d915c36f64EE69418049
- Sequencer Inbox: 0xf9d77199288f00440Ed0f494Adc0005f362c17b1
- Rollup Address: 0xF5A42aDA664E7c2dFE9DDa4459B927261BF90E09
      
If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`,
    },
  ]

  // Helper function to create educational fallback responses
  const createEducationalFallbackResponse = useCallback(
    (func: FunctionCall, result: any, currentSection?: DeFiSection): string => {
      const sectionName = currentSection?.name || "DeFi"

      switch (func.name) {
        case "get_token_balance":
          return `Your ${result.token || "token"} balance is ${result.balance} ${func.arguments.token_address === "native" ? "BNB" : result.token || "tokens"}.
        
In ${sectionName}, understanding your token balances is important because it helps you track your assets and make informed decisions. ${currentSection?.id === "lending" ? "For lending protocols, your balance determines how much you can lend or use as collateral." : currentSection?.id === "dex" ? "When using decentralized exchanges, knowing your balance is essential for planning trades." : "This information is fundamental to participating in any DeFi activity."}`

        case "get_token_price":
          return `The current price of ${func.arguments.token_symbol} is $${result.price}.
        
Price information is crucial in ${sectionName} as it affects the value of your assets and potential returns on investments. ${currentSection?.id === "dex" ? "When trading on DEXs, price data helps you determine if you're getting a fair exchange rate." : currentSection?.id === "staking" ? "For staking and yield farming, token prices help calculate your actual APY in dollar terms." : "Monitoring prices helps you make better decisions about when to buy, sell, or hold assets."}`

        case "get_gas_price":
          return `The current gas price is ${result.price} ${result.unit}.
        
Gas prices are important to monitor in ${sectionName} because they affect the cost of transactions on the blockchain. ${currentSection?.id === "dex" ? "When using DEXs, high gas prices can significantly impact the profitability of smaller trades." : currentSection?.id === "lending" ? "For lending platforms, understanding gas costs helps you determine if smaller deposits or withdrawals are economical." : "Being aware of gas prices helps you time your transactions to minimize fees."}`

        case "send_token":
          return `Transaction sent! ${func.arguments.amount} ${func.arguments.token_address === "native" ? "BNB" : "tokens"} have been sent to ${func.arguments.to_address}. Transaction hash: ${result.txHash}
        
In ${sectionName}, transactions like this represent the fundamental way value moves between addresses on the blockchain. ${currentSection?.id === "wallets" ? "This demonstrates how your wallet interacts with the blockchain to transfer assets securely." : "This transaction has been recorded on the blockchain and is now immutable and transparent - key principles of DeFi."}`

        case "swap_tokens":
          return `Swap completed! You received ${result.amountOut} ${func.arguments.token_out} in exchange for ${func.arguments.amount_in} ${func.arguments.token_in}. Transaction hash: ${result.txHash}
        
Token swaps are a core function in ${sectionName}, especially for decentralized exchanges. ${currentSection?.id === "dex" ? "This swap was executed through liquidity pools rather than a traditional order book, demonstrating how AMMs (Automated Market Makers) work." : "This demonstrates how DeFi enables permissionless trading without intermediaries, one of the key innovations of decentralized finance."}`

        default:
          return `Function ${func.name} executed successfully: ${JSON.stringify(result, null, 2)}
        
This information is relevant to ${sectionName} because it provides data that can help you make more informed decisions in the DeFi ecosystem.`
      }
    },
    [],
  )

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return

    const userMessage: Message = { role: "user", content: messageInput }
    setMessages((prev) => [...prev, userMessage])
    setMessageInput("")
    setIsProcessing(true)

    try {
      const currentSection = defiSections.find((section) => section.id === activeSection)
      const contextInfo = currentSection
        ? `We are discussing ${currentSection.name}. ${currentSection.description}`
        : "We are discussing DeFi (Decentralized Finance) in general."

      // Create system prompt based on the current section
      const systemPrompt =
        currentSection?.systemPrompt ||
        `You are a helpful Web3 educator specializing in DeFi topics. You're currently teaching about ${currentSection?.name || "DeFi basics"}. 
        Provide clear, educational responses that help users understand ${currentSection?.name || "DeFi"} concepts.
        ${contextInfo}
        
        When explaining concepts:
        - Use simple language and avoid jargon when possible
        - Provide real-world examples
        - Explain risks and benefits
        - Mention relevant protocols or projects
        
        When you receive function results, interpret them and respond in a natural, conversational way that incorporates the data and relates it back to the ${currentSection?.name || "DeFi"} concepts being taught.
        
        If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`

      // Check if we need to call Web3 functions
      let newFunctionCalls: FunctionCall[] = []
      let skipConversationalModel = false

      // We'll always use the conversational model first
      newFunctionCalls = []
      skipConversationalModel = false

      // We'll let the LLM decide if it needs to call functions

      // Only call the conversational model if we didn't get a response from the function calls
      let aiResponse = ""

      try {
        if (useLocalAI) {
          try {
            // Prepare messages for Llama
            const conversationalMessages: ChatMessage[] = messages
              .filter((m) => m.role !== "function") // Filter out function messages for the initial query
              .map((m) => ({
                role: m.role as "user" | "assistant" | "system",
                content: m.content,
                name: m.name,
              }))

            // Add the new user message
            conversationalMessages.push({
              role: "user",
              content: messageInput,
            })

            // Add system message to guide the model
            conversationalMessages.unshift({
              role: "system",
              content:
                systemPrompt +
                `\n\nIf you need to call a Web3 function, include [FUNCTION_CALL:function_name] in your response. Available functions: get_token_balance, get_token_price, get_gas_price, send_token, swap_tokens, add_liquidity, explain_transaction, estimate_gas.`,
            })

            // Call Llama
            aiResponse = await callLlama(
              {
                messages: conversationalMessages,
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 2000,
              },
              localEndpoint,
            )

            // Parse the response for function calls
            const parsedResponse = parseLlamaResponse(aiResponse)

            // If there's a function call, create it and add it to the queue
            if (parsedResponse.functionName) {
              const functionCall = createFunctionCall(parsedResponse.functionName, parsedResponse.functionArgs || {})
              newFunctionCalls.push(functionCall)

              // Add the assistant's message without the function call tag
              setMessages((prev) => [...prev, { role: "assistant", content: parsedResponse.text }])

              // Add the function call to the queue
              setFunctionCalls((prev) => [...prev, functionCall])

              // Auto-approve and execute read-only functions
              if (isReadOnlyFunction(functionCall.name)) {
                setTimeout(() => {
                  handleFunctionStatusChange(functionCall.id, "approved")
                }, 500)
              }

              // Skip adding another assistant message
              skipConversationalModel = true
            } else {
              // No function call, just use the response as is
              aiResponse = parsedResponse.text
            }
          } catch (error) {
            console.error("Error calling local model:", error)
            aiResponse = `I couldn't connect to the local model. ${error instanceof Error ? error.message : "Unknown error"}`
          }
        } else {
          // Similar changes for Gemini...
          if (!apiKeys.openai) {
            aiResponse = "Please provide a Gemini API key in the settings to use the chatbot."
          } else {
            // Prepare messages for Gemini
            const conversationalMessages: ChatMessage[] = messages
              .filter((m) => m.role !== "function") // Filter out function messages for the initial query
              .map((m) => ({
                role: m.role as "user" | "assistant" | "system",
                content: m.content,
                name: m.name,
              }))

            // Add the new user message
            conversationalMessages.push({
              role: "user",
              content: messageInput,
            })

            // Add system message to guide the model
            conversationalMessages.unshift({
              role: "system",
              content:
                systemPrompt +
                `\n\nIf you need to call a Web3 function, include [FUNCTION_CALL:function_name] in your response. Available functions: get_token_balance, get_token_price, get_gas_price, send_token, swap_tokens, add_liquidity, explain_transaction, estimate_gas.`,
            })

            // Call Gemini
            aiResponse = await callOpenAI({
              model: "qwen72b",
              messages: conversationalMessages,
              temperature: 0.7,
              top_p: 0.9,
              // max_tokens: 2000,
            })

            // Parse the response for function calls
            const parsedResponse = parseLlamaResponse(aiResponse)

            // If there's a function call, create it and add it to the queue
            if (parsedResponse.functionName) {
              const functionCall = createFunctionCall(parsedResponse.functionName, parsedResponse.functionArgs || {})
              newFunctionCalls.push(functionCall)

              // Add the assistant's message without the function call tag
              setMessages((prev) => [...prev, { role: "assistant", content: parsedResponse.text }])

              // Add the function call to the queue
              setFunctionCalls((prev) => [...prev, functionCall])

              // Auto-approve and execute read-only functions
              if (isReadOnlyFunction(functionCall.name)) {
                setTimeout(() => {
                  handleFunctionStatusChange(functionCall.id, "approved")
                }, 500)
              }

              // Skip adding another assistant message
              skipConversationalModel = true
            } else {
              // No function call, just use the response as is
              aiResponse = parsedResponse.text
            }
          }
        }

        // Only add the assistant message if we didn't already add one for a function call
        if (!skipConversationalModel && aiResponse && !aiResponse.includes("No valid response from Llama model")) {
          setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }])
        }
      } catch (error) {
        console.error("Error processing message:", error)
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I'm sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ])

        toast({
          title: "Error",
          description: "Failed to get a response from the AI.",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error)
      setIsProcessing(false)
    }
  }

  const handleFunctionStatusChange = useCallback(
    async (id: string, status: "approved" | "rejected" | "executed", result?: any) => {
      // Update the function call status
      setFunctionCalls((prev) =>
        prev.map((func) => (func.id === id ? { ...func, status, result: result || func.result } : func)),
      )

      // If a function was executed, process the result
      if (status === "executed" && result) {
        const func = functionCalls.find((f) => f.id === id)
        if (!func) return

        // Format the result for display in the function message
        let formattedResult = ""

        switch (func.name) {
          case "get_token_balance":
            formattedResult = JSON.stringify({
              balance: result.balance,
              token: result.token || (func.arguments.token_address === "native" ? "BNB" : "TOKEN"),
              wallet_address: func.arguments.wallet_address,
            })
            break
          case "get_token_price":
            formattedResult = JSON.stringify({
              price: result.price,
              currency: "USD",
              token_symbol: func.arguments.token_symbol,
            })
            break
          case "send_token":
            formattedResult = JSON.stringify({
              txHash: result.txHash,
              status: result.status,
              amount: func.arguments.amount,
              token: func.arguments.token_address === "native" ? "BNB" : "TOKEN",
              to_address: func.arguments.to_address,
            })
            break
          case "swap_tokens":
            formattedResult = JSON.stringify({
              txHash: result.txHash,
              status: result.status,
              amountIn: func.arguments.amount_in,
              amountOut: result.amountOut,
              tokenIn: func.arguments.token_in,
              tokenOut: func.arguments.token_out,
            })
            break
          case "get_gas_price":
            formattedResult = JSON.stringify({
              price: result.price,
              unit: result.unit,
              chain: func.arguments.chain,
            })
            break
          default:
            formattedResult = JSON.stringify(result)
        }

        // Add the function result as a function message
        const functionMessage: Message = {
          role: "function",
          name: func.name,
          content: formattedResult,
        }

        setMessages((prev) => [...prev, functionMessage])

        // Now send the function result to the AI for interpretation
        const currentSection = defiSections.find((section) => section.id === activeSection)
        const contextInfo = currentSection
          ? `We are discussing ${currentSection.name}. ${currentSection.description}`
          : "We are discussing DeFi (Decentralized Finance) in general."

        // Create system prompt for function result interpretation
        const interpretationPrompt = `You are a helpful Web3 educator specializing in ${currentSection?.name || "DeFi"} topics. 
      
You've just received the result of a ${func.name} function call. Interpret this data and explain it to the user in the context of ${currentSection?.name || "DeFi"}.

${contextInfo}

Respond in a natural, conversational way that:
1. Explains what the data means in plain language
2. Relates it back to the ${currentSection?.name || "DeFi"} concepts being taught
3. Provides educational context about why this information is important

Be concise but informative. Don't just repeat the raw data - explain its significance in the context of the current lesson.`

        const conversationalMessages: ChatMessage[] = []

        // Add system message to guide the model's interpretation
        conversationalMessages.push({
          role: "system",
          content: interpretationPrompt,
        })

        // Add the function result message
        conversationalMessages.push({
          role: "function",
          name: func.name,
          content: formattedResult,
        })

        // Call the AI to interpret the function result
        let aiResponse: string

        try {
          if (!useLocalAI) {
            // Use OpenAI
            if (!apiKeys.openai) {
              // Create a fallback educational response if no OpenAI API key
              aiResponse = createEducationalFallbackResponse(func, result, currentSection)
            } else {
              aiResponse = await callOpenAI({
                model: "gpt-4o",
                messages: conversationalMessages,
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 2000,
              })
            }
          } else {
            // Use Llama
            aiResponse = await callLlama(
              {
                messages: conversationalMessages,
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 2000,
              },
              localEndpoint,
            )
          }

          // Add the AI's interpretation as an assistant message
          if (aiResponse && !aiResponse.includes("No valid response from Llama model")) {
            setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }])
          } else {
            // Fallback if Llama doesn't provide a valid response
            const fallbackResponse = createEducationalFallbackResponse(func, result, currentSection)
            setMessages((prev) => [...prev, { role: "assistant", content: fallbackResponse }])
          }
        } catch (error) {
          console.error("Error getting AI interpretation:", error)

          // Fallback to an educational response if AI interpretation fails
          const fallbackResponse = createEducationalFallbackResponse(func, result, currentSection)
          setMessages((prev) => [...prev, { role: "assistant", content: fallbackResponse }])
        }

        // If the function generated a transaction, add it to the transaction queue
        if (result.txHash) {
          // Add to transaction queue if window.transactionQueue exists
          if (window.transactionQueue) {
            window.transactionQueue.add({
              hash: result.txHash,
              from: address || "",
              to: func.arguments.to_address || "",
              value: func.arguments.amount || "0",
              chainId: String(currentChain),
              type: func.name,
              status: "confirmed",
              method: func.name,
              timestamp: Date.now(),
              description: `${func.name} - ${func.arguments.amount || ""} ${func.arguments.token_address === "native" ? "BNB" : "tokens"}`,
              execute: async () => {},
            })
          }
        }
      }
    },
    [
      address,
      currentChain,
      functionCalls,
      apiKeys,
      useLocalAI,
      localEndpoint,
      setMessages,
      createEducationalFallbackResponse,
      callOpenAI,
      callLlama,
    ],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSelectSection = (sectionId: string) => {
    setActiveSection(sectionId)
    const section = defiSections.find((s) => s.id === sectionId)
    if (section) {
      const aiMessage: Message = {
        role: "assistant",
        content: `Let's explore ${section.name}. ${section.description}`,
      }
      setMessages([aiMessage])
      setFunctionCalls([])
    }
  }

  const handleSelectQuestion = (question: string) => {
    setMessageInput(question)
  }

  const toggleHistoryPanel = () => {
    setIsHistoryCollapsed(!isHistoryCollapsed)
  }

  const togglePromptsPanel = () => {
    setIsSuggestionsCollapsed(!isSuggestionsCollapsed)
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1400) {
        setIsSuggestionsCollapsed(true)
      }
      if (window.innerWidth < 1200) {
        setIsHistoryCollapsed(true)
      }
    }

    handleResize()

    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const renderResourceLink = (resource: { name: string; url: string; description: string }) => {
    return (
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-primary hover:underline my-1"
      >
        <ExternalLink size={14} />
        {resource.name}
        <span className="text-muted-foreground text-xs">- {resource.description}</span>
      </a>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <div
          className={cn(
            "border-r bg-card/50 flex-shrink-0 transition-all duration-300 overflow-hidden",
            isHistoryCollapsed ? "w-10" : "w-[280px] md:w-1/4 lg:w-1/5",
          )}
        >
          {isHistoryCollapsed ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleHistoryPanel}
              className="h-full rounded-none border-r w-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">DeFi Topics</h2>
                <Button variant="ghost" size="icon" onClick={toggleHistoryPanel} className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1 h-[calc(100vh-16rem)]">
                <div className="space-y-2 pr-4">
                  {defiSections.map((section) => (
                    <Button
                      key={section.id}
                      variant={activeSection === section.id ? "default" : "ghost"}
                      className="w-full justify-start text-left"
                      onClick={() => handleSelectSection(section.id)}
                    >
                      <section.icon className="mr-2 h-4 w-4" />
                      {section.name}
                    </Button>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium text-sm mb-2">Transaction Queue</h3>
                <div className="overflow-y-auto h-[calc(20vh-4rem)]">
                  <TransactionQueue chainId={currentChain} inPanel={true} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center border-b px-4 py-3 bg-background/95">
            {isHistoryCollapsed && (
              <Button variant="ghost" size="icon" onClick={toggleHistoryPanel} className="md:hidden h-8 w-8 mr-2">
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            <h2 className="text-lg font-semibold flex items-center">
              {defiSections.find((s) => s.id === activeSection)?.icon &&
                React.createElement(defiSections.find((s) => s.id === activeSection)?.icon || "div", {
                  className: "mr-2 h-5 w-5 text-primary",
                })}
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              {defiSections.find((s) => s.id === activeSection)?.name || "Web3 Introduction"}
              </span>
            </h2>
            {isSuggestionsCollapsed && (
              <Button variant="ghost" size="icon" onClick={togglePromptsPanel} className="md:hidden h-8 w-8 ml-auto">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-background/80 to-background h-[calc(100vh-20rem)]">
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20 animate-float">
                    <School className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                    Web3 Learning Hub
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Ask questions and learn about {defiSections.find((s) => s.id === activeSection)?.name || "Web3 concepts"}
                  </p>
                </div>
              ) : (
                messages
                  .filter((m) => m.role !== "function" || showFunctionMessages)
                .map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                        "flex items-start gap-3",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role !== "user" && (
                        <div
                          className={cn(
                            "w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center",
                            message.role === "function"
                          ? "bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800"
                              : "bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md"
                    )}
                  >
                          {message.role === "function" ? (
                        <Code size={16} className="text-amber-600 dark:text-amber-400" />
                          ) : (
                            <School size={16} className="text-white" />
                          )}
                      </div>
                    )}
                      
                      <div
                        className={cn(
                          "p-3 md:p-4 rounded-xl max-w-[85%] shadow-sm",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground ml-auto rounded-tr-sm"
                            : message.role === "function"
                              ? "bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-tl-sm"
                              : "bg-card rounded-tl-sm"
                        )}
                      >
                      {message.role === "function" ? (
                        <div>
                          <div className="font-mono text-xs text-amber-700 dark:text-amber-300 mb-1">
                            Function Response:
                          </div>
                          <pre className="text-xs overflow-auto">{message.content}</pre>
                        </div>
                      ) : (
                          <div className="whitespace-pre-wrap break-words text-sm md:text-base prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                      )}
                    </div>
                      
                      {message.role === "user" && (
                        <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
                          <MessageSquare size={16} className="text-primary" />
                  </div>
                      )}
                    </div>
                  ))
              )}
              
              {isProcessing && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0 flex items-center justify-center shadow-md">
                    <School size={16} className="text-white" />
                  </div>
                  <div className="p-4 rounded-xl bg-card rounded-tl-sm flex items-center max-w-[85%] shadow-sm">
                    <div className="dot-typing"></div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {activeSection && (
            <div className="border-t p-4 bg-card/50 backdrop-blur-sm">
              <Tabs defaultValue="overview" className="w-full">
                <div className="flex justify-between items-center mb-3">
                  <TabsList className="w-auto">
                    <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
                    <TabsTrigger value="concepts" className="text-xs md:text-sm">Key Concepts</TabsTrigger>
                    <TabsTrigger value="resources" className="text-xs md:text-sm">Resources</TabsTrigger>
                </TabsList>

                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">Show function calls</div>
                    <Checkbox
                      checked={showFunctionMessages}
                      onCheckedChange={(checked) => setShowFunctionMessages(!!checked)}
                      className="data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                    />
                  </div>
                </div>

                <TabsContent value="overview" className="mt-0">
                  <Card className="overflow-hidden border-indigo-500/20 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-sm">
                      <CardTitle className="flex items-center text-lg">
                        {defiSections.find((s) => s.id === activeSection)?.icon &&
                          React.createElement(defiSections.find((s) => s.id === activeSection)?.icon || "div", {
                            className: "mr-2 h-5 w-5 text-indigo-500",
                          })}
                        {defiSections.find((s) => s.id === activeSection)?.name}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {defiSections.find((s) => s.id === activeSection)?.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="px-4 py-3 bg-muted/30 border-t border-muted-foreground/10 text-xs text-muted-foreground flex items-center gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5" />
                        <span>Try asking questions about {defiSections.find((s) => s.id === activeSection)?.name}</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="concepts" className="mt-0">
                  <Card className="shadow-md border-indigo-500/20">
                    <CardContent className="p-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                      {defiSections
                        .find((s) => s.id === activeSection)
                        ?.concepts.map((concept, i) => (
                            <div key={i} className="p-3 border rounded-lg bg-card/90 hover:bg-card/100 transition-colors hover:border-indigo-500/20">
                              <h3 className="font-medium flex items-center text-sm">
                                <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center mr-2 text-xs text-primary">
                                  {i + 1}
                                </div>
                                {concept.title}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{concept.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="resources" className="mt-0">
                  <Card className="shadow-md border-indigo-500/20">
                    <CardContent className="p-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                      {defiSections
                        .find((s) => s.id === activeSection)
                        ?.concepts.flatMap((concept) =>
                          concept.resources.map((resource, i) => (
                              <a
                                key={i}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 border rounded-lg hover:bg-card/90 transition-colors hover:border-indigo-500/30 flex items-start gap-2 group"
                              >
                                <ExternalLink size={16} className="text-primary mt-0.5 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
                                <div>
                                  <div className="font-medium text-sm group-hover:text-primary transition-colors">{resource.name}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">{resource.description}</div>
                            </div>
                              </a>
                          )),
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <div className="border-t p-4 bg-background">
            <div className="max-w-3xl mx-auto">
            <ModelSelector
              useOpenAI={!useLocalAI}
              onUseOpenAIChange={(value) => setUseLocalAI(!value)}
              showSettings={showEndpointSettings}
              onShowSettingsChange={setShowEndpointSettings}
              llamaEndpoint={localEndpoint}
              onLlamaEndpointChange={setLocalEndpoint}
              openaiApiKey={apiKeys.openai || ""}
              onOpenAIApiKeyChange={(key) => updateApiKey("openai", key)}
              replicateApiKey={apiKeys.replicate}
              onReplicateApiKeyChange={(key) => updateApiKey("replicate", key)}
              className="mb-3"
            />

            <div className="flex gap-2">
              <Textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about Web3 or DeFi..."
                  className="min-h-[60px] flex-1 bg-card/70 border-indigo-500/20 focus-visible:ring-indigo-500/50 rounded-xl"
              />
                <Button 
                  onClick={handleSendMessage} 
                  className="self-end rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600" 
                  disabled={isProcessing}
                >
                <Send className="h-4 w-4" />
              </Button>
            </div>
              
              {activeSection && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {defiSections
                    .find((s) => s.id === activeSection)
                    ?.suggestedQuestions.slice(0, 3).map((question, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="text-xs border-indigo-500/20 text-muted-foreground hover:bg-indigo-500/5 hover:text-foreground rounded-lg"
                        onClick={() => handleSelectQuestion(question)}
                      >
                        {question}
                      </Button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className={cn(
            "bg-card/50 flex-shrink-0 transition-all duration-300 overflow-hidden border-l",
            isSuggestionsCollapsed ? "w-10" : "w-[280px] md:w-1/4 lg:w-1/5",
          )}
        >
          {isSuggestionsCollapsed ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePromptsPanel}
              className="h-full rounded-none border-l w-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Suggestions</h2>
                <Button variant="ghost" size="icon" onClick={togglePromptsPanel} className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <SuggestedPromptsPanel
                suggestions={defiSections.find((s) => s.id === activeSection)?.suggestedQuestions || []}
                onSelectPrompt={handleSelectQuestion}
              />

              <div className="mt-4 text-xs text-muted-foreground">
                <h3 className="font-medium mb-1">Active Functions</h3>
                <div className="space-y-2">
                  {functionCalls.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic">No active functions</div>
                  ) : (
                    <FunctionQueue
                      functions={functionCalls}
                      onStatusChange={handleFunctionStatusChange}
                      walletAddress={address}
                      chain={currentChain}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Add typing dots animation
const styles = `
.dot-typing {
  position: relative;
  left: -9999px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: hsl(var(--primary));
  color: hsl(var(--primary));
  box-shadow: 9984px 0 0 0 hsl(var(--primary)), 9999px 0 0 0 hsl(var(--primary)), 10014px 0 0 0 hsl(var(--primary));
  animation: dot-typing 1.5s infinite linear;
}

@keyframes dot-typing {
  0% {
    box-shadow: 9984px 0 0 0 hsl(var(--primary)), 9999px 0 0 0 hsl(var(--primary)), 10014px 0 0 0 hsl(var(--primary));
  }
  16.667% {
    box-shadow: 9984px -10px 0 0 hsl(var(--primary)), 9999px 0 0 0 hsl(var(--primary)), 10014px 0 0 0 hsl(var(--primary));
  }
  33.333% {
    box-shadow: 9984px 0 0 0 hsl(var(--primary)), 9999px 0 0 0 hsl(var(--primary)), 10014px 0 0 0 hsl(var(--primary));
  }
  50% {
    box-shadow: 9984px 0 0 0 hsl(var(--primary)), 9999px -10px 0 0 hsl(var(--primary)), 10014px 0 0 0 hsl(var(--primary));
  }
  66.667% {
    box-shadow: 9984px 0 0 0 hsl(var(--primary)), 9999px 0 0 0 hsl(var(--primary)), 10014px 0 0 0 hsl(var(--primary));
  }
  83.333% {
    box-shadow: 9984px 0 0 0 hsl(var(--primary)), 9999px 0 0 0 hsl(var(--primary)), 10014px -10px 0 0 hsl(var(--primary));
  }
  100% {
    box-shadow: 9984px 0 0 0 hsl(var(--primary)), 9999px 0 0 0 hsl(var(--primary)), 10014px 0 0 0 hsl(var(--primary));
  }
}
`;

// Add style tag for the animation
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default Web3Intro
