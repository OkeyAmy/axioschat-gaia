"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, X, AlertCircle, Loader2 } from "lucide-react"
import type { FunctionCall } from "@/services/aiService"

interface FunctionQueueProps {
  functions: FunctionCall[]
  onStatusChange: (id: string, status: "approved" | "rejected" | "executed", result?: any) => void
  walletAddress?: string
  chain?: number
}

const FunctionQueue: React.FC<FunctionQueueProps> = ({ 
  functions, 
  onStatusChange,
  walletAddress,
  chain
}) => {
  const pendingFunctions = functions.filter((func) => func.status === "pending")
  const approvedFunctions = functions.filter((func) => func.status === "approved")
  const executedFunctions = functions.filter((func) => func.status === "executed")
  const rejectedFunctions = functions.filter((func) => func.status === "rejected")

  const handleApprove = async (func: FunctionCall) => {
    onStatusChange(func.id, "approved")

    // Simulate function execution
    setTimeout(() => {
      let result
      switch (func.name) {
        case "get_token_balance":
          result = {
            balance: "42.38",
            token: func.arguments.token_address === "native" ? "BNB" : "TOKEN",
            wallet_address: walletAddress || func.arguments.wallet_address
          }
          break
        case "get_token_price":
          result = {
            price: "276.45",
            change24h: "+2.3%",
          }
          break
        case "get_gas_price":
          result = {
            price: "25",
            unit: "Gwei",
            chain: chain || func.arguments.chain
          }
          break
        case "send_token":
          result = {
            txHash: "0x" + Math.random().toString(16).substring(2, 42),
            status: "confirmed",
          }
          break
        case "swap_tokens":
          result = {
            txHash: "0x" + Math.random().toString(16).substring(2, 42),
            status: "confirmed",
            amountOut: (Number.parseFloat(func.arguments.amount_in) * 276.45).toFixed(2),
          }
          break
        default:
          result = {
            status: "success",
            message: "Function executed successfully",
          }
      }

      onStatusChange(func.id, "executed", result)
    }, 2000)
  }

  const handleReject = (func: FunctionCall) => {
    onStatusChange(func.id, "rejected")
  }

  // Helper function to get a description for a function
  const getFunctionDescription = (name: string): string => {
    const descriptions: Record<string, string> = {
      get_token_balance: "Get token balance for an address",
      get_token_price: "Get the price of a token in USD",
      get_gas_price: "Get the current gas price in Gwei",
      send_token: "Send tokens to an address",
      swap_tokens: "Swap tokens on a decentralized exchange",
      add_liquidity: "Add liquidity to a DEX pool",
      explain_transaction: "Explain a blockchain transaction",
      estimate_gas: "Estimate gas cost for a transaction",
    }

    return descriptions[name] || `Execute ${name} function`
  }

  // Format arguments for display
  const formatArguments = (args: Record<string, any>) => {
    return Object.entries(args).map(([key, value]) => (
      <div key={key} className="text-xs">
        <span className="font-medium">{key}:</span> {String(value)}
      </div>
    ))
  }

  if (functions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {pendingFunctions.length > 0 && (
          <div className="space-y-2">
            {pendingFunctions.map((func) => (
            <Card key={func.id} className="border-indigo-200 dark:border-indigo-900 shadow-sm">
              <CardHeader className="py-2 px-3">
                  <div className="flex justify-between items-start">
                    <div>
                    <CardTitle className="text-xs font-medium">{func.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{getFunctionDescription(func.name)}</p>
                    </div>
                    <Badge
                      variant="outline"
                    className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                    >
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
              <CardContent className="py-0 px-3 pb-3">
                <div className="text-xs space-y-1">{formatArguments(func.arguments)}</div>
                <div className="flex justify-end gap-1.5 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-950"
                    onClick={() => handleReject(func)}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Reject
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleApprove(func)}
                    className="h-7 px-2 text-xs bg-indigo-500 hover:bg-indigo-600"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                </div>
              </CardContent>
              </Card>
            ))}
        </div>
      )}

      {approvedFunctions.length > 0 && (
          <div className="space-y-2">
            {approvedFunctions.map((func) => (
            <Card key={func.id} className="border-blue-200 dark:border-blue-900 shadow-sm">
              <CardHeader className="py-2 px-3">
                  <div className="flex justify-between items-start">
                    <div>
                    <CardTitle className="text-xs font-medium">{func.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{getFunctionDescription(func.name)}</p>
                    </div>
                    <Badge
                      variant="outline"
                    className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800 flex items-center"
                    >
                    <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
                      Processing
                    </Badge>
                  </div>
                </CardHeader>
              <CardContent className="py-0 px-3 pb-3">
                <div className="text-xs space-y-1">{formatArguments(func.arguments)}</div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {executedFunctions.length > 0 && (
          <div className="space-y-2">
          {executedFunctions.slice(0, 2).map((func) => (
            <Card key={func.id} className="border-green-200 dark:border-green-900 shadow-sm">
              <CardHeader className="py-2 px-3">
                  <div className="flex justify-between items-start">
                    <div>
                    <CardTitle className="text-xs font-medium">{func.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{getFunctionDescription(func.name)}</p>
                    </div>
                    <Badge
                      variant="outline"
                    className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800 flex items-center"
                    >
                    <Check className="h-2.5 w-2.5 mr-1" />
                      Completed
                    </Badge>
                  </div>
                </CardHeader>
              <CardContent className="py-0 px-3 pb-3">
                <div className="text-xs space-y-1">
                    {func.result && (
                    <div className="text-xs whitespace-pre-wrap font-mono bg-muted/30 p-1.5 rounded text-muted-foreground overflow-hidden text-ellipsis max-h-20">
                          {typeof func.result === "string" ? func.result : JSON.stringify(func.result, null, 2)}
                        </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}

export default FunctionQueue
