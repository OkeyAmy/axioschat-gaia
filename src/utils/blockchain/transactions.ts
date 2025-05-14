import type Web3 from "web3"
import { getTxUrl } from "./core"
import { getContractABI } from "./contracts"
import type { TransactionExplanation } from "./types"

// Function to send a transaction
export const sendTransaction = async (
  web3: Web3,
  from: string,
  to: string,
  value: string,
  data = "0x",
): Promise<any> => {
  try {
    // Estimate gas for the transaction
    const gasEstimate = await web3.eth.estimateGas({
      from,
      to,
      value,
      data,
    })

    // Get current gas price
    const gasPrice = await web3.eth.getGasPrice()

    // Send the transaction
    const tx = await web3.eth.sendTransaction({
      from,
      to,
      value,
      data,
      gas: Math.floor(Number(gasEstimate) * 1.1).toString(), // Add 10% buffer
      gasPrice,
    })

    return tx
  } catch (error) {
    console.error("Transaction error:", error)
    throw error
  }
}

// Function to fetch recent transactions
export const fetchRecentTransactions = async (web3: Web3, address: string, chainId: number): Promise<any[]> => {
  try {
    console.log(`Fetching transactions for ${address} on chain ${chainId}`)

    // Get the latest block number
    const latestBlockNumber = await web3.eth.getBlockNumber()
    const blocks = []

    // Get last 5 blocks
    for (let i = 0; i < 5; i++) {
      if (Number(latestBlockNumber) - i >= 0) {
        try {
          const block = await web3.eth.getBlock(Number(latestBlockNumber) - i, true)
          if (block && block.transactions) {
            blocks.push(block)
          }
        } catch (error) {
          console.error(`Error fetching block ${Number(latestBlockNumber) - i}:`, error)
        }
      }
    }

    // Filter transactions for the given address
    const transactions = []
    for (const block of blocks) {
      for (const tx of block.transactions) {
        // Convert addresses to lowercase for comparison
        const txFrom = typeof tx.from === "string" ? tx.from.toLowerCase() : ""
        const txTo = typeof tx.to === "string" ? tx.to?.toLowerCase() : ""
        const addrLower = address.toLowerCase()

        if (txFrom === addrLower || txTo === addrLower) {
          // Convert any BigInt values to strings before operations
          const txValue = typeof tx.value === "bigint" ? tx.value.toString() : tx.value.toString()

          // Make sure to convert the block timestamp to a number before multiplication
          const blockTimestamp = typeof block.timestamp === "bigint" ? Number(block.timestamp) : Number(block.timestamp)

          transactions.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: web3.utils.fromWei(txValue, "ether"),
            timestamp: new Date(blockTimestamp * 1000).toLocaleString(),
            status: "success", // We'd need an additional call to get actual status
          })
        }
      }
    }

    return transactions
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return []
  }
}

// Function to explain a transaction
export const explainTransaction = async (
  web3: Web3,
  txHash: string,
  chainId: number,
): Promise<TransactionExplanation> => {
  try {
    // Get transaction details
    const tx = await web3.eth.getTransaction(txHash)
    if (!tx) {
      throw new Error("Transaction not found")
    }

    // Get transaction receipt for status
    const receipt = await web3.eth.getTransactionReceipt(txHash)

    // Try to decode transaction data if it's a contract interaction
    let decodedData = "Unable to decode transaction data"
    let methodName = "Unknown Method"

    if (tx.input && tx.input !== "0x" && tx.to) {
      try {
        // Try to get ABI for the contract
        const abi = await getContractABI(tx.to, chainId)

        if (abi && abi.length > 0) {
          // Extract method signature (first 4 bytes of the data)
          const methodSignature = tx.input.slice(0, 10)

          // Find matching method in ABI
          const method = abi.find((item: any) => {
            if (item.type !== "function") return false

            // Calculate method signature
            const signature = web3.utils
              .keccak256(`${item.name}(${item.inputs.map((input: any) => input.type).join(",")})`)
              .slice(0, 10)
            return signature === methodSignature
          })

          if (method) {
            methodName = method.name

            // Decode parameters
            const params = web3.eth.abi.decodeParameters(method.inputs, "0x" + tx.input.slice(10))

            decodedData = `Method: ${method.name}\nParameters: ${JSON.stringify(params, null, 2)}`
          }
        }
      } catch (error) {
        console.error("Error decoding transaction data:", error)
      }
    }

    // Get block information
    const block = tx.blockNumber ? await web3.eth.getBlock(tx.blockNumber) : null

    // Format transaction data
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to || "",
      value: web3.utils.fromWei(tx.value.toString(), "ether"),
      gasPrice: web3.utils.fromWei(tx.gasPrice.toString(), "gwei"),
      gasLimit: Number(tx.gas),
      status: receipt ? (receipt.status ? "Success" : "Failed") : "Pending",
      blockNumber: tx.blockNumber ? Number(tx.blockNumber) : 0,
      timestamp: block ? new Date(Number(block.timestamp) * 1000).toLocaleString() : "Unknown",
      method: methodName,
      data: tx.input,
      decodedData: decodedData,
      explorerUrl: getTxUrl(chainId, txHash),
    }
  } catch (error) {
    console.error("Error explaining transaction:", error)
    throw error
  }
}

// Function to estimate gas for a transaction
export const estimateGas = async (
  web3: Web3,
  fromAddress: string,
  toAddress: string,
  value: string,
  data = "0x",
): Promise<string> => {
  try {
    const gasEstimate = await web3.eth.estimateGas({
      from: fromAddress,
      to: toAddress,
      data,
      value,
    })

    return gasEstimate.toString()
  } catch (error) {
    console.error("Error estimating gas:", error)
    return "21000" // Default gas limit for a basic ETH transfer
  }
}
