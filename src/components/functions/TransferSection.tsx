"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Wallet, User, Loader2, SendHorizonal, Copy, Check, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import useWeb3 from "@/hooks/useWeb3"
import { useTransactionQueue } from "@/hooks/useTransactionQueue"
import { getTokenBalance, transferToken, transferNativeToken, convertToTokenUnits } from "@/utils/blockchain"
import { COMMON_TOKENS } from "@/utils/blockchain/constants"
import { FunctionCard } from "./FunctionCard"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const TransferSection: React.FC = () => {
  const { web3, isReady, address, chainId } = useWeb3()
  const { addTransaction } = useTransactionQueue()
  const navigate = useNavigate()

  const [recipient, setRecipient] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [selectedToken, setSelectedToken] = useState<string>(chainId === 137 ? "MATIC" : "ETH")
  const [isTransferring, setIsTransferring] = useState<boolean>(false)
  const [availableTokens, setAvailableTokens] = useState<Array<{ symbol: string; address: string; decimals: number }>>(
    [],
  )
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({})
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false)
  const [recipientCopied, setRecipientCopied] = useState<boolean>(false)

  // Update available tokens when chain changes
  useEffect(() => {
    if (chainId) {
      // Set default token based on chain
      if (chainId === 137) {
        setSelectedToken("MATIC")
      } else if (chainId === 56) {
        setSelectedToken("BNB")
      } else if (chainId === 43114) {
        setSelectedToken("AVAX")
      } else {
        setSelectedToken("ETH")
      }

      // Get available tokens for this chain
      if (COMMON_TOKENS[chainId]) {
        const tokens = Object.entries(COMMON_TOKENS[chainId]).map(([symbol, data]) => ({
          symbol,
          address: data.address,
          decimals: data.decimals,
        }))
        setAvailableTokens(tokens)
      } else {
        // Default to Ethereum tokens if chain not supported
        const tokens = Object.entries(COMMON_TOKENS[1]).map(([symbol, data]) => ({
          symbol,
          address: data.address,
          decimals: data.decimals,
        }))
        setAvailableTokens(tokens)
      }

      // Reset balances when chain changes
      setTokenBalances({})
    }
  }, [chainId])

  // Load token balances
  useEffect(() => {
    const loadBalances = async () => {
      if (!web3 || !isReady || !address || !chainId || availableTokens.length === 0) {
        return
      }

      setIsLoadingBalances(true)

      try {
        const balances: Record<string, string> = {}

        // Get native token balance
        const nativeBalance = await web3.eth.getBalance(address)
        const nativeSymbol = chainId === 137 ? "MATIC" : chainId === 56 ? "BNB" : chainId === 43114 ? "AVAX" : "ETH"
        balances[nativeSymbol] = web3.utils.fromWei(nativeBalance, "ether")

        // Get ERC20 token balances
        for (const token of availableTokens) {
          if (token.symbol === nativeSymbol) continue

          try {
            const balance = await getTokenBalance(web3, address, token.address)
            balances[token.symbol] = balance
          } catch (error) {
            console.error(`Error loading balance for ${token.symbol}:`, error)
            balances[token.symbol] = "0"
          }
        }

        setTokenBalances(balances)
      } catch (error) {
        console.error("Error loading balances:", error)
        toast({
          title: "Failed to load balances",
          description: "Could not retrieve token balances. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingBalances(false)
      }
    }

    loadBalances()
  }, [web3, isReady, address, chainId, availableTokens])

  const handleTransfer = async () => {
    if (!web3 || !isReady || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to make transfers.",
        variant: "destructive",
      })
      return
    }

    if (!recipient) {
      toast({
        title: "Missing recipient",
        description: "Please enter a recipient address.",
        variant: "destructive",
      })
      return
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to transfer.",
        variant: "destructive",
      })
      return
    }

    // Validate recipient address
    if (!web3.utils.isAddress(recipient)) {
      toast({
        title: "Invalid address",
        description: "The recipient address is not a valid Ethereum address.",
        variant: "destructive",
      })
      return
    }

    setIsTransferring(true)

    try {
      // Find the selected token in available tokens
      const tokenData = availableTokens.find((t) => t.symbol === selectedToken)

      if (!tokenData) {
        throw new Error(`Token ${selectedToken} not found`)
      }

      let txHash: string

      // Check if it's a native token (ETH, MATIC, etc.) or an ERC20 token
      if (tokenData.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
        // Native token transfer
        txHash = await transferNativeToken(web3, recipient, amount, address)
      } else {
        // ERC20 token transfer
        txHash = await transferToken(web3, tokenData.address, recipient, amount, address, tokenData.decimals)
      }

      // Add transaction to queue
      addTransaction({
        hash: txHash,
        from: address,
        to: recipient,
        value: convertToTokenUnits(amount, tokenData.decimals),
        chainId: String(chainId),
        type: "transfer",
        status: "confirmed",
        method: "transfer",
        timestamp: Date.now(),
      })

      toast({
        title: "Transfer Successful",
        description: `Successfully transferred ${amount} ${selectedToken} to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
      })

      // Reset form
      setAmount("")

      // Navigate to transactions page
      navigate("/functions/transactions")
    } catch (error) {
      console.error("Error transferring tokens:", error)

      toast({
        title: "Transfer Failed",
        description: error instanceof Error ? error.message : "Failed to transfer tokens",
        variant: "destructive",
      })
    } finally {
      setIsTransferring(false)
    }
  }

  const handleSetSelfAsRecipient = () => {
    if (address) {
      setRecipient(address)
    } else {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to use this feature.",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setRecipientCopied(true)
      
      setTimeout(() => {
        setRecipientCopied(false)
      }, 2000)
      
      toast({
        title: "Copied to clipboard",
        description: "The address has been copied to your clipboard.",
      })
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <FunctionCard
      title="Transfer Tokens"
      description="Send tokens to any address on the current network"
      icon={SendHorizonal}
    >
      <div className="space-y-5">
        <div className="bg-gradient-to-br from-background to-muted/30 border border-border/60 rounded-lg p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="recipient" className="text-xs text-muted-foreground">Recipient Address</Label>
                <Button 
                  variant="ghost" 
                  onClick={handleSetSelfAsRecipient} 
                  className="h-auto py-1 px-2 text-xs text-muted-foreground"
                >
                  <User className="h-3 w-3 mr-1" />
                  Use My Address
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="recipient"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="bg-background/80 pr-10"
                />
                {recipient && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => copyToClipboard(recipient)}
                  >
                    {recipientCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="amount" className="text-xs text-muted-foreground">Amount</Label>
                  {tokenBalances[selectedToken] && !isLoadingBalances && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => setAmount(tokenBalances[selectedToken])}
                    >
                      <Wallet className="h-3 w-3" />
                      Max: {Number.parseFloat(tokenBalances[selectedToken]).toFixed(6)}
                    </Button>
                  )}
                  {isLoadingBalances && (
                    <Skeleton className="h-4 w-20" />
                  )}
                </div>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.000001"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-background/80"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Token</Label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger className="bg-background/80">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b">
                      <span className="text-xs font-semibold">Available Tokens</span>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                        {availableTokens.length} tokens
                      </Badge>
                    </div>
                    {availableTokens.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mr-2">
                              <span className="text-[10px] font-bold text-primary">{token.symbol.charAt(0)}</span>
                            </div>
                            <span>{token.symbol}</span>
                          </div>
                          {tokenBalances[token.symbol] && !isLoadingBalances && (
                            <span className="text-muted-foreground text-xs ml-2">
                              {Number.parseFloat(tokenBalances[token.symbol]).toFixed(4)}
                            </span>
                          )}
                          {isLoadingBalances && (
                            <Skeleton className="h-3 w-12" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity"
            onClick={handleTransfer}
            disabled={!isReady || isTransferring || !recipient || !amount || Number.parseFloat(amount) <= 0}
          >
            {isTransferring ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Transferring...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <SendHorizonal className="mr-2 h-4 w-4" />
                <span>Transfer {selectedToken}</span>
              </div>
            )}
          </Button>
          
          <div className="flex items-start gap-2 text-xs text-muted-foreground p-2 rounded border border-border/50 bg-muted/30">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Transfer Information</p>
              <p>Ensure you're sending to the correct address on the {chainId === 137 ? "Polygon" : chainId === 56 ? "BSC" : "Ethereum"} network. Check the recipient and amount before proceeding.</p>
            </div>
          </div>
        </div>
      </div>
    </FunctionCard>
  )
}

export default TransferSection
