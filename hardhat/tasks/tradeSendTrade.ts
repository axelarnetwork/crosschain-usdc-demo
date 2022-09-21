import { task } from "hardhat/config";
import {
  CIRCLE_SWAP_EXECUTABLE,
  USDC,
  WRAPPED_NATIVE_ASSET,
} from "../constants/address";
import { NativeToken, Chain } from "../constants/chains";
import circleSwapExecutableAbi from "./abi/circleSwapExecutable.json";
import { createDestTradeData, createSrcTradeData } from "./utils/contract";
import { v4 as uuidv4 } from "uuid";
import {
  AxelarQueryAPI,
  Environment,
  EvmChain,
} from "@axelar-network/axelarjs-sdk";

task(
  "tradeSendTrade",
  "call tradeSendTrade function on the CircleSwapExecutable contract"
)
  .addPositionalParam("amount")
  .addPositionalParam("destinationChain")
  .setAction(async (taskArgs, hre) => {
    const { amount, destinationChain } = taskArgs;
    const chainName = hre.network.name as Chain;
    const destinationChainName = destinationChain as Chain;
    if (chainName !== Chain.AVALANCHE && chainName !== Chain.ETHEREUM) return;
    if (
      destinationChainName !== Chain.AVALANCHE &&
      destinationChainName !== Chain.ETHEREUM
    )
      return;

    const api = new AxelarQueryAPI({ environment: Environment.TESTNET });
    const gasFee = await api.estimateGasFee(
      chainName as unknown as EvmChain,
      destinationChainName as unknown as EvmChain,
      NativeToken[chainName]
    );
    const ethers = hre.ethers;
    console.log(
      `Total fee for ${chainName} to ${destinationChainName}:`,
      ethers.utils.formatEther(gasFee),
      NativeToken[chainName]
    );
    const [deployer] = await ethers.getSigners();

    const srcUsdcAddress = USDC[chainName];
    const destUsdcAddress = USDC[destinationChainName];
    const subunitAmount = ethers.utils.parseEther(amount);

    // Step 1: Create the tradeData for the trade
    const tradeDataSrc = createSrcTradeData(
      [WRAPPED_NATIVE_ASSET[chainName], srcUsdcAddress],
      chainName,
      CIRCLE_SWAP_EXECUTABLE[chainName],
      subunitAmount
    );
    const tradeDataDest = createDestTradeData(
      [destUsdcAddress, WRAPPED_NATIVE_ASSET[destinationChainName]],
      destinationChainName,
      deployer.address,
      "1",
      destUsdcAddress
    );
    const traceId = ethers.utils.id(uuidv4());
    const fallbackRecipient = deployer.address;

    // length of tradeData (32) + token in (32) + amount in (32) + router (32) + length of data (32) + 36
    const inputPos = 196;
    // Step 2: Send the trade to CircleSwapExecutable
    const contract = new ethers.Contract(
      CIRCLE_SWAP_EXECUTABLE[chainName],
      circleSwapExecutableAbi,
      deployer
    );

    const tx = await contract
      .nativeTradeSendTrade(
        destinationChainName,
        tradeDataSrc,
        tradeDataDest,
        traceId,
        fallbackRecipient,
        inputPos,
        {
          value: subunitAmount.add(gasFee),
        }
      )
      .then((tx: any) => tx.wait());

    console.log("Tx Hash:", tx.transactionHash);
  });
