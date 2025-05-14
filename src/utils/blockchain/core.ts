import type Web3 from "web3"
import { CHAIN_IDS } from "./constants"

// Define default gas prices for different networks
const defaultGasPrices: Record<string, number> = {
  ethereum: 30,
  polygon: 100,
  arbitrum: 0.1,
  optimism: 0.001,
  base: 0.001,
  binance: 5,
  zora: 0.001,
  avalanche: 25,
}

// Get chain name from chain ID
export const getChainName = (chainId: number): string => {
  switch (chainId) {
    case CHAIN_IDS.ETHEREUM:
      return "ethereum"
    case CHAIN_IDS.POLYGON:
      return "polygon"
    case CHAIN_IDS.ARBITRUM:
      return "arbitrum"
    case CHAIN_IDS.OPTIMISM:
      return "optimism"
    case CHAIN_IDS.BASE:
      return "base"
    case CHAIN_IDS.BSC:
      return "binance"
    case CHAIN_IDS.ZORA:
      return "zora"
    case CHAIN_IDS.SEPOLIA:
      return "sepolia"
    case CHAIN_IDS.AVALANCHE:
      return "avalanche"
    default:
      return "ethereum"
  }
}

// Function to get explorer URL for a transaction
export const getTxUrl = (chainId: number, txHash: string): string => {
  switch (chainId) {
    case CHAIN_IDS.ETHEREUM:
      return `https://etherscan.io/tx/${txHash}`
    case CHAIN_IDS.POLYGON:
      return `https://polygonscan.com/tx/${txHash}`
    case CHAIN_IDS.OPTIMISM:
      return `https://optimistic.etherscan.io/tx/${txHash}`
    case CHAIN_IDS.ARBITRUM:
      return `https://arbiscan.io/tx/${txHash}`
    case CHAIN_IDS.BASE:
      return `https://basescan.org/tx/${txHash}`
    case CHAIN_IDS.BSC:
      return `https://bscscan.com/tx/${txHash}`
    case CHAIN_IDS.ZORA:
      return `https://explorer.zora.energy/tx/${txHash}`
    case CHAIN_IDS.SEPOLIA:
      return `https://sepolia.etherscan.io/tx/${txHash}`
    case CHAIN_IDS.AVALANCHE:
      return `https://snowtrace.io/tx/${txHash}`
    default:
      return `https://etherscan.io/tx/${txHash}`
  }
}

// Function to get explorer URL for an address
export const getAddressUrl = (chainId: number, address: string): string => {
  switch (chainId) {
    case CHAIN_IDS.ETHEREUM:
      return `https://etherscan.io/address/${address}`
    case CHAIN_IDS.POLYGON:
      return `https://polygonscan.com/address/${address}`
    case CHAIN_IDS.OPTIMISM:
      return `https://optimistic.etherscan.io/address/${address}`
    case CHAIN_IDS.ARBITRUM:
      return `https://arbiscan.io/address/${address}`
    case CHAIN_IDS.BASE:
      return `https://basescan.org/address/${address}`
    case CHAIN_IDS.BSC:
      return `https://bscscan.com/address/${address}`
    case CHAIN_IDS.ZORA:
      return `https://explorer.zora.energy/address/${address}`
    case CHAIN_IDS.SEPOLIA:
      return `https://sepolia.etherscan.io/address/${address}`
    case CHAIN_IDS.AVALANCHE:
      return `https://snowtrace.io/address/${address}`
    default:
      return `https://etherscan.io/address/${address}`
  }
}

// Function to get explorer URL for a contract
export const getContractUrl = (chainId: number, address: string): string => {
  return getAddressUrl(chainId, address)
}

// Function to get recommended gas price
export const getRecommendedGasPrice = async (web3: Web3, chainId: number): Promise<string> => {
  try {
    // Get the chain name for the default gas price
    const chainName = getChainName(chainId)

    // Try to get current gas price from the network
    const gasPrice = await web3.eth.getGasPrice()
    if (gasPrice) {
      return gasPrice.toString()
    }

    // Fallback to default
    const defaultGasPrice = defaultGasPrices[chainName] || 30

    // Convert to wei
    const gasPriceWei = web3.utils.toWei(defaultGasPrice.toString(), "gwei")

    return gasPriceWei
  } catch (error) {
    console.error("Error getting gas price:", error)
    // Return default gas price in wei
    return web3.utils.toWei("30", "gwei")
  }
}

// Function to get gas price
export const getGasPrice = async (web3: Web3, chainId: number): Promise<{ price: string; unit: string }> => {
  try {
    const gasPrice = await web3.eth.getGasPrice()
    const gasPriceGwei = web3.utils.fromWei(gasPrice, "gwei")

    return {
      price: Number(gasPriceGwei).toFixed(2),
      unit: "Gwei",
    }
  } catch (error) {
    console.error("Error getting gas price:", error)

    // Return default gas price based on chain
    const chainName = getChainName(chainId)
    const defaultPrice = defaultGasPrices[chainName] || 30

    return {
      price: defaultPrice.toString(),
      unit: "Gwei",
    }
  }
}

// Safe conversion from bigint to number
export const convertBigIntToNumber = (value: bigint): number => {
  // For safe conversion, check if the bigint can be accurately represented as a number
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    console.warn("BigInt value exceeds safe integer range, precision may be lost")
    // Return a safe approximation or handled value
    return Number(value) / 1e18 // Assuming this is for ETH/wei conversion
  }
  return Number(value)
}
