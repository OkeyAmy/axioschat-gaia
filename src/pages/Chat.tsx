"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import Header from "@/components/Header"
import ChatHistory from "@/components/ChatHistory"
import ChatMessages from "@/components/ChatMessages"
import SuggestedPromptsPanel from "@/components/SuggestedPromptsPanel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useAccount } from "wagmi"
import WalletRequired from "@/components/WalletRequired"
import { ArrowRight, Bot, MessageSquare, RotateCcw, Sparkles, Send, Command, CircleHelp } from "lucide-react"
import TransactionQueue from "@/components/TransactionQueue"
import useApiKeys from "@/hooks/useApiKeys"
import ModelSelector from "@/components/ModelSelector"
import { useLocation } from "react-router-dom"
import {
  callLlama,
  callOpenAI,
  isReadOnlyFunction,
  executeFunctionCall,
  callFlockWeb3,
  createDefaultWeb3Tools,
  type ChatMessage,
  type FunctionCall,
} from "@/services/aiService"
import ReactMarkdown from "react-markdown"
import ErrorBoundary from "@/components/ErrorBoundary"

type Message = {
  role: "user" | "assistant" | "system" | "function"
  content: string
  id: string
  functionCalls?: FunctionCall[]
  name?: string
}

const Chat = () => {
  const { isConnected, address } = useAccount()
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [functionCalls, setFunctionCalls] = useState<FunctionCall[]>([])
  const [useOpenAI, setUseOpenAI] = useState(false)
  const [activeChat, setActiveChat] = useState<number | null>(null)
  const [isHistoryPanelCollapsed, setIsHistoryPanelCollapsed] = useState(window.innerWidth < 1200)
  const [isPromptsPanelCollapsed, setIsPromptsPanelCollapsed] = useState(window.innerWidth < 1400)
  const [currentChain, setCurrentChain] = useState(1) // Ethereum mainnet
  const [processingMessageId, setProcessingMessageId] = useState<string | null>(null)
  const [executingFunction, setExecutingFunction] = useState(false)
  const [debugMode, setDebugMode] = useState(false)

  const [llamaEndpoint, setLlamaEndpoint] = useState("http://localhost:11434")
  const [showEndpointSettings, setShowEndpointSettings] = useState(false)
  const { apiKeys, updateApiKey, isLoaded } = useApiKeys()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1400) {
        setIsPromptsPanelCollapsed(true)
      }
      if (window.innerWidth < 1200) {
        setIsHistoryPanelCollapsed(true)
      }
    }

    handleResize()

    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Check for question parameter in URL and auto-submit
  const location = useLocation()
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search)
    const questionParam = queryParams.get("question")

    if (questionParam && messages.length === 0 && !loading) {
      // Set the input and trigger submission
      setInput(questionParam)

      // Use setTimeout to ensure the input is set before submitting
      setTimeout(() => {
        const submitEvent = new Event("submit", { cancelable: true })
        const formElement = document.querySelector("form")
        if (formElement) {
          formElement.dispatchEvent(submitEvent)
        }
      }, 100)

      // Clean up the URL to remove the question parameter
      window.history.replaceState({}, document.title, "/chat")
    }
  }, [location.search, messages.length, loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || executingFunction) return;

    // Create a copy of the user's input before clearing it
    const userInput = input.trim();

    const userMessage: Message = {
      role: "user",
      content: userInput,
      id: uuidv4(),
    };

    try {
      // First add the message to the state, then clear input and set loading
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput("");
      setLoading(true);

      // Execute the rest of the function in a try-catch block to prevent UI from disappearing
    try {
      // Prepare messages for the Llama model
      const conversationalMessages: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
        functionCalls: m.functionCalls,
        name: m.name,
        }));

      // Add the new user message
      conversationalMessages.push({
        role: "user",
          content: userInput,
        });

      // Add system message to guide the Llama model to ONLY identify if a function call is needed
      conversationalMessages.unshift({
        role: "system",
          content: `You are Axoischat, a specialized Web3 assistant with deep knowledge of blockchain, cryptocurrencies, DeFi, NFTs, and smart contracts.

Your ONLY job is to determine if the user's request requires calling a blockchain function.

If the user asks for information that requires accessing blockchain data (like balances, prices, etc.), respond with:
1. A brief message indicating you need to check that information
2. Include the tag [FUNCTION_NEEDED] at the end of your message

Available functions:
- get_token_balance - For checking token balances
- get_token_price - For checking token prices
- get_gas_price - For checking gas prices
- send_token - For sending tokens
- swap_tokens - For swapping tokens
- add_liquidity - For adding liquidity

Example:
User: "What's my BNB balance?"
You: "Let me check your BNB balance for you. [FUNCTION_NEEDED]"

User: "Tell me about Ethereum"
You: "Ethereum is a decentralized blockchain platform that enables the creation of smart contracts and decentralized applications (dApps)..."

DO NOT try to execute functions yourself. DO NOT include any specific function names in your response.
DO NOT make up any blockchain data. ONLY identify if a function call is needed.`,
        });

      // Call the Llama model to determine if a function call is needed
        let llamaResponse: string;

      if (useOpenAI) {
          // Use Gemini
        if (!apiKeys.openai) {
            llamaResponse = "Please provide a Gemini API key in the settings to use the chatbot.";
        } else {
            try {
          llamaResponse = await callOpenAI({
                model: "gemini-2.0-flash",
            messages: conversationalMessages,
            temperature: 0.7,
            top_p: 0.9,
            // max_tokens: 5000,
              });
            } catch (error) {
              console.error("Error calling OpenAI:", error);
              llamaResponse = "Sorry, I'm having trouble connecting to the AI service. Please try again in a moment.";
            }
        }
      } else {
        // Use Llama
          try {
        llamaResponse = await callLlama(
          {
            messages: conversationalMessages,
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 2000,
          },
          llamaEndpoint,
            );
          } catch (error) {
            console.error("Error calling Llama:", error);
            llamaResponse = "Sorry, I'm having trouble connecting to the AI service. Please try again in a moment.";
          }
        }

        console.log("Llama response:", llamaResponse);

      // Check if Llama identified a function call is needed
        const functionNeeded = llamaResponse.includes("[FUNCTION_NEEDED]");

      // Clean up the response by removing the tag
        const cleanResponse = llamaResponse.replace("[FUNCTION_NEEDED]", "").trim();

      // Add the assistant's message
      const assistantMessage: Message = {
        role: "assistant",
        content: cleanResponse,
        id: uuidv4(),
        };
        setMessages((prevMessages) => [...prevMessages, assistantMessage]);

      // If a function call is needed
      if (functionNeeded) {
          console.log("Function call needed according to Llama");

        // Set a processing message ID to track this operation
          const processingId = uuidv4();
          setProcessingMessageId(processingId);

        // Add a processing message
        const processingMessage: Message = {
          role: "assistant",
          content: "I'm checking that information for you...",
          id: processingId,
          };
          setMessages((prevMessages) => [...prevMessages, processingMessage]);

        // Now forward the request to the Flock Web3 model
        try {
            setExecutingFunction(true);

          // Check if Replicate API key is available
          if (!apiKeys.replicate) {
              throw new Error("Replicate API key is required to use the Flock Web3 model");
          }

          // Get the tools JSON
            const tools = createDefaultWeb3Tools();

            console.log("Calling Flock Web3 model with query:", userInput);

          // Call the Flock Web3 model to determine the specific function and parameters
            try {
          const flockResponse = await callFlockWeb3({
                query: userInput,
            tools: tools,
            temperature: 0.7,
            top_p: 0.9,
            max_new_tokens: 2000,
              });

              console.log("Flock Web3 response:", flockResponse);

          if (typeof flockResponse === "string") {
                throw new Error("Unexpected string response from Flock Web3");
          }

          if (flockResponse.error) {
                throw new Error(flockResponse.error);
          }

          if (flockResponse.functionCalls && flockResponse.functionCalls.length > 0) {
            // We got function calls from Flock Web3
                const functionCall = flockResponse.functionCalls[0];
                console.log("Function call from Flock Web3:", functionCall);

            // Add to function calls state
                setFunctionCalls((prev) => [...prev, functionCall]);

            // If it's a read-only function, execute it directly
            if (isReadOnlyFunction(functionCall.name)) {
                  console.log("Auto-executing read-only function");

              try {
                    const result = await executeFunctionCall(functionCall);
                    console.log("Function execution result:", result);

                // Add the function result as a function message
                const functionMessage: Message = {
                  role: "function",
                  name: functionCall.name,
                  content: JSON.stringify(
                    {
                      function_name: functionCall.name,
                      arguments: functionCall.arguments,
                      result: result,
                      timestamp: new Date().toISOString(),
                    },
                    null,
                    2,
                  ),
                  id: uuidv4(),
                    };
                    setMessages((prev) => [...prev, functionMessage]);

                // Update the function call status
                setFunctionCalls((prev) =>
                  prev.map((f) => (f.id === functionCall.id ? { ...f, status: "executed", result } : f)),
                    );

                // Format the result for the Llama model
                    const formattedResult = JSON.stringify(result);

                // Send the result back to the Llama model for interpretation
                // No need to look up the function, we already have it
                const interpretationMessages: ChatMessage[] = [
                  {
                    role: "system",
                        content: `You are Axioschat, a specialized Web3 assistant. You've just received the result of a function call.
                    
Interpret the function result and respond in a natural, conversational way. Focus on explaining what the data means for the user in plain language.

Be concise and direct. Don't just repeat the raw data - explain its significance in a helpful way.

Function: ${functionCall.name}
Arguments: ${JSON.stringify(functionCall.arguments)}
Result: ${formattedResult}`,
                  },
                  {
                    role: "user",
                        content: `The user asked: "${userInput}". Please interpret the function result in a helpful way.`,
                  },
                    ];

                    console.log("Sending function result to Llama for interpretation");

                // Call the Llama model again to interpret the result
                    let interpretationResponse: string;

                if (useOpenAI) {
                  if (!apiKeys.openai) {
                    // Generate a fallback response if no API key
                        interpretationResponse = generateFallbackResponse(functionCall, result);
                  } else {
                    interpretationResponse = await callOpenAI({
                          model: "gemini-2.0-flash",
                      messages: interpretationMessages,
                      temperature: 0.7,
                      top_p: 0.9,
                      max_tokens: 2000,
                        });
                  }
                } else {
                  interpretationResponse = await callLlama(
                    {
                      messages: interpretationMessages,
                      temperature: 0.7,
                      top_p: 0.9,
                      max_tokens: 2000,
                    },
                    llamaEndpoint,
                      );
                }

                    console.log("Interpretation response:", interpretationResponse);

                // Replace the processing message with the interpretation
                if (interpretationResponse && !interpretationResponse.includes("No valid response from")) {
                  setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                      msg.id === processingId
                        ? {
                            ...msg,
                            content: interpretationResponse,
                          }
                        : msg,
                    ),
                      );
                } else {
                  // Use fallback response if interpretation fails
                      const fallbackResponse = generateFallbackResponse(functionCall, result);
                  setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                      msg.id === processingId
                        ? {
                            ...msg,
                            content: fallbackResponse,
                          }
                        : msg,
                    ),
                      );
                }
              } catch (error) {
                    console.error("Error executing function:", error);

                // Update the processing message with the error
                setMessages((prevMessages) =>
                  prevMessages.map((msg) =>
                    msg.id === processingId
                      ? {
                          ...msg,
                          content: `I encountered an error while checking that information: ${
                            error instanceof Error ? error.message : "Unknown error"
                          }`,
                        }
                      : msg,
                  ),
                    );

                // Update the function call status
                setFunctionCalls((prev) =>
                  prev.map((f) =>
                    f.id === functionCall.id
                      ? {
                          ...f,
                          status: "rejected",
                          result: { error: error instanceof Error ? error.message : "Unknown error" },
                        }
                      : f,
                  ),
                    );
              }
            } else {
              // For non-read-only functions, add to queue for approval
                  console.log("Adding function to queue for approval");

              // Update the processing message
              setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.id === processingId
                    ? {
                        ...msg,
                        content: `I need your approval to execute the ${functionCall.name} function. Please check the transaction queue.`,
                      }
                    : msg,
                ),
                  );
            }
              } else {
                // No function calls returned
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === processingId
                  ? {
                      ...msg,
                          content: "I couldn't determine the specific function needed. Could you please provide more details?",
                    }
                  : msg,
              ),
                );
              }
            } catch (flockError) {
              console.error("Error calling Flock Web3:", flockError);
              setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.id === processingId
                    ? {
                        ...msg,
                        content: `I encountered an error while processing your request: ${
                          flockError instanceof Error ? flockError.message : "Unknown error"
                        }`,
                      }
                    : msg,
                ),
              );
          }
        } catch (error) {
            console.error("Error in function execution flow:", error);
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === processingId
                ? {
                    ...msg,
                    content: `I encountered an error while processing your request: ${
                      error instanceof Error ? error.message : "Unknown error"
                    }`,
                  }
                : msg,
            ),
            );
        } finally {
            setExecutingFunction(false);
            setProcessingMessageId(null);
          }
        }
      } catch (innerError) {
        console.error("Error in handleSubmit inner logic:", innerError);
        // Add an error message
        setMessages((prevMessages) => [
          ...prevMessages,
          {
        role: "assistant",
            content: "I'm sorry, I encountered an unexpected error. Please try again.",
        id: uuidv4(),
          },
        ]);
      }
    } catch (outerError) {
      console.error("Critical error in handleSubmit:", outerError);
      // Don't try to update state if we hit a critical error
    } finally {
      setLoading(false);
    }
  };

  // New function to execute a function directly
  const generateFallbackResponse = (func: FunctionCall, result: any): string => {
    console.log("Generating fallback response for:", func.name)

    switch (func.name) {
      case "get_token_balance":
        return `Your ${result.token || "token"} balance is ${result.balance} ${
          func.arguments.token_address === "native" ? "BNB" : result.token || "tokens"
        }.`
      case "get_token_price":
        return `The current price of ${func.arguments.token_symbol} is ${result.price} USD.`
      case "send_token":
        return `Transaction sent! ${func.arguments.amount} ${
          func.arguments.token_address === "native" ? "BNB" : "tokens"
        } have been sent to ${func.arguments.to_address}. Transaction hash: ${result.txHash}`
      case "swap_tokens":
        return `Swap completed! You received ${result.amountOut} ${func.arguments.token_out}. Transaction hash: ${result.txHash}`
      case "get_gas_price":
        return `The current gas price is ${result.price} ${result.unit}.`
      default:
        return `Function ${func.name} executed successfully: ${JSON.stringify(result, null, 2)}`
    }
  }

  // Update the handleFunctionStatusChange function to use the new executeFunction
  const handleFunctionStatusChange = async (id: string, status: "approved" | "rejected" | "executed", result?: any) => {
    console.log(`Function status change: ${id} -> ${status}`, result ? "with result" : "no result")

    // Update the function call status
    setFunctionCalls((prev) =>
      prev.map((func) => (func.id === id ? { ...func, status, result: result || func.result } : func)),
    )

    // If function was approved, execute it
    if (status === "approved" && !executingFunction) {
      const func = functionCalls.find((f) => f.id === id)
      if (!func) {
        console.error("Function not found for ID:", id)
        return
      }

      console.log("Executing approved function:", func.name)

      // Set a processing message ID to track this operation
      const processingId = uuidv4()
      setProcessingMessageId(processingId)

      // Add a processing message
      const processingMessage: Message = {
        role: "assistant",
        content: "I'm processing your request...",
        id: processingId,
      }
      setMessages((prevMessages) => [...prevMessages, processingMessage])

      // Execute the function
      setExecutingFunction(true)
      try {
        const result = await executeFunctionCall(func)
        console.log("Function execution result:", result)

        // Update the function call status
        setFunctionCalls((prev) => prev.map((f) => (f.id === func.id ? { ...f, status: "executed", result } : f)))

        // Format the result for the Llama model
        const formattedResult = JSON.stringify(result)

        // Send the result back to the Llama model for interpretation
        const interpretationMessages: ChatMessage[] = [
          {
            role: "system",
            content: `You are Axioschat, a specialized Web3 assistant. You've just received the result of a function call.
            
Interpret the function result and respond in a natural, conversational way. Focus on explaining what the data means for the user in plain language.

Be concise and direct. Don't just repeat the raw data - explain its significance in a helpful way.

Function: ${func.name}
Arguments: ${JSON.stringify(func.arguments)}
Result: ${formattedResult}`,
          },
          {
            role: "user",
            content: "Please interpret the function result in a helpful way.",
          },
        ]

        console.log("Sending function result to Llama for interpretation")

        // Call the Llama model again to interpret the result
        let interpretationResponse: string

        if (useOpenAI) {
          if (!apiKeys.openai) {
            // Generate a fallback response if no API key
            interpretationResponse = generateFallbackResponse(func, result)
          } else {
            interpretationResponse = await callOpenAI({
              model: "gemini-2.0-flash",
              messages: interpretationMessages,
              temperature: 0.7,
              top_p: 0.9,
              max_tokens: 2000,
            })
          }
        } else {
          interpretationResponse = await callLlama(
            {
              messages: interpretationMessages,
              temperature: 0.7,
              top_p: 0.9,
              max_tokens: 2000,
            },
            llamaEndpoint,
          )
        }

        console.log("Interpretation response:", interpretationResponse)

        // Replace the processing message with the interpretation
        if (interpretationResponse && !interpretationResponse.includes("No valid response from")) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === processingId
                ? {
                    ...msg,
                    content: interpretationResponse,
                  }
                : msg,
            ),
          )
        } else {
          // Use fallback response if interpretation fails
          const fallbackResponse = generateFallbackResponse(func, result)
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === processingId
                ? {
                    ...msg,
                    content: fallbackResponse,
                  }
                : msg,
            ),
          )
        }

        // Add the function result as a function message
        const functionMessage: Message = {
          role: "function",
          name: func.name,
          content: JSON.stringify(
            {
              function_name: func.name,
              arguments: func.arguments,
              result: result,
              timestamp: new Date().toISOString(),
            },
            null,
            2,
          ),
          id: uuidv4(),
        }

        setMessages((prev) => [...prev, functionMessage])

        // If the function generated a transaction, add it to the transaction queue
        if (result.txHash && window.transactionQueue) {
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
            description: `${func.name} - ${func.arguments.amount || ""} ${
              func.arguments.token_address === "native" ? "BNB" : "tokens"
            }`,
            execute: async () => {},
          })
        }
      } catch (error) {
        console.error("Error executing function:", error)

        // Update the processing message with the error
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === processingId
              ? {
                  ...msg,
                  content: `I encountered an error while processing your request: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`,
                }
              : msg,
          ),
        )

        // Update the function call status
        setFunctionCalls((prev) =>
          prev.map((f) =>
            f.id === func.id
              ? {
                  ...f,
                  status: "rejected",
                  result: { error: error instanceof Error ? error.message : "Unknown error" },
                }
              : f,
          ),
        )
      } finally {
        setProcessingMessageId(null)
        setExecutingFunction(false)
      }
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  const clearChat = () => {
    setMessages([])
    setFunctionCalls([])
    toast({
      title: "Chat cleared",
      description: "All chat messages have been removed.",
    })
  }

  const handleSelectChat = (chatId: number, chatMessages: Array<{ role: string; content: string }>) => {
    setActiveChat(chatId)
    const formattedMessages = chatMessages.map((msg, index) => ({
      role: msg.role as "user" | "assistant" | "system" | "function",
      content: msg.content,
      id: `history-${chatId}-${index}`,
    }))
    setMessages(formattedMessages)
    setFunctionCalls([])
  }

  const handleNewChat = () => {
    setActiveChat(null)
    setMessages([])
    setFunctionCalls([])
  }

  // Calculate content area width based on panel states
  const getContentWidth = () => {
    const baseClasses = "flex flex-col rounded-xl border h-full max-h-full overflow-hidden transition-all duration-300 bg-background/50 backdrop-blur-sm"

    // Both panels are expanded
    if (!isHistoryPanelCollapsed && !isPromptsPanelCollapsed) {
      return cn(baseClasses, "flex-1")
    }

    // Only history panel is collapsed
    if (isHistoryPanelCollapsed && !isPromptsPanelCollapsed) {
      return cn(baseClasses, "flex-[2]")
    }

    // Only prompts panel is collapsed
    if (!isHistoryPanelCollapsed && isPromptsPanelCollapsed) {
      return cn(baseClasses, "flex-[2]")
    }

    // Both panels are collapsed
    return cn(baseClasses, "flex-[4]")
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background via-background to-background/95">
      <Header />

      <main className="flex-1 container px-0 md:px-4 py-4 flex flex-col max-h-[calc(100vh-4rem)] overflow-hidden">
        {!isConnected ? (
          <div className="flex-1 flex items-center justify-center">
            <WalletRequired />
          </div>
        ) : (
          <ErrorBoundary>
            <div className="grid grid-cols-[auto_1fr_auto] gap-0 md:gap-3 lg:gap-4 h-full max-h-full">
            {/* History Panel */}
            <div
              className={cn(
                "transition-all duration-300 h-full max-h-full overflow-hidden flex flex-col",
                isHistoryPanelCollapsed ? "w-10" : "w-[280px] md:w-[320px]",
              )}
            >
              <div className="flex-1 overflow-hidden">
                <ChatHistory
                  onSelectChat={handleSelectChat}
                  onNewChat={handleNewChat}
                  activeChat={activeChat}
                  currentChain={currentChain}
                  onCollapseChange={setIsHistoryPanelCollapsed}
                  defaultCollapsed={isHistoryPanelCollapsed}
                />
              </div>

              {!isHistoryPanelCollapsed && (
                  <div className="border-t mt-auto p-2 bg-background/50 backdrop-blur-sm rounded-b-xl">
                  <TransactionQueue
                    chainId={currentChain}
                    inPanel={true}
                    functionCalls={functionCalls}
                    onFunctionStatusChange={handleFunctionStatusChange}
                  />
                </div>
              )}
            </div>

            {/* Main Chat Area */}
            <div className={getContentWidth()}>
                <div className="border-b px-5 py-3 flex justify-between items-center flex-shrink-0 bg-muted/30">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                  <h2 className="text-sm font-medium">{activeChat ? "Conversation" : "New Chat"}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                    className="text-xs h-8 hover:bg-background/80 hover:text-foreground"
                  disabled={messages.length === 0}
                >
                  <RotateCcw size={14} className="mr-1" />
                  Clear
                </Button>
              </div>

                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 bg-gradient-to-b from-background via-background/95 to-background/90 relative">
                  {/* Background particle effect */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-[10%] w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl transform -translate-y-1/3"></div>
                    <div className="absolute bottom-0 right-[10%] w-72 h-72 bg-purple-500/10 rounded-full blur-3xl transform translate-y-1/3"></div>
                  </div>

                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 md:p-8 relative z-10">
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-xl shadow-purple-500/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_75%)] animate-[ping_4s_ease-in-out_infinite]"></div>
                        <Sparkles className="h-12 w-12 text-white relative z-10" />
                    </div>
                      <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">AxiosChat</h3>
                      <h4 className="text-xl font-semibold mt-2">Your Web3 AI Assistant</h4>
                    <p className="text-muted-foreground text-sm mt-2 max-w-md">
                        Ask me anything about blockchain, crypto, or web3 development. I'm here to assist!
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8 max-w-2xl w-full">
                        <Button 
                          variant="outline" 
                          className="p-4 h-auto flex flex-col items-start gap-2 shadow-sm hover:shadow-md transition-all text-left border-muted-foreground/20 hover:border-indigo-500/30 hover:bg-indigo-500/5 group"
                          onClick={() => setInput("What is a blockchain?")}
                        >
                          <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-indigo-500/10 transition-colors">
                            <Command className="h-4 w-4 text-indigo-500" />
                          </div>
                          <span className="font-medium">What is a blockchain?</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="p-4 h-auto flex flex-col items-start gap-2 shadow-sm hover:shadow-md transition-all text-left border-muted-foreground/20 hover:border-purple-500/30 hover:bg-purple-500/5 group"
                          onClick={() => setInput("How do smart contracts work?")}
                        >
                          <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-purple-500/10 transition-colors">
                            <CircleHelp className="h-4 w-4 text-purple-500" />
                          </div>
                          <span className="font-medium">How do smart contracts work?</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="p-4 h-auto flex flex-col items-start gap-2 shadow-sm hover:shadow-md transition-all text-left border-muted-foreground/20 hover:border-pink-500/30 hover:bg-pink-500/5 group"
                          onClick={() => setInput("Explain DeFi in simple terms")}
                        >
                          <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-pink-500/10 transition-colors">
                            <CircleHelp className="h-4 w-4 text-pink-500" />
                          </div>
                          <span className="font-medium">Explain DeFi in simple terms</span>
                        </Button>
                      </div>
                  </div>
                ) : (
                  <ChatMessages
                    messages={messages
                      .filter((m) => m.role !== "function" || debugMode) // Show function messages only in debug mode
                      .map((m) => ({ role: m.role, content: m.content }))}
                  />
                )}
                <div ref={messagesEndRef} />
              </div>

                <div className="border-t p-4 md:p-5 flex-shrink-0 bg-gradient-to-b from-muted/5 via-muted/10 to-muted/20 backdrop-blur-sm relative">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute bottom-0 left-1/4 w-1/2 h-1/2 bg-indigo-500/5 rounded-full blur-3xl"></div>
                  </div>
                  
                <ModelSelector
                  useOpenAI={useOpenAI}
                  onUseOpenAIChange={setUseOpenAI}
                  showSettings={showEndpointSettings}
                  onShowSettingsChange={setShowEndpointSettings}
                  llamaEndpoint={llamaEndpoint}
                  onLlamaEndpointChange={setLlamaEndpoint}
                  openaiApiKey={apiKeys.openai || ""}
                  onOpenAIApiKeyChange={(key) => updateApiKey("openai", key)}
                  replicateApiKey={apiKeys.replicate || ""}
                  onReplicateApiKeyChange={(key) => updateApiKey("replicate", key)}
                    className="mb-4 relative z-10"
                  debugMode={debugMode}
                  onDebugModeChange={setDebugMode}
                />

                  <ErrorBoundary>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (input.trim()) {
                          handleSubmit(e);
                        }
                      }} 
                      className="flex space-x-3 relative z-10"
                    >
                      <div className="flex-1 flex border-2 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 bg-background/80 backdrop-blur-sm shadow-lg transition-all duration-200 relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 rounded-full"></div>
                    <Input
                          placeholder="Ask anything about Web3, blockchain, or crypto..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              try {
                                if (input.trim() && !loading && !executingFunction) {
                                  handleSubmit(e as unknown as React.FormEvent);
                                }
                              } catch (error) {
                                console.error('Error handling Enter key submission:', error);
                                setLoading(false);
                                toast({
                                  title: "Error",
                                  description: "Something went wrong. Please try again.",
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                          className="flex-1 px-5 py-2 border-0 focus-visible:ring-0 focus-visible:ring-transparent h-14 rounded-full bg-transparent relative z-10 text-base"
                        />
                        <div className="flex items-center gap-1 px-2">
                          {/* Keyboard shortcut hint */}
                          <div className="text-xs text-muted-foreground hidden md:flex items-center bg-muted/50 px-2 py-1 rounded-full mr-1">
                            <span>⌘</span>
                            <span className="mx-1">+</span>
                            <span>Enter</span>
                          </div>
                        </div>
                  </div>
                  <Button
                        type="button"
                        onClick={(e) => {
                          try {
                            if (!loading && input.trim() && !executingFunction) {
                              handleSubmit(e as unknown as React.FormEvent);
                            }
                          } catch (error) {
                            console.error('Error handling button click:', error);
                            setLoading(false);
                            toast({
                              title: "Error",
                              description: "Something went wrong. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                    disabled={loading || !input.trim() || executingFunction}
                        className={cn(
                          "h-14 px-5 whitespace-nowrap rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40",
                          loading || executingFunction || !input.trim() ? "opacity-70" : "opacity-100"
                        )}
                  >
                    {loading || executingFunction ? (
                          <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <>
                            <span className="hidden sm:inline-block mr-2">Send</span>
                            <Send className="h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
                  </ErrorBoundary>
              </div>
            </div>

            {/* Suggested Prompts Panel */}
            <div
              className={cn(
                "transition-all duration-300 h-full max-h-full overflow-hidden",
                isPromptsPanelCollapsed ? "w-10" : "w-[260px] lg:w-[300px]",
              )}
            >
              <SuggestedPromptsPanel
                onSelectQuestion={handleSuggestedQuestion}
                onCollapseChange={setIsPromptsPanelCollapsed}
                defaultCollapsed={isPromptsPanelCollapsed}
              />
            </div>
          </div>
          </ErrorBoundary>
        )}
      </main>
    </div>
  )
}

export default Chat
