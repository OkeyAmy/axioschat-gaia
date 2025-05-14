import { toast } from "@/components/ui/use-toast"

export interface FlockWeb3Request {
  query: string
  tools: string
  top_p?: number
  temperature?: number
  max_new_tokens?: number
}

// Get Replicate API token from localStorage
const getReplicateApiToken = (): string => {
  try {
    const apiKeys = localStorage.getItem("apiKeys")
    if (apiKeys) {
      const parsed = JSON.parse(apiKeys)
      return parsed.replicate || ""
    }
  } catch (error) {
    console.error("Error retrieving Replicate API token:", error)
  }
  return ""
}

// Update the callFlockWeb3 function to implement a retry mechanism for cold starts
export const callFlockWeb3 = async (
  input: FlockWeb3Request,
): Promise<string | { text?: string; error?: string; functionCalls?: any[] }> => {
  try {
    const REPLICATE_API_TOKEN = getReplicateApiToken()

    if (!REPLICATE_API_TOKEN) {
      toast({
        title: "API Token Missing",
        description: "Please provide a Replicate API token in the settings",
        variant: "destructive",
      })
      return "Error: Please provide a Replicate API token in the settings"
    }

    console.log("Calling Replicate API with input:", {
      query: input.query.substring(0, 50) + "...",
      temperature: input.temperature,
      top_p: input.top_p,
    })

    // Format the request body according to Replicate's API documentation
    const requestBody = {
      version: "3babfa32ab245cf8e047ff7366bcb4d5a2b4f0f108f504c47d5a84e23c02ff5f",
      input: {
        query: input.query,
        tools: input.tools,
        top_p: input.top_p || 0.9,
        temperature: input.temperature || 0.7,
        max_new_tokens: input.max_new_tokens || 3000,
      },
    }

    console.log("Request body:", JSON.stringify(requestBody, null, 2))

    // Implement retry mechanism for cold starts
    const maxRetries = 2
    let retryCount = 0
    let responseData

    while (retryCount <= maxRetries) {
      try {
        // Make sure to use the correct URL for your Python proxy server
        const response = await fetch("http://localhost:3000/api/replicate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Replicate-API-Token": REPLICATE_API_TOKEN,
          },
          body: JSON.stringify(requestBody),
        })

        console.log("Proxy response status:", response.status)

        if (!response.ok) {
          let errorMessage = `Proxy API Error (${response.status}): `
          try {
            const errorData = await response.json()
            console.error("Proxy API Error Response:", errorData)
            errorMessage += errorData.detail || errorData.error || "Unknown error"
          } catch (e) {
            errorMessage += "Could not parse error response"
          }
          throw new Error(errorMessage)
        }

        responseData = await response.json()
        console.log("Proxy response data:", responseData)

        // Check if we got a null output (cold start)
        if (responseData.output === null) {
          console.log(`Attempt ${retryCount + 1}: Replicate returned null output (cold start). Retrying...`)
          retryCount++

          if (retryCount <= maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
            continue
          }
        } else {
          // We got a valid response, break out of the retry loop
          break
        }
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error)
        retryCount++

        if (retryCount <= maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
          continue
        }
        throw error
      }
    }

    if (!responseData || responseData.error) {
      throw new Error(responseData?.error || "No valid response from Replicate")
    }

    // Handle the output from the Replicate API
    if (responseData.output) {
      console.log("Complete output from Replicate:", responseData.output)

      // If the output is a string, try to parse it as JSON
      if (typeof responseData.output === "string") {
        try {
          const parsed = JSON.parse(responseData.output)

          // If it's an array of function calls, process them
          if (Array.isArray(parsed)) {
            const functionCalls = parsed.map((item) => {
              if (typeof item === "string" && (item.startsWith("{") || item.startsWith("["))) {
                try {
                  return JSON.parse(item)
                } catch {
                  return item
                }
              }
              return item
            })

            return { functionCalls }
          }

          return parsed
        } catch {
          // If it's not valid JSON, return the raw string
          return responseData.output
        }
      }

      // If the output is an array, try to extract function calls
      if (Array.isArray(responseData.output)) {
        try {
          // Process each item in the array
          const functionCalls = responseData.output.map((item) => {
            if (typeof item === "string") {
              try {
                // First try to parse the string as JSON
                const parsed = JSON.parse(item)

                // If the parsed result is a string that looks like JSON (happens with double-encoded JSON)
                if (typeof parsed === "string" && (parsed.startsWith("{") || parsed.startsWith("["))) {
                  try {
                    // Try to parse it again
                    return JSON.parse(parsed)
                  } catch {
                    return parsed
                  }
                }

                return parsed
              } catch {
                return item
              }
            }
            return item
          })

          console.log("Parsed function calls:", functionCalls)
          return { functionCalls }
        } catch (e) {
          console.error("Error parsing function calls:", e)
          return { text: `The model returned: ${JSON.stringify(responseData.output)}` }
        }
      }

      // If we can't determine the format, return the raw output
      return { text: JSON.stringify(responseData.output) }
    } else {
      console.log("No output field in response. Full response:", responseData)

      // Check for other possible response formats
      if (responseData.completion) {
        return responseData.completion
      }
      if (responseData.generated_text) {
        return responseData.generated_text
      }
    }

    return {
      text: "The model did not return a valid response. This may indicate an issue with the API or the model configuration.",
    }
  } catch (error) {
    console.error("Error calling Flock Web3 model via proxy:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred while calling the AI model"

    toast({
      title: "API Error",
      description: errorMessage,
      variant: "destructive",
    })

    return { error: `Error: ${errorMessage}` }
  }
}

// Function to generate casual responses for greetings and simple interactions
const getCasualResponse = (query: string): string => {
  const lowerQuery = query.toLowerCase().trim()

  if (/^(hi+|hello+|hey+)\s*$/i.test(lowerQuery)) {
    return "Hello! I'm your Web3 assistant. I can help you with questions about blockchain, cryptocurrency, DeFi, NFTs, and other Web3 topics. What would you like to know about today?"
  }

  if (/how are you/i.test(lowerQuery)) {
    return "I'm functioning well, thank you for asking! I'm here to help with your Web3 and blockchain questions. What can I assist you with today?"
  }

  if (/^(what'?s up|how'?s it going)/i.test(lowerQuery)) {
    return "I'm here and ready to help with your Web3 questions! Whether you're curious about blockchain technology, cryptocurrencies, or decentralized applications, I'm happy to assist."
  }

  if (/^good (morning|afternoon|evening)/i.test(lowerQuery)) {
    const timeOfDay = lowerQuery.match(/morning|afternoon|evening/i)?.[0] || "day"
    return `Good ${timeOfDay}! I'm your Web3 assistant. How can I help you with blockchain or crypto today?`
  }

  if (/^no+\s*$/i.test(lowerQuery) || /^stop+\s*$/i.test(lowerQuery)) {
    return "I understand. Let's change the subject. I'm here to help with Web3 topics like blockchain, cryptocurrency, DeFi, NFTs, and more. What would you like to discuss?"
  }

  if (/just chat|let'?s talk|can we chat/i.test(lowerQuery)) {
    return "I'd be happy to chat! I'm specialized in Web3 topics like blockchain technology, cryptocurrencies, DeFi protocols, NFTs, DAOs, and the broader crypto ecosystem. What aspect of Web3 interests you the most?"
  }

  // Default response for other casual interactions
  return "I'm your Web3 assistant, specialized in blockchain technology, cryptocurrencies, DeFi, NFTs, and other Web3 topics. How can I help you today?"
}

// Create default web3 tools JSON string
export const createDefaultWeb3Tools = (): string => {
  const tools = [
    {
      type: "function",
      function: {
        name: "get_token_price",
        description: "Get the price of a token in USD",
        parameters: {
          type: "object",
          properties: {
            token_symbol: {
              type: "string",
              description: "The token symbol (e.g., ETH, BTC, SOL)",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_gas_price",
        description: "Get the current gas price in Gwei",
        parameters: {
          type: "object",
          properties: {
            chain: {
              type: "string",
              description: "The blockchain to get gas price for (e.g., ethereum, binance)",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "send_token",
        description: "Send tokens to an address",
        parameters: {
          type: "object",
          properties: {
            token_address: {
              type: "string",
              description: "The token address (use 'native' for ETH, BNB, etc.)",
            },
            to_address: {
              type: "string",
              description: "The recipient address",
            },
            amount: {
              type: "string",
              description: "The amount to send",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "swap_tokens",
        description: "Swap tokens on a decentralized exchange",
        parameters: {
          type: "object",
          properties: {
            token_in: {
              type: "string",
              description: "The input token address or symbol",
            },
            token_out: {
              type: "string",
              description: "The output token address or symbol",
            },
            amount_in: {
              type: "string",
              description: "The input amount",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "add_liquidity",
        description: "Add liquidity to a DEX pool",
        parameters: {
          type: "object",
          properties: {
            token_a: {
              type: "string",
              description: "First token address or symbol",
            },
            token_b: {
              type: "string",
              description: "Second token address or symbol",
            },
            amount_a: {
              type: "string",
              description: "Amount of first token",
            },
            amount_b: {
              type: "string",
              description: "Amount of second token",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_token_balance",
        description: "Get token balance for an address",
        parameters: {
          type: "object",
          properties: {
            token_address: {
              type: "string",
              description: "The token address (use 'native' for ETH, BNB, etc.)",
            },
            wallet_address: {
              type: "string",
              description: "The wallet address to check balance for",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "explain_transaction",
        description: "Explain a blockchain transaction",
        parameters: {
          type: "object",
          properties: {
            transaction_hash: {
              type: "string",
              description: "The transaction hash to explain",
            },
            chain_id: {
              type: "string",
              description: "The chain ID (e.g., 1 for Ethereum, 56 for BSC)",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "estimate_gas",
        description: "Estimate gas cost for a transaction",
        parameters: {
          type: "object",
          properties: {
            from_address: {
              type: "string",
              description: "The sender address",
            },
            to_address: {
              type: "string",
              description: "The recipient address",
            },
            data: {
              type: "string",
              description: "The transaction data (hex)",
            },
            value: {
              type: "string",
              description: "The transaction value in wei",
            },
          },
        },
      },
    },
  ]

  return JSON.stringify(tools)
}
