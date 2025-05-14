// Define transaction interface
export interface QueuedTransaction {
    id: string
    type: string
    description: string
    status: "pending" | "processing" | "success" | "failed"
    execute: () => Promise<void>
    txHash?: string
    error?: string
    from?: string
    to?: string
    value?: string
    chainId?: string
    method?: string
    timestamp?: number
  }
  
  // Token information interface
  export interface TokenInfo {
    name: string
    symbol: string
    totalSupply: string
    decimals: number
    address: string
  }
  
  // Transaction explanation interface
  export interface TransactionExplanation {
    hash: string
    from: string
    to: string
    value: string
    gasPrice: string
    gasLimit: number
    status: string
    blockNumber: number
    timestamp: string
    method: string
    data: string
    decodedData: string
    explorerUrl: string
  }
  
  // Swap result interface
  export interface SwapResult {
    txHash: string
    transactionHash?: string // For backward compatibility
    to?: string // For backward compatibility
    amountIn: string
    amountOut: string
    tokenIn: string
    tokenOut: string
    status: string
  }
  
  // Liquidity result interface
  export interface LiquidityResult {
    txHash: string
    transactionHash?: string // For backward compatibility
    to?: string // For backward compatibility
    amountA: string
    amountB: string
    tokenA: string
    tokenB: string
    liquidity: string
    status: string
  }
  
  export interface ContractDeployResult {
    contractAddress: string
    transactionHash: string
    blockNumber: number
  }
  
  export interface ContractCallOptions {
    from: string
    value?: string
    gasLimit?: string
    gasPrice?: string
  }
  
  export interface ContractWriteResult {
    transactionHash: string
    blockNumber: number
    status: boolean
    events?: any
  }
  