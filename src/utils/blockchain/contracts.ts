import type Web3 from "web3"

// Deploy a contract
export const deployContract = async (
  web3: Web3,
  from: string,
  abi: any[],
  bytecode: string,
  args: any[] = [],
): Promise<any> => {
  try {
    // Create contract instance
    const contract = new web3.eth.Contract(abi)

    // Estimate gas for deployment
    const gas = await contract
      .deploy({
        data: bytecode,
        arguments: args,
      })
      .estimateGas({ from })

    // Deploy contract
    const deployedContract = await contract
      .deploy({
        data: bytecode,
        arguments: args,
      })
      .send({
        from,
        gas: Math.floor(Number(gas) * 1.2).toString(), // Add 20% buffer for gas
      })

    return {
      contractAddress: deployedContract.options.address,
      transactionHash: (deployedContract as any).transactionHash?.toString() || "",
    }
  } catch (error) {
    console.error("Error deploying contract:", error)
    throw error
  }
}

// Write to a contract (execute a function)
export const writeContractFunction = async (
  web3: Web3,
  contractAddress: string,
  abi: any[],
  method: string,
  args: any[] = [],
  options: {
    from: string
    value?: string
    gas?: string
  },
): Promise<any> => {
  try {
    // Create contract instance
    const contract = new web3.eth.Contract(abi, contractAddress)

    // Check if method exists
    if (!contract.methods[method]) {
      throw new Error(`Method ${method} does not exist on contract`)
    }

    // Prepare transaction
    const tx = contract.methods[method](...args)

    // Estimate gas if not provided
    const gasToUse =
      options.gas ||
      (await tx
        .estimateGas({
          from: options.from,
          value: options.value || "0",
        })
        .catch((e) => {
          console.warn("Gas estimation failed, using default:", e)
          return "500000" // Default gas limit if estimation fails
        }))

    // Execute transaction
    const receipt = await tx.send({
      from: options.from,
      value: options.value || "0",
      gas: typeof gasToUse === "bigint" ? gasToUse.toString() : gasToUse,
    })

    return {
      transactionHash: receipt.transactionHash.toString(),
      to: contractAddress,
      events: receipt.events,
    }
  } catch (error) {
    console.error(`Error executing contract function ${method}:`, error)
    throw error
  }
}

// Read from a contract (call a view function)
export const readContractFunction = async (
  web3: Web3,
  contractAddress: string,
  abi: any[],
  method: string,
  args: any[] = [],
): Promise<any> => {
  try {
    // Create contract instance
    const contract = new web3.eth.Contract(abi, contractAddress)

    // Check if method exists
    if (!contract.methods[method]) {
      throw new Error(`Method ${method} does not exist on contract`)
    }

    // Call the view function
    const result = await contract.methods[method](...args).call()
    return result
  } catch (error) {
    console.error(`Error reading contract function ${method}:`, error)
    throw error
  }
}

// Function to get contract ABI from Etherscan-like APIs
export const getContractABI = async (contractAddress: string, chainId: number): Promise<any[]> => {
  try {
    // In a real app, you would fetch this from Etherscan or similar API
    // For now, return a mock ABI for common contracts
    if (contractAddress.toLowerCase() === "0x7a250d5630b4cf539739df2c5dacb4c659f2488d") {
      // Uniswap V2 Router
      return [
        {
          inputs: [
            { internalType: "uint256", name: "amountIn", type: "uint256" },
            { internalType: "uint256", name: "amountOutMin", type: "uint256" },
            { internalType: "address[]", name: "path", type: "address[]" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "deadline", type: "uint256" },
          ],
          name: "swapExactTokensForTokens",
          outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            { internalType: "uint256", name: "amountOutMin", type: "uint256" },
            { internalType: "address[]", name: "path", type: "address[]" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "deadline", type: "uint256" },
          ],
          name: "swapExactETHForTokens",
          outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
          stateMutability: "payable",
          type: "function",
        },
      ]
    }

    // Return empty array if no match
    return []
  } catch (error) {
    console.error("Error fetching contract ABI:", error)
    return []
  }
}

// Function to verify a contract on Etherscan
export const verifyContract = async (
  contractAddress: string,
  sourceCode: string,
  abi: any[],
  constructorArgs: any[],
  chainId: number,
): Promise<boolean> => {
  try {
    // In a real app, you would call Etherscan API to verify
    console.log(`Verifying contract ${contractAddress} on chain ${chainId}...`)
    // Mock successful verification
    return true
  } catch (error) {
    console.error("Error verifying contract:", error)
    return false
  }
}
