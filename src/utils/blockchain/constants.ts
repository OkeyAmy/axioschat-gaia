import type { AbiItem } from "web3-utils"

// Chain IDs for reference
export const CHAIN_IDS = {
  ETHEREUM: 1,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
  BSC: 56,
  ZORA: 7777777,
  SEPOLIA: 11155111,
  AVALANCHE: 43114,
}

// Uniswap V3 Contract Addresses
export const UNISWAP_ROUTER_ADDRESSES: Record<number, string> = {
  1: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // Swap Router 02 on Ethereum
  137: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // Swap Router 02 on Polygon
  56: "0xB971eF87ede563556b2ED4b1C0b0019111Dd85D2", // Swap Router 02 on BNB Chain
  43114: "0xbb00FF08d01D300023896c0Aa0871b3376F7aaBD", // Swap Router 02 on Avalanche
  42161: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // Swap Router 02 on Arbitrum
  10: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // Swap Router 02 on Optimism
  8453: "0x2626664c2603E5475e998f78dF33A0B369cA7E8", // Swap Router 02 on Base
  7777777: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD", // Universal Router on Zora
  11155111: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008", // Uniswap V2 Router on Sepolia
}

// Uniswap V3 Factory Addresses
export const FACTORY_ADDRESSES: Record<number, string> = {
  1: "0x1F98431c8aD98523631AE4a59f267346ea31F984", // Uniswap V3 Factory on Ethereum
  137: "0x1F98431c8aD98523631AE4a59f267346ea31F984", // Uniswap V3 Factory on Polygon
  56: "0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7", // Uniswap V3 Factory on BNB Chain
  43114: "0x740b1c1de25031C31FF4fC9A62f554A55cdC1baD", // Uniswap V3 Factory on Avalanche
  42161: "0x1F98431c8aD98523631AE4a59f267346ea31F984", // Uniswap V3 Factory on Arbitrum
  10: "0x1F98431c8aD98523631AE4a59f267346ea31F984", // Uniswap V3 Factory on Optimism
  8453: "0x33128a8fC178698f6b3c29402f82C7ba6e7B0fC", // Uniswap V3 Factory on Base
  7777777: "0x1F98431c8aD98523631AE4a59f267346ea31F984", // Uniswap V3 Factory on Zora
  11155111: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Uniswap V2 Factory on Sepolia
}

// Wrapped Native Token Addresses
export const WETH_ADDRESSES: Record<number, string> = {
  1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH on Ethereum
  137: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC on Polygon
  56: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB on BSC
  43114: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", // WAVAX on Avalanche
  42161: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH on Arbitrum
  10: "0x4200000000000000000000000000000000000006", // WETH on Optimism
  8453: "0x4200000000000000000000000000000000000006", // WETH on Base
  7777777: "0x4200000000000000000000000000000000000006", // WETH on Zora
  11155111: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9", // WETH on Sepolia
}

// Position Manager Addresses
export const POSITION_MANAGER_ADDRESSES: Record<number, string> = {
  1: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88", // Ethereum
  137: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88", // Polygon
  56: "0x7b8A6e94EF56f4d6a2F74F5f86a2d7bd5b39b1F6", // BNB Chain
  43114: "0x655C406EBFa14EE2006250925e54ec43AD184f8B", // Avalanche
  42161: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88", // Arbitrum
  10: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88", // Optimism
  8453: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f", // Base
  7777777: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88", // Zora
}

// Common tokens by chain
export const COMMON_TOKENS: Record<number, Record<string, { symbol: string; address: string; decimals: number }>> = {
  1: {
    // Ethereum Mainnet
    ETH: { symbol: "ETH", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 },
    WETH: { symbol: "WETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18 },
    USDC: { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
    USDT: { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
    DAI: { symbol: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
  },
  11155111: {
    // Sepolia Testnet
    ETH: { symbol: "ETH", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 },
    WETH: { symbol: "WETH", address: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9", decimals: 18 },
    USDC: { symbol: "USDC", address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", decimals: 6 },
    DAI: { symbol: "DAI", address: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6", decimals: 18 },
  },
  137: {
    // Polygon
    MATIC: { symbol: "MATIC", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 },
    WMATIC: { symbol: "WMATIC", address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", decimals: 18 },
    USDC: { symbol: "USDC", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", decimals: 6 },
    WETH: { symbol: "WETH", address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", decimals: 18 },
  },
  42161: {
    // Arbitrum
    ETH: { symbol: "ETH", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 },
    WETH: { symbol: "WETH", address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18 },
    USDC: { symbol: "USDC", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
    USDT: { symbol: "USDT", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6 },
    ARB: { symbol: "ARB", address: "0x912CE59144191C1204E64559FE8253a0e49E6548", decimals: 18 },
  },
  56: {
    // BSC
    BNB: { symbol: "BNB", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 },
    WBNB: { symbol: "WBNB", address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", decimals: 18 },
    USDC: { symbol: "USDC", address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18 },
    BUSD: { symbol: "BUSD", address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", decimals: 18 },
  },
  10: {
    // Optimism
    ETH: { symbol: "ETH", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 },
    WETH: { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
    USDC: { symbol: "USDC", address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", decimals: 6 },
    OP: { symbol: "OP", address: "0x4200000000000000000000000000000000000042", decimals: 18 },
  },
  8453: {
    // Base
    ETH: { symbol: "ETH", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 },
    WETH: { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
    USDC: { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
  },
  7777777: {
    // Zora
    ETH: { symbol: "ETH", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 },
    WETH: { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
    USDC: { symbol: "USDC", address: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4", decimals: 6 },
  },
  43114: {
    // Avalanche
    AVAX: { symbol: "AVAX", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 },
    WAVAX: { symbol: "WAVAX", address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", decimals: 18 },
    USDC: { symbol: "USDC", address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6 },
    USDT: { symbol: "USDT", address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", decimals: 6 },
    JOE: { symbol: "JOE", address: "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd", decimals: 18 },
  },
}

// Uniswap Router ABI (simplified for common functions)
export const UNISWAP_ROUTER_ABI: AbiItem[] = [
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
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactTokensForETH",
    outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
    ],
    name: "getAmountsOut",
    outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "tokenA", type: "address" },
      { internalType: "address", name: "tokenB", type: "address" },
      { internalType: "uint256", name: "amountADesired", type: "uint256" },
      { internalType: "uint256", name: "amountBDesired", type: "uint256" },
      { internalType: "uint256", name: "amountAMin", type: "uint256" },
      { internalType: "uint256", name: "amountBMin", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "addLiquidity",
    outputs: [
      { internalType: "uint256", name: "amountA", type: "uint256" },
      { internalType: "uint256", name: "amountB", type: "uint256" },
      { internalType: "uint256", name: "liquidity", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amountTokenDesired", type: "uint256" },
      { internalType: "uint256", name: "amountTokenMin", type: "uint256" },
      { internalType: "uint256", name: "amountETHMin", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "addLiquidityETH",
    outputs: [
      { internalType: "uint256", name: "amountToken", type: "uint256" },
      { internalType: "uint256", name: "amountETH", type: "uint256" },
      { internalType: "uint256", name: "liquidity", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "tokenA", type: "address" },
      { internalType: "address", name: "tokenB", type: "address" },
      { internalType: "uint256", name: "liquidity", type: "uint256" },
      { internalType: "uint256", name: "amountAMin", type: "uint256" },
      { internalType: "uint256", name: "amountBMin", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "removeLiquidity",
    outputs: [
      { internalType: "uint256", name: "amountA", type: "uint256" },
      { internalType: "uint256", name: "amountB", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "liquidity", type: "uint256" },
      { internalType: "uint256", name: "amountTokenMin", type: "uint256" },
      { internalType: "uint256", name: "amountETHMin", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "removeLiquidityETH",
    outputs: [
      { internalType: "uint256", name: "amountToken", type: "uint256" },
      { internalType: "uint256", name: "amountETH", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
]

// ERC20 Token ABI (simplified for common functions)
export const ERC20_ABI: AbiItem[] = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
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
  {
    constant: true,
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
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
  {
    constant: false,
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
]
