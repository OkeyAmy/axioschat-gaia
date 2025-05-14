import type Web3 from "web3"
import { ERC20_ABI } from "./constants"

// Helper function to convert amount to token units with proper decimal handling
export const convertToTokenUnits = (amount: string, decimals: number): string => {
  try {
    // Remove any commas from the input
    const cleanAmount = amount.replace(/,/g, "")

    // Parse the amount as a float
    const amountFloat = Number.parseFloat(cleanAmount)

    // Check for invalid input
    if (isNaN(amountFloat)) {
      return "0"
    }

    // Use a more precise approach for decimal conversion to avoid floating point issues
    // Convert to string and split by decimal point
    const parts = amountFloat.toString().split(".")
    let whole = parts[0]
    let fraction = parts.length > 1 ? parts[1] : ""

    // Pad or truncate the fraction part to match decimals
    if (fraction.length > decimals) {
      fraction = fraction.substring(0, decimals)
    } else {
      while (fraction.length < decimals) {
        fraction += "0"
      }
    }

    // Remove leading zeros from whole part
    whole = whole.replace(/^0+/, "") || "0"

    // Combine whole and fraction without decimal point
    const result = whole + fraction

    // Remove leading zeros
    return result.replace(/^0+/, "") || "0"
  } catch (error) {
    console.error("Error converting to token units:", error)
    return "0"
  }
}

// Get token balance
export const getTokenBalance = async (web3: Web3, walletAddress: string, tokenAddress: string): Promise<string> => {
  try {
    // Check if it's the native token (ETH, BNB, etc.)
    if (tokenAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" || tokenAddress.toLowerCase() === "native") {
      const balance = await web3.eth.getBalance(walletAddress)
      return web3.utils.fromWei(balance.toString(), "ether")
    }

    const contract = new web3.eth.Contract(ERC20_ABI, tokenAddress)

    // Get token balance and decimals
    const balanceResult = await contract.methods.balanceOf(walletAddress).call()
    const decimalsResult = await contract.methods.decimals().call()

    // Convert based on token decimals
    const balance = balanceResult ? balanceResult.toString() : "0"
    const decimals = Number(decimalsResult)
    const adjustedBalance = Number(balance) / Math.pow(10, decimals)

    return adjustedBalance.toString()
  } catch (error) {
    console.error("Error getting token balance:", error)
    return "0"
  }
}

// Get token information (symbol, name, decimals)
export const getTokenInfo = async (web3: Web3, tokenAddress: string) => {
  try {
    // Skip for native token
    if (tokenAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
      return {
        symbol: "ETH", // Default, should be overridden by caller for specific chains
        name: "Ethereum",
        decimals: 18,
      }
    }

    const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress)

    // Get token info one by one to handle potential errors
    let symbol = "UNKNOWN"
    let name = "Unknown Token"
    let decimals = 18

    try {
      const symbolResult = await tokenContract.methods.symbol().call()
      symbol = symbolResult ? symbolResult.toString() : "UNKNOWN"
    } catch (e) {
      console.warn("Could not get token symbol:", e)
    }

    try {
      const nameResult = await tokenContract.methods.name().call()
      name = nameResult ? nameResult.toString() : "Unknown Token"
    } catch (e) {
      console.warn("Could not get token name:", e)
    }

    try {
      const decimalsResult = await tokenContract.methods.decimals().call()
      decimals = decimalsResult ? Number(decimalsResult) : 18
    } catch (e) {
      console.warn("Could not get token decimals:", e)
    }

    return {
      symbol,
      name,
      decimals,
    }
  } catch (error) {
    console.error("Error getting token info:", error)
    return {
      symbol: "UNKNOWN",
      name: "Unknown Token",
      decimals: 18,
    }
  }
}

// Approve token spending
export const approveToken = async (
  web3: Web3,
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  sender: string,
  decimals: number,
): Promise<boolean> => {
  try {
    // Skip approval for native tokens
    if (tokenAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
      return true
    }

    const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress)

    // Convert amount to token units
    const amountInTokenUnits = convertToTokenUnits(amount, decimals)

    console.log(`Approving ${amountInTokenUnits} tokens with ${decimals} decimals for ${spenderAddress}`)

    // Check current allowance
    const currentAllowanceResult = await tokenContract.methods.allowance(sender, spenderAddress).call()
    const currentAllowance = currentAllowanceResult ? currentAllowanceResult.toString() : "0"

    // If already approved for enough, skip
    if (BigInt(currentAllowance) >= BigInt(amountInTokenUnits)) {
      console.log("Already approved enough tokens")
      return true
    }

    // Approve exact amount needed
    const tx = await tokenContract.methods.approve(spenderAddress, amountInTokenUnits).send({
      from: sender,
      gas: "100000", // Convert to string for gas
    })

    return !!tx.transactionHash
  } catch (error) {
    console.error("Error approving token:", error)
    throw error
  }
}

// Transfer ERC20 token
export const transferToken = async (
  web3: Web3,
  tokenAddress: string,
  recipient: string,
  amount: string,
  sender: string,
  decimals: number,
): Promise<string> => {
  try {
    const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress)

    // Convert amount to token units
    const amountInTokenUnits = convertToTokenUnits(amount, decimals)

    console.log(`Transferring ${amountInTokenUnits} tokens with ${decimals} decimals to ${recipient}`)

    // Execute transfer
    const tx = await tokenContract.methods.transfer(recipient, amountInTokenUnits).send({
      from: sender,
      gas: "100000", // Convert to string for gas
    })

    return tx.transactionHash.toString()
  } catch (error) {
    console.error("Error transferring token:", error)
    throw error
  }
}

// Transfer native token (ETH, MATIC, etc.)
export const transferNativeToken = async (
  web3: Web3,
  recipient: string,
  amount: string,
  sender: string,
): Promise<string> => {
  try {
    // Convert amount to wei
    const amountWei = web3.utils.toWei(amount, "ether")

    console.log(`Transferring ${amountWei} wei to ${recipient}`)

    // Execute transfer
    const tx = await web3.eth.sendTransaction({
      from: sender,
      to: recipient,
      value: amountWei,
      gas: "21000", // Standard gas for ETH transfer
    })

    return tx.transactionHash.toString()
  } catch (error) {
    console.error("Error transferring native token:", error)
    throw error
  }
}
