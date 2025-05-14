"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FunctionCard } from "./FunctionCard"
import { Share2, ExternalLink, CheckCircle2 } from "lucide-react"
import { useWeb3 } from "@/hooks/useWeb3"
import { sendTransaction, getTxUrl } from "@/utils/blockchain"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TransferSectionProps {
  currentChain: number
}

type TransactionStatus = "pending" | "success" | "failed" | "none"

const isValidEthereumAddress = (address: string) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Update the getNativeSymbol function to support all chains
const getNativeSymbol = (chainId: number): string => {
  switch (chainId) {
    case 1: // Ethereum
      return "ETH"
    case 137: // Polygon
      return "MATIC"
    case 56: // BSC
      return "BNB"
    case 43114: // Avalanche
      return "AVAX"
    case 42161: // Arbitrum
      return "ETH"
    case 10: // Optimism
      return "ETH"
    case 8453: // Base
      return "ETH"
    case 7777777: // Zora
      return "ETH"
    case 11155111: // Sepolia
      return "ETH"
    case 98432: // EduChain
      return "EDU"
    default:
      return "ETH"
  }
}

// Add a function to get token options based on the current chain
const getTokenOptions = (chainId: number) => {
  const options = [
    {
      value: "native",
      label: `${getNativeSymbol(chainId)} (Native)`,
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    },
  ]

  // Add chain-specific tokens
  switch (chainId) {
    case 1: // Ethereum
      options.push(
        { value: "usdc", label: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
        { value: "usdt", label: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
        { value: "dai", label: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
      )
      break
    case 137: // Polygon
      options.push(
        { value: "usdc", label: "USDC", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" },
        { value: "usdt", label: "USDT", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" },
        { value: "dai", label: "DAI", address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063" },
      )
      break
    case 56: // BSC
      options.push(
        { value: "usdc", label: "USDC", address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" },
        { value: "usdt", label: "USDT", address: "0x55d398326f99059fF775485246999027B3197955" },
        { value: "busd", label: "BUSD", address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56" },
      )
      break
    case 43114: // Avalanche
      options.push(
        { value: "usdc", label: "USDC", address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E" },
        { value: "usdt", label: "USDT", address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7" },
        { value: "dai", label: "DAI", address: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70" },
      )
      break
    case 42161: // Arbitrum
      options.push(
        { value: "usdc", label: "USDC", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" },
        { value: "usdt", label: "USDT", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" },
        { value: "dai", label: "DAI", address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" },
      )
      break
    case 10: // Optimism
      options.push(
        { value: "usdc", label: "USDC", address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607" },
        { value: "usdt", label: "USDT", address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58" },
        { value: "dai", label: "DAI", address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" },
      )
      break
    case 8453: // Base
      options.push(
        { value: "usdc", label: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
        { value: "dai", label: "DAI", address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb" },
      )
      break
    case 7777777: // Zora
      options.push({ value: "usdc", label: "USDC", address: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4" })
      break
    default:
      // Default to Ethereum tokens
      options.push(
        { value: "usdc", label: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
        { value: "usdt", label: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
        { value: "dai", label: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
      )
  }

  return options
}

// Update the TransferSection component to use the token options
const TransferSection: React.FC<TransferSectionProps> = ({ currentChain }) => {
  const { web3, address } = useWeb3()
  const [transferAmount, setTransferAmount] = useState("")
  const [transferAddress, setTransferAddress] = useState("")
  const [addressError, setAddressError] = useState("")
  const [transactionHash, setTransactionHash] = useState("")
  const [txStatus, setTxStatus] = useState<TransactionStatus>("none")
  const [selectedToken, setSelectedToken] = useState("native")
  const [tokenOptions, setTokenOptions] = useState<Array<{ value: string; label: string; address: string }>>([])

  // Update token options when chain changes
  useEffect(() => {
    const options = getTokenOptions(currentChain)
    setTokenOptions(options)
    // Default to native token when chain changes
    setSelectedToken("native")
  }, [currentChain])

  const validateAddress = (address: string) => {
    if (!address) {
      setAddressError("Address is required")
      return false
    }
    if (!isValidEthereumAddress(address)) {
      setAddressError("Invalid Ethereum address")
      return false
    }
    setAddressError("")
    return true
  }

  // Update the handleTransfer function to use the correct token address
  const handleTransfer = async () => {
    if (!validateAddress(transferAddress)) return
    if (!web3 || !address) {
      toast({
        title: "Error",
        description: "Web3 not initialized or wallet not connected",
        variant: "destructive",
      })
      return
    }

    try {
      setTxStatus("pending")

      // Get the selected token's address
      const selectedTokenInfo = tokenOptions.find((t) => t.value === selectedToken)
      if (!selectedTokenInfo) {
        throw new Error("Selected token not found")
      }

      const isNativeToken = selectedToken === "native"
      const tokenAddress = selectedTokenInfo.address
      const tokenSymbol = isNativeToken ? getNativeSymbol(currentChain) : selectedTokenInfo.label

      toast({
        title: "Transaction Initiated",
        description: `Preparing to send ${transferAmount} ${tokenSymbol} to ${transferAddress}`,
      })

      let txHash
      if (isNativeToken) {
        // Native token transfer - always 18 decimals
        const amountWei = web3.utils.toWei(transferAmount, "ether")

        txHash = await sendTransaction(
          web3,
          address,
          transferAddress,
          amountWei,
          "0x", // Empty data for a simple transfer
        )
      } else {
        // ERC20 token transfer - need to get the correct decimals
        const tokenContract = new web3.eth.Contract(
          [
            {
              constant: true,
              inputs: [],
              name: "decimals",
              outputs: [{ name: "", type: "uint8" }],
              payable: false,
              stateMutability: "view",
              type: "function",
            },
            {
              constant: false,
              inputs: [
                { name: "_to", type: "address" },
                { name: "_value", type: "uint256" },
              ],
              name: "transfer",
              outputs: [{ name: "", type: "bool" }],
              payable: false,
              stateMutability: "nonpayable",
              type: "function",
            },
          ] as any,
          tokenAddress,
        )

        // Get token decimals
        let decimals = 18
        try {
          decimals = await tokenContract.methods.decimals().call()
          decimals = Number(decimals)
        } catch (error) {
          console.warn("Could not get token decimals, defaulting to 18", error)
        }

        // Convert amount based on token decimals
        const amount = Number.parseFloat(transferAmount)
        const amountInSmallestUnit = amount * Math.pow(10, decimals)
        const amountHex = web3.utils.numberToHex(Math.floor(amountInSmallestUnit))

        // Send the transaction
        const tx = await tokenContract.methods.transfer(transferAddress, amountHex).send({ from: address })
        txHash = tx.transactionHash
      }

      setTransactionHash(txHash)
      setTxStatus("success")

      toast({
        title: "Transaction Sent",
        description: `Successfully sent ${transferAmount} ${tokenSymbol} to ${transferAddress}`,
      })
    } catch (error: any) {
      console.error("Transfer error:", error)
      setTxStatus("failed")
      toast({
        title: "Error",
        description: error.message || "Failed to send transaction. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <FunctionCard title="Send Tokens" description="Transfer tokens to another address" icon={Share2}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient Address</Label>
          <Input
            id="recipient"
            placeholder="0x..."
            value={transferAddress}
            onChange={(e) => {
              setTransferAddress(e.target.value)
              validateAddress(e.target.value)
            }}
          />
          {addressError && <p className="text-destructive text-xs">{addressError}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="flex items-center gap-2">
            <Input
              id="amount"
              type="number"
              placeholder="0.0"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />
            {/* Update the Select component to use dynamic token options */}
            <Select defaultValue="native" value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                {tokenOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          className="w-full bg-primary hover:bg-primary/90"
          disabled={!transferAddress || !transferAmount || !!addressError || txStatus === "pending" || !web3}
          onClick={handleTransfer}
        >
          {txStatus === "pending" ? (
            <div className="flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              <span>Processing...</span>
            </div>
          ) : (
            "Send Transaction"
          )}
        </Button>

        {transactionHash && txStatus === "success" && (
          <div className="bg-primary/5 p-3 rounded-md border border-primary/10 mt-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Transaction Hash:</p>
                <p className="text-xs font-mono break-all">{transactionHash}</p>
              </div>
              <a
                href={getTxUrl(currentChain, transactionHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 text-xs flex items-center"
              >
                View <ExternalLink size={12} className="ml-1" />
              </a>
            </div>
            <div className="flex items-center text-xs text-emerald-600 mt-2">
              <CheckCircle2 size={12} className="mr-1" />
              Transaction successful
            </div>
          </div>
        )}
      </div>
    </FunctionCard>
  )
}

export default TransferSection
