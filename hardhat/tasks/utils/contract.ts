import { Contract, ethers } from "ethers";
import { ROUTER, USDC } from "../../constants/address";
import { Chain } from "../../constants/chains";
import pangolinRouterAbi from "../abi/pangolinRouter.json";
import uniswapRouterAbi from "../abi/router.json";

export function createSwapPayloadForNative(
  chain: string,
  swapFunctionName: string,
  swapPath: string[],
  recipientAddress: string
) {
  const swapRouterAbi = getAbi(chain);

  const iface = new ethers.utils.Interface(swapRouterAbi);
  const deadline = Math.floor(new Date().getTime() / 1000) + 60 * 20;
  const swapPayload = iface.encodeFunctionData(swapFunctionName, [
    0,
    swapPath,
    recipientAddress,
    deadline,
  ]);

  return swapPayload;
}

export function createSwapPayloadForErc20(
  chain: string,
  swapFunctionName: string,
  amount: ethers.BigNumberish,
  swapPath: string[],
  recipientAddress: string
) {
  const swapRouterAbi = getAbi(chain);

  const iface = new ethers.utils.Interface(swapRouterAbi);
  const deadline = Math.floor(new Date().getTime() / 1000) + 60 * 20;
  const swapPayload = iface.encodeFunctionData(swapFunctionName, [
    amount,
    0,
    swapPath,
    recipientAddress,
    deadline,
  ]);

  return swapPayload;
}

export function createSrcTradeData(
  swapPath: string[],
  chain: string,
  recipientAddress: string,
  amount: ethers.BigNumberish
) {
  const swapFunctionName = getSrcSwapFunctionName(chain);
  const swapPayload = createSwapPayloadForNative(
    chain,
    swapFunctionName,
    swapPath,
    recipientAddress
  );
  return ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256", "address", "bytes"],
    [ethers.constants.AddressZero, amount, ROUTER[chain as Chain], swapPayload]
  );
}

export function createDestTradeData(
  swapPath: string[],
  chain: string,
  recipientAddress: string,
  amount: ethers.BigNumberish,
  usdcAddress: string
) {
  const swapPayload = createSwapPayloadForErc20(
    chain,
    getDestSwapFunctionName(chain),
    amount,
    swapPath,
    recipientAddress
  );
  return ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256", "address", "bytes"],
    [usdcAddress, amount, ROUTER[chain as Chain], swapPayload]
  );
}

export function createPayloadHash(
  tradeData: string,
  traceId: string,
  recipientAddress: string,
  inputPos: number
) {
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["bytes", "bytes32", "address", "uint16"],
      [tradeData, traceId, recipientAddress, inputPos]
    )
  );
}

// export async function estimateSwapOutputAmount(payload: SwapEstimatorPayload) {
//   const { routerAddress, tokenA, tokenB, amount, chain } = payload;
//   const provider = getProvider(chain);
//   const contract = new ethers.Contract(routerAddress, routerAbi, provider);
//   try {
//     const amountOuts = await contract.getAmountsOut(amount, [
//       tokenA.address,
//       chain.wrappedNativeToken,
//       tokenB.address,
//     ]);
//     return amountOuts[amountOuts.length - 1].toString();
//   } catch (e: any) {
//     let errMsg = `No ${tokenB.symbol} liquidity at ${chain.name}`;
//     if (e.message.indexOf("out-of-bounds") > -1) {
//       errMsg = "Swap amount is too low";
//     }
//     throw new Error(errMsg);
//   }
// }

function getSrcSwapFunctionName(chain: string) {
  if (chain === Chain.AVALANCHE) {
    return "swapExactAVAXForTokens";
  }

  return "swapExactETHForTokens";
}

function getDestSwapFunctionName(chain: string) {
  if (chain === Chain.AVALANCHE) {
    return "swapExactTokensForAVAX";
  }

  return "swapExactTokensForETH";
}

function getAbi(chain: string) {
  if (chain === Chain.AVALANCHE) {
    return pangolinRouterAbi;
  }
  return uniswapRouterAbi;
}
