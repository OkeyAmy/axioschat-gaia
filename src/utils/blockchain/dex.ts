import type Web3 from "web3"
import { UNISWAP_ROUTER_ADDRESSES, WETH_ADDRESSES, UNISWAP_ROUTER_ABI, ERC20_ABI } from "./constants"
import { convertToTokenUnits, approveToken } from "./tokens"

// Helper function to get deadline timestamp
const getDeadlineTimestamp = (minutes = 20): string => {
  const deadline = Math.floor(Date.now() / 1000) + minutes * 60
  return deadline.toString()
}

// Helper function to get token decimals
const getTokenDecimals = async (web3: Web3, tokenAddress: string): Promise<number> => {
  try {
    // If it's the native token (ETH, AVAX, etc.), use 18 decimals
    if (tokenAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" || tokenAddress.toLowerCase() === "native") {
      return 18
    }

    // For ERC20 tokens, get the decimals from the contract
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
      ] as any,
      tokenAddress,
    )

    // Get token decimals
    const decimals = await tokenContract.methods.decimals().call()
    return Number(decimals)
  } catch (error) {
    console.warn("Could not get token decimals, defaulting to 18", error)
    return 18
  }
}

// Helper function to get token symbol
async function getTokenSymbol(web3: Web3, tokenAddress: string): Promise<string> {
  try {
    // If it's the native token, return appropriate symbol based on chain
    if (tokenAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" || tokenAddress.toLowerCase() === "native") {
      return "ETH" // Default, should be overridden by caller for specific chains
    }

    const tokenABI = [
      {
        constant: true,
        inputs: [],
        name: "symbol",
        outputs: [{ name: "", type: "string" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ]

    const tokenContract = new web3.eth.Contract(tokenABI as any, tokenAddress)
    const symbol = await tokenContract.methods.symbol().call()
    return symbol ? String(symbol) : "TOKEN"
  } catch (error) {
    console.error("Error getting token symbol:", error)
    return "TOKEN"
  }
}

// Swap tokens on Uniswap
export const swapTokensOnUniswap = async (
  web3: Web3,
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  userAddress: string,
  chainId: number,
  slippagePercent = 0.5,
): Promise<any> => {
  try {
    // Get router address for the current chain
    const routerAddress = UNISWAP_ROUTER_ADDRESSES[chainId] || UNISWAP_ROUTER_ADDRESSES[1]

    // Create router contract instance
    const router = new web3.eth.Contract(UNISWAP_ROUTER_ABI, routerAddress)

    // Get WETH address for the current chain
    const wethAddress = WETH_ADDRESSES[chainId] || WETH_ADDRESSES[1]

    // Set deadline 20 minutes from now
    const deadline = getDeadlineTimestamp(20)

    // Check if we're dealing with native token (ETH, MATIC, etc.)
    const isFromNative = fromTokenAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    const isToNative = toTokenAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

    // If both are native, can't swap
    if (isFromNative && isToNative) {
      throw new Error("Cannot swap native token for itself")
    }

    // Get token decimals
    let fromDecimals = 18 // Default for native tokens
    let toDecimals = 18 // Default for native tokens

    if (!isFromNative) {
      const fromToken = new web3.eth.Contract(ERC20_ABI, fromTokenAddress)
      fromDecimals = Number(await fromToken.methods.decimals().call())
    }

    if (!isToNative) {
      const toToken = new web3.eth.Contract(ERC20_ABI, toTokenAddress)
      toDecimals = Number(await toToken.methods.decimals().call())
    }

    // Convert amount to token units
    const amountIn = convertToTokenUnits(amount, fromDecimals)

    // Set up the path for the swap
    let path: string[]
    if (isFromNative) {
      // ETH -> Token
      path = [wethAddress, toTokenAddress]
    } else if (isToNative) {
      // Token -> ETH
      path = [fromTokenAddress, wethAddress]
    } else {
      // Token -> Token
      path = [fromTokenAddress, wethAddress, toTokenAddress]
    }

    // Get expected output amount
    let amountsOut
    try {
      amountsOut = await router.methods.getAmountsOut(amountIn, path).call()
    } catch (error) {
      console.error("Error getting amounts out:", error)
      throw new Error("Failed to get price quote. The pool might not exist or have enough liquidity.")
    }

    // Calculate minimum output with slippage
    const amountOut = amountsOut[amountsOut.length - 1].toString()
    const slippageFactor = 1 - slippagePercent / 100
    const amountOutMin = ((BigInt(amountOut) * BigInt(Math.floor(slippageFactor * 1000))) / BigInt(1000)).toString()

    console.log(
      `Swapping ${amountIn} units of token ${fromTokenAddress} for at least ${amountOutMin} units of token ${toTokenAddress}`,
    )

    let tx

    // Execute the swap based on token types
    if (isFromNative) {
      // ETH -> Token
      tx = await router.methods.swapExactETHForTokens(amountOutMin, path, userAddress, deadline).send({
        from: userAddress,
        value: amountIn,
        gas: "250000", // Convert to string for gas
      })
    } else if (isToNative) {
      // Token -> ETH
      // First approve router to spend tokens
      await approveToken(web3, fromTokenAddress, routerAddress, amount, userAddress, fromDecimals)

      tx = await router.methods.swapExactTokensForETH(amountIn, amountOutMin, path, userAddress, deadline).send({
        from: userAddress,
        gas: "250000", // Convert to string for gas
      })
    } else {
      // Token -> Token
      // First approve router to spend tokens
      await approveToken(web3, fromTokenAddress, routerAddress, amount, userAddress, fromDecimals)

      tx = await router.methods.swapExactTokensForTokens(amountIn, amountOutMin, path, userAddress, deadline).send({
        from: userAddress,
        gas: "250000", // Convert to string for gas
      })
    }

    // Return transaction receipt with additional info
    return {
      ...tx,
      amountIn,
      amountOut,
      amountOutMin,
      path,
    }
  } catch (error) {
    console.error("Error swapping tokens:", error)
    throw error
  }
}

// Add liquidity to a pool
export const addLiquidity = async (
  web3: Web3,
  tokenAAddress: string,
  tokenBAddress: string,
  amountA: string,
  amountB: string,
  userAddress: string,
  chainId: number,
  slippagePercent = 0.5,
): Promise<any> => {
  try {
    // Get router address for the current chain
    const routerAddress = UNISWAP_ROUTER_ADDRESSES[chainId] || UNISWAP_ROUTER_ADDRESSES[1]

    // Create router contract instance
    const router = new web3.eth.Contract(UNISWAP_ROUTER_ABI, routerAddress)

    // Set deadline 20 minutes from now
    const deadline = getDeadlineTimestamp(20)

    // Check if we're dealing with native token (ETH, MATIC, etc.)
    const isANative = tokenAAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    const isBNative = tokenBAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

    // Get token decimals
    let decimalsA = 18 // Default for native tokens
    let decimalsB = 18 // Default for native tokens

    if (!isANative) {
      const tokenA = new web3.eth.Contract(ERC20_ABI, tokenAAddress)
      decimalsA = Number(await tokenA.methods.decimals().call())
    }

    if (!isBNative) {
      const tokenB = new web3.eth.Contract(ERC20_ABI, tokenBAddress)
      decimalsB = Number(await tokenB.methods.decimals().call())
    }

    // Convert amounts to token units
    const amountADesired = convertToTokenUnits(amountA, decimalsA)
    const amountBDesired = convertToTokenUnits(amountB, decimalsB)

    // Calculate minimum amounts with slippage
    const slippageFactor = 1 - slippagePercent / 100
    const amountAMin = ((BigInt(amountADesired) * BigInt(Math.floor(slippageFactor * 1000))) / BigInt(1000)).toString()
    const amountBMin = ((BigInt(amountBDesired) * BigInt(Math.floor(slippageFactor * 1000))) / BigInt(1000)).toString()

    console.log(
      `Adding liquidity: ${amountADesired} units of token ${tokenAAddress} and ${amountBDesired} units of token ${tokenBAddress}`,
    )

    let tx

    // Execute the liquidity addition based on token types
    if (isANative || isBNative) {
      // One token is native (ETH, MATIC, etc.)
      const tokenAddress = isANative ? tokenBAddress : tokenAAddress
      const tokenAmount = isANative ? amountBDesired : amountADesired
      const tokenAmountMin = isANative ? amountBMin : amountAMin
      const ethAmount = isANative ? amountADesired : amountBDesired
      const ethAmountMin = isANative ? amountAMin : amountBMin

      // Approve non-native token
      if (!isANative) {
        await approveToken(web3, tokenAAddress, routerAddress, amountA, userAddress, decimalsA)
      } else if (!isBNative) {
        await approveToken(web3, tokenBAddress, routerAddress, amountB, userAddress, decimalsB)
      }

      tx = await router.methods
        .addLiquidityETH(tokenAddress, tokenAmount, tokenAmountMin, ethAmountMin, userAddress, deadline)
        .send({
          from: userAddress,
          value: ethAmount,
          gas: "400000", // Convert to string for gas
        })
    } else {
      // Both tokens are ERC20
      // Approve both tokens
      await approveToken(web3, tokenAAddress, routerAddress, amountA, userAddress, decimalsA)
      await approveToken(web3, tokenBAddress, routerAddress, amountB, userAddress, decimalsB)

      tx = await router.methods
        .addLiquidity(
          tokenAAddress,
          tokenBAddress,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          userAddress,
          deadline,
        )
        .send({
          from: userAddress,
          gas: "400000", // Convert to string for gas
        })
    }

    // Return transaction receipt with additional info
    return {
      ...tx,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
    }
  } catch (error) {
    console.error("Error adding liquidity:", error)
    throw error
  }
}
