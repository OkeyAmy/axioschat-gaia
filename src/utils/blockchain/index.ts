// Export all blockchain utilities
export * from "./constants"
export * from "./core"
export * from "./tokens"
export * from "./dex"
export * from "./contracts"
export * from "./transactions" // Add this line to export transactions functions

// Export any additional functions from this file
import type Web3 from "web3"
import { getTxUrl } from "./core"

// Send a transaction
export const sendTransaction = async (
  web3: Web3,
  from: string,
  to: string,
  value: string,
  data = "0x",
): Promise<string> => {
  try {
    const tx = await web3.eth.sendTransaction({
      from,
      to,
      value,
      data,
      gas: "100000", // Use string for gas to avoid type errors
    })
    return tx.transactionHash.toString()
  } catch (error) {
    console.error("Error sending transaction:", error)
    throw error
  }
}

// Export getTxUrl for convenience
export { getTxUrl }
