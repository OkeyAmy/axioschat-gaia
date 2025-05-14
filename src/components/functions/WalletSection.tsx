"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, DollarSign, Settings, Banknote, Network } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FunctionCard } from "./FunctionCard"
import { useWeb3 } from "@/hooks/useWeb3"
import { useSwitchChain } from "wagmi"
import { mainnet, polygon, optimism, arbitrum, base, zora, bsc, avalanche } from "wagmi/chains"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { getTokenBalance } from "@/utils/blockchain"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

// Custom EduChain definition
const educhain = {
  id: 98432,
  name: "EduChain",
  nativeCurrency: {
    decimals: 18,
    name: "EduChain",
    symbol: "EDU",
  },
  rpcUrls: {
    default: { http: ["https://rpc.edutestnet.io"] },
  },
}

// Common ERC20 tokens
const commonTokens = {
  [mainnet.id]: [
    { symbol: "ETH", name: "Ethereum", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
    { symbol: "USDT", name: "Tether USD", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
    { symbol: "USDC", name: "USD Coin", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
    { symbol: "DAI", name: "Dai Stablecoin", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
  ],
  [polygon.id]: [
    { symbol: "MATIC", name: "Polygon", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
    { symbol: "USDT", name: "Tether USD", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" },
    { symbol: "USDC", name: "USD Coin", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" },
  ],
  [bsc.id]: [
    { symbol: "BNB", name: "Binance Coin", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
    { symbol: "USDT", name: "Tether USD", address: "0x55d398326f99059fF775485246999027B3197955" },
    { symbol: "BUSD", name: "Binance USD", address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56" },
    { symbol: "CAKE", name: "PancakeSwap", address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82" },
  ],
  [optimism.id]: [
    { symbol: "ETH", name: "Ethereum", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
    { symbol: "OP", name: "Optimism", address: "0x4200000000000000000000000000000000000042" },
    { symbol: "USDC", name: "USD Coin", address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607" },
  ],
  [arbitrum.id]: [
    { symbol: "ETH", name: "Ethereum", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
    { symbol: "ARB", name: "Arbitrum", address: "0x912CE59144191C1204E64559FE8253a0e49E6548" },
    { symbol: "USDC", name: "USD Coin", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" },
  ],
  [base.id]: [
    { symbol: "ETH", name: "Ethereum", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
    { symbol: "USDC", name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
  ],
  [zora.id]: [
    { symbol: "ETH", name: "Ethereum", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
    { symbol: "USDC", name: "USD Coin", address: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4" },
  ],
  [avalanche.id]: [
    { symbol: "AVAX", name: "Avalanche", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
    { symbol: "USDC", name: "USD Coin", address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E" },
    { symbol: "USDT", name: "Tether USD", address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7" },
    { symbol: "JOE", name: "Trader Joe", address: "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd" },
  ],
  [educhain.id]: [{ symbol: "EDU", name: "EduChain", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" }],
}

interface WalletSectionProps {
  currentChain: number
  setCurrentChain: (chainId: number) => void
}

// Updated chains array to include BSC and EduChain
const availableChains = [mainnet, polygon, optimism, arbitrum, base, zora, bsc, avalanche, educhain]

// Function to get chain color
const getChainColor = (chainId: number) => {
  const colors: Record<number, string> = {
    [mainnet.id]: "from-green-500 to-green-600",
    [polygon.id]: "from-purple-500 to-purple-600",
    [optimism.id]: "from-red-500 to-red-600",
    [arbitrum.id]: "from-blue-500 to-blue-600",
    [base.id]: "from-blue-600 to-blue-700",
    [zora.id]: "from-pink-500 to-pink-600",
    [bsc.id]: "from-yellow-500 to-yellow-600",
    [avalanche.id]: "from-red-600 to-red-700",
    [educhain.id]: "from-green-400 to-green-500",
  }
  return colors[chainId] || "from-gray-500 to-gray-600"
}

const WalletSection: React.FC<WalletSectionProps> = ({ currentChain, setCurrentChain }) => {
  const { web3, isReady, address } = useWeb3()
  const [balance, setBalance] = useState<string>("0")
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [selectedToken, setSelectedToken] = useState("native")
  const [customTokenAddress, setCustomTokenAddress] = useState("")
  const [showCustomToken, setShowCustomToken] = useState(false)
  const { switchChain } = useSwitchChain()

  // Get tokens for current chain
  const tokensForChain = commonTokens[currentChain as keyof typeof commonTokens] || []

  useEffect(() => {
    fetchBalance()
  }, [web3, address, currentChain, selectedToken])

  const fetchBalance = async () => {
    if (web3 && address) {
      try {
        setBalanceLoading(true)

        if (selectedToken === "native" || selectedToken === "custom") {
          // Native token balance
          const tokenAddress =
            selectedToken === "custom" && customTokenAddress
              ? customTokenAddress
              : "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

          if (selectedToken === "native") {
            const balance = await web3.eth.getBalance(address)
            setBalance(web3.utils.fromWei(balance, "ether"))
          } else {
            // Custom token
            if (web3.utils.isAddress(customTokenAddress)) {
              const balance = await getTokenBalance(web3, address, customTokenAddress)
              setBalance(balance)
            } else {
              setBalance("Invalid address")
            }
          }
        } else {
          // Known ERC20 token
          const tokenInfo = tokensForChain.find((t) => t.symbol === selectedToken)
          if (tokenInfo && tokenInfo.address !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
            const balance = await getTokenBalance(web3, address, tokenInfo.address)
            setBalance(balance)
          } else {
            // Native token (ETH/MATIC/BNB etc)
            const balance = await web3.eth.getBalance(address)
            setBalance(web3.utils.fromWei(balance, "ether"))
          }
        }

        setBalanceLoading(false)
      } catch (error) {
        console.error("Error fetching balance:", error)
        setBalance("Error")
        setBalanceLoading(false)
      }
    }
  }

  const handleNetworkSwitch = (networkId: string) => {
    const chainId = Number.parseInt(networkId)
    setCurrentChain(chainId)
    // Reset token selection when changing networks
    setSelectedToken("native")
    setShowCustomToken(false)

    if (switchChain) {
      try {
        switchChain({ chainId })
      } catch (error) {
        console.error("Error switching chain:", error)
      }
    }
  }

  const getNativeSymbol = () => {
    const chain = availableChains.find((c) => c.id === currentChain)
    return chain?.nativeCurrency?.symbol || "ETH"
  }

  const getNativeSymbolForBalance = () => {
    if (selectedToken === "custom") return ""
    if (selectedToken === "native") return getNativeSymbol()
    return selectedToken
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <FunctionCard
        title="Wallet Balance"
        description="Check current balance across different chains and tokens"
        icon={Banknote}
      >
        <div className="space-y-5">
          <div className="px-4 py-5 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground font-medium">Current Balance</p>
              <Button variant="ghost" size="sm" onClick={fetchBalance} className="h-7 px-2">
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Refresh</span>
              </Button>
            </div>
            {balanceLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold tracking-tight">
                  {Number.parseFloat(balance).toFixed(4)}
                </p>
                <p className="text-sm font-medium text-primary">
                  {getNativeSymbolForBalance()}
                </p>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Select Token</Label>
            <Select
              value={selectedToken}
              onValueChange={(value) => {
                setSelectedToken(value)
                setShowCustomToken(value === "custom")
              }}
            >
                <SelectTrigger className="bg-background/80">
                <SelectValue placeholder="Select Token" />
              </SelectTrigger>
              <SelectContent>
                  <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b">
                    <span className="text-xs font-semibold">Available Tokens</span>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                      {tokensForChain.length} tokens
                    </Badge>
                  </div>
                  <SelectItem value="native">
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mr-2">
                        <DollarSign className="h-3 w-3 text-primary" />
                      </div>
                      {getNativeSymbol()} (Native)
                    </div>
                  </SelectItem>

                {tokensForChain.map((token) => {
                  if (token.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") return null
                  return (
                    <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex items-center">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mr-2">
                            <span className="text-[10px] font-bold text-primary">{token.symbol.charAt(0)}</span>
                          </div>
                      {token.symbol} - {token.name}
                        </div>
                    </SelectItem>
                  )
                })}

                  <SelectItem value="custom">
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center mr-2">
                        <span className="text-[10px] font-bold">+</span>
                      </div>
                      Custom Token...
                    </div>
                  </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showCustomToken && (
            <div className="space-y-2 animate-in fade-in-50">
                <Label htmlFor="custom-token-address" className="text-xs text-muted-foreground mb-1.5 block">Custom Token Address</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-token-address"
                  placeholder="0x..."
                  value={customTokenAddress}
                  onChange={(e) => setCustomTokenAddress(e.target.value)}
                    className="flex-1 bg-background/80"
                />
                  <Button size="sm" variant="secondary" onClick={fetchBalance} className="whitespace-nowrap px-3">
                  Check
                </Button>
              </div>
            </div>
          )}

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Network</Label>
            <Select value={currentChain?.toString()} onValueChange={handleNetworkSwitch}>
                <SelectTrigger className="bg-background/80">
                <SelectValue placeholder="Select Network" />
              </SelectTrigger>
              <SelectContent>
                {availableChains.map((chainOption) => (
                  <SelectItem key={chainOption.id} value={chainOption.id.toString()}>
                      <div className="flex items-center">
                        <div className={cn(
                          "w-2 h-2 rounded-full mr-2 bg-gradient-to-br",
                          getChainColor(chainOption.id)
                        )}/>
                    {chainOption.name}
                      </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
          </div>
        </div>
      </FunctionCard>

      <FunctionCard title="Network Settings" description="Configure blockchain network settings" icon={Network}>
        <div className="space-y-5">
          <div className="flex flex-col">
            <Label className="text-xs text-muted-foreground mb-1.5">Current Network</Label>
            <div className="bg-gradient-to-br from-background to-muted/50 border border-border/60 rounded-lg p-4 relative overflow-hidden">
              <div className={cn(
                "absolute top-0 left-0 w-1 h-full",
                "bg-gradient-to-b",
                getChainColor(currentChain)
              )}/>
              
              <div className="flex items-center mb-1">
                <div className={cn(
                  "w-3 h-3 rounded-full mr-2 bg-gradient-to-br",
                  getChainColor(currentChain)
                )}/>
                <span className="font-medium">{availableChains.find((c) => c.id === currentChain)?.name || "Unknown"}</span>
              </div>
              <div className="text-xs text-muted-foreground pl-5">
                Chain ID: {currentChain}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Available Networks</Label>
            <div className="grid grid-cols-2 gap-2">
              {availableChains.map((chainOption) => (
                <Button
                  key={chainOption.id}
                  variant={currentChain === chainOption.id ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-auto py-2 px-3 justify-start text-left",
                    currentChain === chainOption.id 
                      ? cn("bg-gradient-to-br", getChainColor(chainOption.id)) 
                      : "bg-background/80 hover:bg-background"
                  )}
                  onClick={() => handleNetworkSwitch(chainOption.id.toString())}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full mr-2",
                    currentChain === chainOption.id 
                      ? "bg-white" 
                      : cn("bg-gradient-to-br", getChainColor(chainOption.id))
                  )}/>
                  <span className="text-xs">{chainOption.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </FunctionCard>
    </div>
  )
}

export default WalletSection
