import { Contract, ethers } from "ethers";
import { SquidChain } from "types/chain";
import routerAbi from "abi/router.json";
import { getProvider } from "./provider";
import { SwapEstimatorPayload } from "slices/swapEstimatorSlice";
import { chains } from "config/constants";

export function createSwapPayload(
  swapPath: string[],
  recipientAddress: string,
  amount: ethers.BigNumberish
) {
  const swapRouterAbi = getSwapRouterAbi();
  const swapFunctionName = getSwapFunctionName();

  const iface = new ethers.utils.Interface(swapRouterAbi);
  const deadline = Math.floor(new Date().getTime() / 1000) + 60 * 20;
  const swapPayload = iface.encodeFunctionData(swapFunctionName, [
    ethers.BigNumber.from(amount),
    0,
    swapPath,
    recipientAddress,
    deadline,
  ]);

  return swapPayload;
}

export function createTradeData(
  swapPath: string[],
  chain: SquidChain,
  recipientAddress: string,
  amount: ethers.BigNumberish
) {
  const swapPayload = createSwapPayload(swapPath, recipientAddress, amount);
  return ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256", "address", "bytes"],
    [swapPath[0], amount, chain.routerAddress, swapPayload]
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

export async function estimateSwapOutputAmount(payload: SwapEstimatorPayload) {
  const { routerAddress, tokenA, tokenB, amount, chain } = payload;
  const provider = getProvider(chain);
  const contract = new ethers.Contract(routerAddress, routerAbi, provider);
  try {
    const amountOuts = await contract.getAmountsOut(amount, [
      tokenA.address,
      chain.wrappedNativeToken,
      tokenB.address,
    ]);
    return amountOuts[amountOuts.length - 1].toString();
  } catch (e: any) {
    let errMsg = `No ${tokenB.symbol} liquidity at ${chain.name}`;
    if (e.message.indexOf("out-of-bounds") > -1) {
      errMsg = "Swap amount is too low";
    }
    throw new Error(errMsg);
  }
}

function getSwapRouterAbi() {
  return routerAbi;
}

function getSwapFunctionName() {
  return "swapExactTokensForTokens";
}

export const getSwapPendingEvent = (
  contract: Contract,
  txReceipt: ethers.providers.TransactionReceipt
) => {
  const eventLogs = txReceipt.logs;
  const swapPendingEventId = ethers.utils.id(
    "SwapPending(bytes32,bytes32,string,uint256,string,bytes)"
  );
  for (const log of eventLogs) {
    if (log.topics[0] === swapPendingEventId) {
      const swapPendingEvent = contract.interface.parseLog(log);
      const [
        traceId,
        payloadHash,
        symbol,
        amount,
        destinationChainName,
        payload,
      ] = swapPendingEvent.args;

      const destChain = chains.find(
        (chain) =>
          chain.name.toLowerCase() === destinationChainName.toLowerCase()
      );

      return {
        traceId,
        symbol,
        amount: amount.toString(),
        destChain,
        payload,
        payloadHash,
      };
    }
  }

  return null;
};

export const getSwapFailedEvent = (
  contract: Contract,
  txReceipt: ethers.providers.TransactionReceipt
) => {
  const eventLogs = txReceipt.logs;
  const swapFailedEventId = ethers.utils.id(
    "SwapFailed(bytes32,string,uint256,address)"
  );
  for (const log of eventLogs) {
    if (log.topics[0] === swapFailedEventId) {
      return contract.interface.parseLog(log);
    }
  }
};

export const getSwapSuccessEvent = (
  contract: Contract,
  txReceipt: ethers.providers.TransactionReceipt
) => {
  const eventLogs = txReceipt.logs;
  const swapSuccessEventId = ethers.utils.id(
    "SwapSuccess(bytes32,string,uint256,bytes)"
  );
  for (const log of eventLogs) {
    if (log.topics[0] === swapSuccessEventId) {
      return contract.interface.parseLog(log);
    }
  }
  return null;
};
