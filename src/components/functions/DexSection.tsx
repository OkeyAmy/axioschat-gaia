"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowRightLeft, DollarSign, RefreshCw, RotateCw, AlertTriangle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import useWeb3 from "@/hooks/useWeb3"
import { useTransactionQueue } from "@/hooks/useTransactionQueue"
import {
  swapTokensOnUniswap,
  addLiquidity as addLiquidityToPool,
  convertToTokenUnits,
  COMMON_TOKENS,
  UNISWAP_ROUTER_ADDRESSES,
  FACTORY_ADDRESSES,
} from "@/utils/blockchain"

// Implementation of getting pair info
const getPairInfo = async (web3: any, from: string, tokenAAddress: string, tokenBAddress: string, chainId: number) => {
  try {
    // Get the factory address for the current chain
    const factoryAddress = FACTORY_ADDRESSES[chainId] || FACTORY_ADDRESSES[1]

    // Factory ABI for getPair function
    const factoryAbi = [
      {
        constant: true,
        inputs: [
          { internalType: "address", name: "tokenA", type: "address" },
          { internalType: "address", name: "tokenB", type: "address" },
        ],
        name: "getPair",
        outputs: [{ internalType: "address", name: "pair", type: "address" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ]

    // Create factory contract instance
    const factory = new web3.eth.Contract(factoryAbi, factoryAddress)

    try {
      // Try to get the pair address
      const pairAddress = await factory.methods.getPair(tokenAAddress, tokenBAddress).call()

      // If pair doesn't exist
      if (pairAddress === "0x0000000000000000000000000000000000000000") {
        return {
          pairAddress: "0x0000000000000000000000000000000000000000",
          reserveUSD: "0",
          reserve0: "0",
          reserve1: "0",
          exists: false,
        }
      }

      // For a real implementation, we would query the pair contract for reserves
      // For demo purposes, return mock data
      return {
        pairAddress,
        reserveUSD: "100000",
        reserve0: "1000",
        reserve1: "1000",
        exists: true,
      }
    } catch (error) {
      console.error("Error getting pair:", error)
      // Return empty pair info if there's an error
      return {
        pairAddress: "0x0000000000000000000000000000000000000000",
        reserveUSD: "0",
        reserve0: "0",
        reserve1: "0",
        exists: false,
      }
    }
  } catch (error) {
    console.error("Error getting pair info:", error)
    throw error
  }
}

const DexSection: React.FC = () => {
  const { web3, isReady, address, chainId } = useWeb3()
  const { addTransaction } = useTransactionQueue()

  const [fromToken, setFromToken] = useState<string>(chainId === 137 ? "MATIC" : "ETH")
  const [toToken, setToToken] = useState<string>("USDC")
  const [fromAmount, setFromAmount] = useState<string>("")
  const [toAmount, setToAmount] = useState<string>("")
  const [slippage, setSlippage] = useState<string>("0.5")
  const [deadline, setDeadline] = useState<string>("20") // minutes
  const [estimatedGas, setEstimatedGas] = useState<string>("")
  const [showWarning, setShowWarning] = useState<boolean>(false)

  const [tokenAAmount, setTokenAAmount] = useState<string>("")
  const [tokenBAmount, setTokenBAmount] = useState<string>("")
  const [tokenA, setTokenA] = useState<string>(chainId === 137 ? "WMATIC" : "WETH")
  const [tokenB, setTokenB] = useState<string>("USDC")

  const [isSwapping, setIsSwapping] = useState<boolean>(false)
  const [isAddingLiquidity, setIsAddingLiquidity] = useState<boolean>(false)
  const [isLoadingPair, setIsLoadingPair] = useState<boolean>(false)
  const [pairInfo, setPairInfo] = useState<any>(null)
  const [isEstimating, setIsEstimating] = useState<boolean>(false)

  // Get available tokens based on current chain
  const availableTokens =
    chainId && COMMON_TOKENS[chainId]
      ? Object.entries(COMMON_TOKENS[chainId]).map(([symbol, data]) => ({
          symbol,
          address: data.address,
          decimals: data.decimals,
        }))
      : Object.entries(COMMON_TOKENS[1]).map(([symbol, data]) => ({
          symbol,
          address: data.address,
          decimals: data.decimals,
        }))

  // Reset selected tokens when chain changes
  useEffect(() => {
    if (chainId) {
      // Set default tokens based on chain
      if (chainId === 137) {
        setFromToken("MATIC")
        setTokenA("WMATIC")
      } else if (chainId === 56) {
        setFromToken("BNB")
        setTokenA("WBNB")
      } else if (chainId === 43114) {
        setFromToken("AVAX")
        setTokenA("WAVAX")
      } else {
        setFromToken("ETH")
        setTokenA("WETH")
      }
      setToToken("USDC")
      setTokenB("USDC")
      setPairInfo(null)
      setShowWarning(false)
      setEstimatedGas("")
    }
  }, [chainId])

  // Effect to update estimated gas and output amount when fromAmount changes
  useEffect(() => {
    const estimateSwap = async () => {
      if (!web3 || !isReady || !address || !chainId || !fromAmount || Number.parseFloat(fromAmount) <= 0) {
        setEstimatedGas("")
        setShowWarning(false)
        setToAmount("")
        return
      }

      setIsEstimating(true)

      try {
        // Get router address
        const routerAddress = UNISWAP_ROUTER_ADDRESSES[chainId] || UNISWAP_ROUTER_ADDRESSES[1]

        // Get token info
        if (!COMMON_TOKENS[chainId]) {
          setIsEstimating(false)
          return
        }

        const fromTokenData = COMMON_TOKENS[chainId][fromToken]
        const toTokenData = COMMON_TOKENS[chainId][toToken]

        if (!fromTokenData || !toTokenData) {
          setIsEstimating(false)
          return
        }

        // Get basic gas estimation
        const gasPrice = await web3.eth.getGasPrice()
        const gasLimit =
          fromTokenData.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
            ? 250000 // Native token swap (higher for safety)
            : 400000 // ERC20 swap (needs approval + swap)

        const gasCost = web3.utils.fromWei((BigInt(gasPrice) * BigInt(gasLimit)).toString(), "ether")

        setEstimatedGas(gasCost)

        // Check if gas cost is more than 10% of swap amount (as a simple warning heuristic)
        const gasWarningThreshold = 0.1 // 10%
        const amountInEth =
          fromTokenData.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? Number.parseFloat(fromAmount) : 0 // We don't want to show warnings for token-to-token swaps based on this heuristic

        if (amountInEth > 0 && Number.parseFloat(gasCost) > amountInEth * gasWarningThreshold) {
          setShowWarning(true)
        } else {
          setShowWarning(false)
        }

        // Estimate output amount (simplified for demo)
        // In a real app, you would call getAmountsOut on the router
        const exchangeRate =
          fromToken === "USDC" || fromToken === "USDT" || fromToken === "DAI"
            ? 0.0005 // 1 USDC/USDT/DAI = 0.0005 ETH/MATIC/etc.
            : 2000 // 1 ETH/MATIC/etc. = 2000 USDC/USDT/DAI

        const estimatedOutput =
          fromToken === "USDC" || fromToken === "USDT" || fromToken === "DAI"
            ? Number.parseFloat(fromAmount) * exchangeRate
            : toToken === "USDC" || toToken === "USDT" || toToken === "DAI"
              ? Number.parseFloat(fromAmount) * exchangeRate
              : Number.parseFloat(fromAmount) // 1:1 for other pairs

        setToAmount(estimatedOutput.toFixed(6))
      } catch (error) {
        console.error("Error estimating swap:", error)
        setEstimatedGas("")
        setShowWarning(false)
        setToAmount("")
      } finally {
        setIsEstimating(false)
      }
    }

    estimateSwap()
  }, [web3, isReady, address, chainId, fromToken, toToken, fromAmount])

  const fetchPairInfo = async () => {
    if (!web3 || !isReady || !address || !chainId) return

    if (!COMMON_TOKENS[chainId]) return

    const tokenAData = COMMON_TOKENS[chainId][tokenA]
    const tokenBData = COMMON_TOKENS[chainId][tokenB]

    if (!tokenAData || !tokenBData) return

    setIsLoadingPair(true)

    try {
      const result = await getPairInfo(web3, address, tokenAData.address, tokenBData.address, chainId)

      // Ensure we have a valid result
      const safeResult = result || {
        exists: false,
        pairAddress: "0x0000000000000000000000000000000000000000",
        reserveUSD: "0",
        reserve0: "0",
        reserve1: "0",
      }

      setPairInfo(safeResult)

      if (safeResult.exists) {
        toast({
          title: "Pair Info Loaded",
          description: `LP Token Address: ${safeResult.pairAddress.slice(0, 6)}...${safeResult.pairAddress.slice(-4)}`,
        })
      } else {
        toast({
          title: "Pair Not Found",
          description: "This pair doesn't exist yet. You can be the first to add liquidity!",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching pair info:", error)

      toast({
        title: "Failed to Load Pair",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })

      setPairInfo(null)
    } finally {
      setIsLoadingPair(false)
    }
  }

  const checkAllowanceAndApprove = async (
    tokenSymbol: string,
    tokenAmount: string,
    spender: string,
  ): Promise<boolean> => {
    if (!web3 || !isReady || !address || !chainId) return false

    if (!COMMON_TOKENS[chainId]) return false

    const tokenData = COMMON_TOKENS[chainId][tokenSymbol]
    if (!tokenData || tokenData.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
      // Native token (ETH/MATIC) doesn't need approval
      return true
    }

    try {
      // Check current allowance
      const tokenContract = new web3.eth.Contract(
        [
          {
            constant: true,
            inputs: [
              { name: "owner", type: "address" },
              { name: "spender", type: "address" },
            ],
            name: "allowance",
            outputs: [{ name: "", type: "uint256" }],
            payable: false,
            stateMutability: "view",
            type: "function",
          },
          {
            constant: true,
            inputs: [],
            name: "decimals",
            outputs: [{ name: "", type: "uint8" }],
            payable: false,
            stateMutability: "view",
            type: "function",
          },
        ] as any,
        tokenData.address,
      )

      // Get token decimals
      const decimalsResult = await tokenContract.methods.decimals().call()
      const decimals = decimalsResult ? Number(decimalsResult) : tokenData.decimals

      const allowanceResult = await tokenContract.methods.allowance(address, spender).call()
      const allowance = allowanceResult ? allowanceResult.toString() : "0"

      // Convert amount to token units for comparison
      const requiredAmount = convertToTokenUnits(tokenAmount, Number(decimals))

      if (BigInt(allowance) >= BigInt(requiredAmount)) {
        console.log(`Token ${tokenSymbol} already approved for ${tokenAmount}`)
        return true
      }

      // Need to approve
      console.log(`Approving ${tokenSymbol} for ${tokenAmount}`)
      const approveAbi = [
        {
          constant: false,
          inputs: [
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
          ],
          name: "approve",
          outputs: [{ name: "", type: "bool" }],
          payable: false,
          stateMutability: "nonpayable",
          type: "function",
        },
      ]

      const approveContract = new web3.eth.Contract(approveAbi as any, tokenData.address)
      const receipt = await approveContract.methods.approve(spender, requiredAmount).send({
        from: address,
        gas: "100000", // Use string for gas to avoid type errors
      })

      if (receipt && receipt.transactionHash) {
        addTransaction({
          hash: receipt.transactionHash.toString(),
          from: address,
          to: tokenData.address,
          value: "0",
          chainId: String(chainId),
          type: "approve",
          status: "confirmed",
          method: "approve",
          timestamp: Date.now(),
        })

        toast({
          title: "Token Approved",
          description: `Successfully approved ${tokenSymbol} for trading`,
        })

        return true
      } else {
        return false
      }
    } catch (error) {
      console.error("Error approving token:", error)

      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Failed to approve token for trading",
        variant: "destructive",
      })

      return false
    }
  }

  const handleSwap = async () => {
    if (!web3 || !isReady || !address || !chainId) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to swap tokens.",
        variant: "destructive",
      })
      return
    }

    if (!fromAmount || Number.parseFloat(fromAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to swap.",
        variant: "destructive",
      })
      return
    }

    setIsSwapping(true)

    try {
      if (!COMMON_TOKENS[chainId]) {
        throw new Error(`Unsupported chain: ${chainId}`)
      }

      const fromTokenData = COMMON_TOKENS[chainId][fromToken]
      const toTokenData = COMMON_TOKENS[chainId][toToken]

      if (!fromTokenData || !toTokenData) {
        throw new Error("Invalid token selection")
      }

      // Get the router address for the current chain
      const routerAddress = UNISWAP_ROUTER_ADDRESSES[chainId] || UNISWAP_ROUTER_ADDRESSES[1]

      // For DEX swaps, we need to approve router to spend tokens first (except native token)
      if (fromTokenData.address !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
        const approved = await checkAllowanceAndApprove(fromToken, fromAmount, routerAddress)
        if (!approved) {
          throw new Error("Failed to approve token for swapping")
        }
      }

      // Execute the swap
      const receipt = await swapTokensOnUniswap(
        web3,
        fromTokenData.address,
        toTokenData.address,
        fromAmount,
        address,
        chainId,
        Number(slippage),
      )

      if (receipt && receipt.transactionHash) {
        addTransaction({
          hash: receipt.transactionHash.toString(),
          from: address,
          to: receipt.to || routerAddress,
          value:
            fromTokenData.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
              ? convertToTokenUnits(fromAmount, 18) // Native tokens use 18 decimals
              : "0",
          chainId: String(chainId),
          type: "swap",
          status: "confirmed",
          method: "swap",
          timestamp: Date.now(),
        })

        toast({
          title: "Swap Successful",
          description: `Successfully swapped ${fromAmount} ${fromToken} to ${receipt.amountOut || "?"} ${toToken}`,
        })

        // Reset form
        setFromAmount("")
        setToAmount("")
      }
    } catch (error) {
      console.error("Error swapping tokens:", error)

      toast({
        title: "Swap Failed",
        description: error instanceof Error ? error.message : "Failed to swap tokens",
        variant: "destructive",
      })
    } finally {
      setIsSwapping(false)
    }
  }

  const handleAddLiquidity = async () => {
    if (!web3 || !isReady || !address || !chainId) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to add liquidity.",
        variant: "destructive",
      })
      return
    }

    if (
      !tokenAAmount ||
      !tokenBAmount ||
      Number.parseFloat(tokenAAmount) <= 0 ||
      Number.parseFloat(tokenBAmount) <= 0
    ) {
      toast({
        title: "Invalid amounts",
        description: "Please enter valid amounts for both tokens.",
        variant: "destructive",
      })
      return
    }

    setIsAddingLiquidity(true)

    try {
      if (!COMMON_TOKENS[chainId]) {
        throw new Error(`Unsupported chain: ${chainId}`)
      }

      const tokenAData = COMMON_TOKENS[chainId][tokenA]
      const tokenBData = COMMON_TOKENS[chainId][tokenB]

      if (!tokenAData || !tokenBData) {
        throw new Error("Invalid token selection")
      }

      // Get the router address for the current chain
      const routerAddress = UNISWAP_ROUTER_ADDRESSES[chainId] || UNISWAP_ROUTER_ADDRESSES[1]

      // Approve token A if not native token
      if (tokenAData.address !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
        const approvedA = await checkAllowanceAndApprove(tokenA, tokenAAmount, routerAddress)
        if (!approvedA) {
          throw new Error(`Failed to approve ${tokenA} for adding liquidity`)
        }
      }

      // Approve token B if not native token
      if (tokenBData.address !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
        const approvedB = await checkAllowanceAndApprove(tokenB, tokenBAmount, routerAddress)
        if (!approvedB) {
          throw new Error(`Failed to approve ${tokenB} for adding liquidity`)
        }
      }

      // Execute the liquidity addition
      const receipt = await addLiquidityToPool(
        web3,
        tokenAData.address,
        tokenBData.address,
        tokenAAmount,
        tokenBAmount,
        address,
        chainId,
        Number(slippage),
      )

      if (receipt && receipt.transactionHash) {
        addTransaction({
          hash: receipt.transactionHash.toString(),
          from: address,
          to: receipt.to || routerAddress,
          value:
            tokenAData.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ||
            tokenBData.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
              ? tokenAData.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
                ? convertToTokenUnits(tokenAAmount, 18) // Native tokens use 18 decimals
                : convertToTokenUnits(tokenBAmount, 18) // Native tokens use 18 decimals
              : "0",
          chainId: String(chainId),
          type: "liquidity",
          status: "confirmed",
          method: "addLiquidity",
          timestamp: Date.now(),
        })

        toast({
          title: "Liquidity Added",
          description: `Successfully added ${tokenAAmount} ${tokenA} and ${tokenBAmount} ${tokenB} to the pool`,
        })

        // Refresh pair info
        fetchPairInfo()

        // Reset form
        setTokenAAmount("")
        setTokenBAmount("")
      }
    } catch (error) {
      console.error("Error adding liquidity:", error)

      toast({
        title: "Failed to Add Liquidity",
        description: error instanceof Error ? error.message : "Failed to add liquidity to the pool",
        variant: "destructive",
      })
    } finally {
      setIsAddingLiquidity(false)
    }
  }

  const switchTokens = () => {
    const tempFromToken = fromToken
    const tempFromAmount = fromAmount

    setFromToken(toToken)
    setFromAmount(toAmount)

    setToToken(tempFromToken)
    setToAmount(tempFromAmount)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-primary" />
          Decentralized Exchange
        </CardTitle>
        <CardDescription>Swap tokens and provide liquidity to pools</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="swap">
          <TabsList className="grid grid-cols-2 mb-4 w-full sm:w-[300px]">
            <TabsTrigger value="swap">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Swap
            </TabsTrigger>
            <TabsTrigger value="liquidity">
              <DollarSign className="h-4 w-4 mr-2" />
              Liquidity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="swap" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>From</Label>
                <div className="flex gap-2">
                  <Select value={fromToken} onValueChange={setFromToken}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTokens.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol} disabled={token.symbol === toToken}>
                          {token.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    step="0.000001"
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <Button variant="ghost" size="icon" onClick={switchTokens} className="rounded-full h-8 w-8">
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>To (Estimated)</Label>
                <div className="flex gap-2">
                  <Select value={toToken} onValueChange={setToToken}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTokens.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol} disabled={token.symbol === fromToken}>
                          {token.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    step="0.000001"
                    placeholder="0.0"
                    value={toAmount}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                {isEstimating && (
                  <p className="text-xs text-muted-foreground animate-pulse">Estimating output amount...</p>
                )}
              </div>

              {showWarning && (
                <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700">
                    Gas cost is high relative to transaction amount. Consider increasing the amount or using a different
                    token.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slippage Tolerance (%)</Label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Transaction Deadline (minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>

              {estimatedGas && (
                <div className="text-sm text-muted-foreground">
                  Estimated gas cost: {Number.parseFloat(estimatedGas).toFixed(6)}{" "}
                  {chainId === 137 ? "MATIC" : chainId === 56 ? "BNB" : chainId === 43114 ? "AVAX" : "ETH"}
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleSwap}
                disabled={!isReady || isSwapping || !fromAmount || Number.parseFloat(fromAmount) <= 0 || isEstimating}
              >
                {isSwapping ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Swapping...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Swap {fromToken} for {toToken}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="liquidity" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Token A</Label>
                  <Select value={tokenA} onValueChange={setTokenA}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTokens.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol} disabled={token.symbol === tokenB}>
                          {token.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Token B</Label>
                  <Select value={tokenB} onValueChange={setTokenB}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTokens.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol} disabled={token.symbol === tokenA}>
                          {token.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={fetchPairInfo}
                disabled={!isReady || isLoadingPair || tokenA === tokenB}
              >
                {isLoadingPair ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Load Pair Information
                  </>
                )}
              </Button>

              {pairInfo && (
                <div className="p-3 bg-muted rounded-md space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Pair Address:</span>
                    <span className="text-sm font-medium">
                      {pairInfo.pairAddress === "0x0000000000000000000000000000000000000000"
                        ? "Not created yet"
                        : `${pairInfo.pairAddress.slice(0, 6)}...${pairInfo.pairAddress.slice(-4)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Liquidity:</span>
                    <span className="text-sm font-medium">
                      ${Number.parseFloat(pairInfo.reserveUSD || "0").toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{tokenA} Balance:</span>
                    <span className="text-sm font-medium">
                      {Number.parseFloat(pairInfo.reserve0 || "0").toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{tokenB} Balance:</span>
                    <span className="text-sm font-medium">
                      {Number.parseFloat(pairInfo.reserve1 || "0").toFixed(6)}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>{tokenA} Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.000001"
                  placeholder="0.0"
                  value={tokenAAmount}
                  onChange={(e) => setTokenAAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{tokenB} Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.000001"
                  placeholder="0.0"
                  value={tokenBAmount}
                  onChange={(e) => setTokenBAmount(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slippage Tolerance (%)</Label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Transaction Deadline (minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleAddLiquidity}
                disabled={
                  !isReady ||
                  isAddingLiquidity ||
                  !tokenAAmount ||
                  !tokenBAmount ||
                  Number.parseFloat(tokenAAmount) <= 0 ||
                  Number.parseFloat(tokenBAmount) <= 0
                }
              >
                {isAddingLiquidity ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Adding Liquidity...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Add Liquidity
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <p>Note: DEX functionality requires sufficient balance and approval for token usage.</p>
      </CardFooter>
    </Card>
  )
}

export default DexSection
