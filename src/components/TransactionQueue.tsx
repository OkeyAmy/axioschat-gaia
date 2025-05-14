"use client"

import type React from "react"
import { useEffect } from "react"
import { useTransactionQueue } from "@/hooks/useTransactionQueue"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react"
import { getTxUrl } from "@/utils/blockchain"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

// Update the component props to accept functionCalls and onFunctionStatusChange
interface TransactionQueueProps {
  chainId?: number
  inPanel?: boolean
  className?: string
  functionCalls?: any[]
  onFunctionStatusChange?: (id: string, status: "approved" | "rejected" | "executed", result?: any) => void
}

// Update the component to render both transaction queue and function queue
const TransactionQueue: React.FC<TransactionQueueProps> = ({
  chainId = 1,
  inPanel = false,
  className,
  functionCalls = [],
  onFunctionStatusChange,
}) => {
  const { queue, removeFromQueue, executeNext, isProcessing } = useTransactionQueue()

  // Auto-execute next transaction when queue changes
  useEffect(() => {
    // Auto-execute next transaction when queue changes
    const executeApprovedFunctions = async () => {
      if (queue.length > 0 && !isProcessing) {
        const pendingTx = queue.find((tx) => tx.status === "pending")
        if (pendingTx) {
          executeNext()
        }
      }
    }

    executeApprovedFunctions()

    // Log the queue for debugging
    console.log("Transaction queue updated:", queue)
  }, [queue, isProcessing, executeNext])

  // If displayed in panel, render inline
  if (inPanel) {
    const hasFunctions = functionCalls && functionCalls.length > 0 && onFunctionStatusChange
    const hasTransactions = queue.length > 0

    if (!hasFunctions && !hasTransactions) {
      return (
        <div className={cn("text-center py-2 text-xs text-muted-foreground", className)}>No pending operations</div>
      )
    }

    return (
      <div className={cn("flex flex-col gap-2 max-h-full overflow-hidden", className)}>
        <h3 className="text-xs font-medium mb-1 text-muted-foreground">Web3 Operations</h3>

        {/* Function Queue */}
        {hasFunctions && (
          <ScrollArea className="max-h-[120px]">
            <div className="space-y-1 pr-3">
              {functionCalls.map((func) => (
                <div
                  key={func.id}
                  className={cn(
                    "text-xs p-1.5 rounded border flex items-center justify-between",
                    func.status === "executed" && "border-emerald-500/20 bg-emerald-500/5",
                    func.status === "rejected" && "border-red-500/20 bg-red-500/5",
                    func.status === "pending" && "border-muted/20 bg-card/95",
                  )}
                >
                  <div className="flex items-center gap-1 truncate">
                    {func.status === "executed" && <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />}
                    {func.status === "rejected" && <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />}
                    {func.status === "pending" && (
                      <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/20 flex-shrink-0" />
                    )}
                    <span className="truncate max-w-[120px]">{func.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {func.status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 flex-shrink-0"
                          onClick={() => onFunctionStatusChange(func.id, "approved")}
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 flex-shrink-0"
                          onClick={() => onFunctionStatusChange(func.id, "rejected")}
                        >
                          <X className="h-3 w-3 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Transaction Queue */}
        {hasTransactions && (
          <ScrollArea className="max-h-[120px]">
            <div className="space-y-2 pr-3">
              {queue.map((tx) => (
                <Card
                  key={tx.id}
                  className={cn(
                    "shadow-sm border transition-colors",
                    tx.status === "success" && "border-emerald-500/20 bg-emerald-500/5",
                    tx.status === "failed" && "border-red-500/20 bg-red-500/5",
                    tx.status === "processing" && "border-amber-500/20 bg-amber-500/5",
                    tx.status === "pending" && "border-muted/20 bg-card/95",
                  )}
                >
                  <CardContent className="p-2 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        {tx.status === "processing" && <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />}
                        {tx.status === "success" && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                        {tx.status === "failed" && <AlertCircle className="h-3 w-3 text-red-500" />}
                        {tx.status === "pending" && (
                          <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/20" />
                        )}
                        <span className="font-medium truncate max-w-[150px]">{tx.type}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 ml-1 flex-shrink-0"
                        onClick={() => removeFromQueue(tx.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground truncate max-w-[220px]">{tx.description}</p>

                    {tx.error && <p className="text-xs text-red-500 mt-1 truncate max-w-[220px]">{tx.error}</p>}

                    {tx.txHash && (
                      <div className="mt-1 pt-1 border-t border-border/30 flex justify-end">
                        <a
                          href={getTxUrl(chainId, tx.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/90 text-xs flex items-center"
                        >
                          View
                          <ExternalLink className="ml-1 h-2 w-2" />
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    )
  }

  // Default floating version - only show if there are transactions
  if (queue.length === 0) return null

  return (
    <div className={cn("fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]", className)}>
      <ScrollArea className="max-h-[60vh]">
        <div className="flex flex-col gap-2 p-1">
          {queue.map((tx) => (
            <Card
              key={tx.id}
              className={cn(
                "shadow-lg border transition-colors",
                tx.status === "success" && "border-emerald-500/20 bg-emerald-500/5",
                tx.status === "failed" && "border-red-500/20 bg-red-500/5",
                tx.status === "processing" && "border-amber-500/20 bg-amber-500/5",
                tx.status === "pending" && "border-muted/20 bg-card/95",
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {tx.status === "processing" && <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />}
                    {tx.status === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {tx.status === "failed" && <AlertCircle className="h-4 w-4 text-red-500" />}
                    {tx.status === "pending" && (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/20" />
                    )}
                    <span className="font-medium text-sm truncate max-w-[180px]">{tx.type}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={() => removeFromQueue(tx.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground truncate max-w-[250px]">{tx.description}</p>

                {tx.error && <p className="text-xs text-red-500 mt-1 truncate max-w-[250px]">{tx.error}</p>}

                {tx.txHash && (
                  <div className="mt-2 pt-2 border-t border-border/30 flex justify-end">
                    <a
                      href={getTxUrl(chainId, tx.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/90 text-xs flex items-center"
                    >
                      View on Explorer
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export default TransactionQueue
