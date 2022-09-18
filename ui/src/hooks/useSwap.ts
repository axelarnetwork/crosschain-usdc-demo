import { ethers } from "ethers";
import { useCallback } from "react";
import {
  selectAmount,
  selectDestChain,
  selectDestToken,
  selectRecipientAddress,
  selectSrcChain,
  selectSrcToken,
} from "slices/swapInputSlice";
import { useAppSelector } from "./useAppSelector";
import useCrosschainToken from "./useCrosschainToken";
import squidSwapExecutableAbi from "abi/squidSwapExecutable.json";
import { useContract, useSigner } from "wagmi";
import { v4 as uuidv4 } from "uuid";
import { createDestTradeData, createSrcTradeData } from "utils/contract";
import gatewayAbi from "abi/axelarGateway.json";
import { SquidChain } from "types/chain";
import { Token } from "types/token";
import {
  AxelarQueryAPI,
  Environment,
  EvmChain,
} from "@axelar-network/axelarjs-sdk";

const AMOUNT_INPUT_POS = 196; // length of tradeData (32) + token in (32) + amount in (32) + router (32) + length of data (32) + 36

const useSwap = () => {
  const srcChain = useAppSelector(selectSrcChain) as SquidChain;
  const srcToken = useAppSelector(selectSrcToken) as Token;
  const destChain = useAppSelector(selectDestChain);
  const destToken = useAppSelector(selectDestToken) as Token;
  const recipientAddress = useAppSelector(selectRecipientAddress) as string;
  const amount = useAppSelector(selectAmount);
  const srcCrosschainToken = useCrosschainToken(srcChain) as Token;
  const destCrosschainToken = useCrosschainToken(destChain) as Token;
  const srcTokenAtDestChain = useCrosschainToken(destChain, srcToken) as Token;
  const { data: signer } = useSigner();

  const contract = useContract({
    addressOrName: srcChain?.swapExecutorAddress,
    contractInterface: squidSwapExecutableAbi,
    signerOrProvider: signer,
  });

  const gatewayContract = useContract({
    addressOrName: srcChain?.gatewayAddress,
    contractInterface: gatewayAbi,
    signerOrProvider: signer,
  });

  const swapSrcAndDest = useCallback(async () => {
    const traceId = ethers.utils.id(uuidv4());
    const sendAmount = ethers.utils.parseUnits(amount, srcToken?.decimals);

    const srcTradeData = createSrcTradeData(
      [srcChain.wrappedNativeToken, srcCrosschainToken.address],
      srcChain.name,
      srcChain.swapExecutorAddress,
      sendAmount
    );
    const destTradeData = createDestTradeData(
      [destCrosschainToken.address, destChain.wrappedNativeToken],
      destChain.name,
      recipientAddress,
      0,
      destCrosschainToken.address
    );

    // const payloadHash = createPayloadHash(
    //   destTradeData,
    //   traceId,
    //   recipientAddress,
    //   AMOUNT_INPUT_POS
    // );

    const api = new AxelarQueryAPI({ environment: Environment.TESTNET });
    const gasFee = await api.estimateGasFee(
      srcChain.name as unknown as EvmChain,
      destChain.name as unknown as EvmChain,
      srcChain.nativeCurrency?.symbol
    );

    const tx = await contract.nativeTradeSendTrade(
      destChain.name,
      srcTradeData,
      destTradeData,
      traceId,
      recipientAddress,
      AMOUNT_INPUT_POS,
      {
        value: sendAmount.add(gasFee),
      }
    );

    return { tx, traceId };
  }, [
    amount,
    destChain,
    destCrosschainToken,
    contract,
    recipientAddress,
    srcChain,
    srcCrosschainToken,
    srcToken,
  ]);

  const swapOnlyDest = useCallback(async () => {
    const traceId = ethers.utils.id(uuidv4());
    const sendAmount = ethers.utils
      .parseUnits(amount, srcToken?.decimals)
      .toString();

    const tradeData = createDestTradeData(
      [destCrosschainToken.address, destChain.wrappedNativeToken],
      destChain.name,
      recipientAddress,
      0,
      destCrosschainToken.address
    );
    // const payloadHash = createPayloadHash(
    //   tradeData,
    //   traceId,
    //   recipientAddress,
    //   AMOUNT_INPUT_POS
    // );

    const tx = await contract.sendTrade(
      destChain.name,
      srcToken?.symbol,
      sendAmount,
      tradeData,
      traceId,
      recipientAddress,
      AMOUNT_INPUT_POS,
      {
        value: ethers.utils.parseEther("0.01"),
      }
    );
    return { tx, traceId };
  }, [
    amount,
    srcToken?.decimals,
    srcToken?.symbol,
    destCrosschainToken,
    destChain.wrappedNativeToken,
    destChain.name,
    recipientAddress,
    contract,
  ]);

  const swapOnlySrc = useCallback(async () => {
    const sendAmount = ethers.utils
      .parseUnits(amount, srcToken?.decimals)
      .toString();

    const srcTradeData = createSrcTradeData(
      [srcChain.wrappedNativeToken, srcCrosschainToken.address],
      srcChain.name,
      srcChain.swapExecutorAddress,
      sendAmount
    );

    const tx = await contract.tradeSend(
      destChain.name,
      recipientAddress,
      srcCrosschainToken.symbol,
      srcTradeData
    );

    return { tx, traceId: "", payloadHash: "" };
  }, [
    amount,
    destChain?.name,
    contract,
    recipientAddress,
    srcChain,
    srcCrosschainToken,
    srcToken,
  ]);

  const sendToken = useCallback(async () => {
    const sendAmount = ethers.utils
      .parseUnits(amount, srcToken?.decimals)
      .toString();

    const tx = await gatewayContract.sendToken(
      "Osmosis",
      "osmo19f97n582ss05ccuzgvqnqs0lanv77hf05ft7eu",
      srcToken.symbol,
      sendAmount
    );

    return { tx, traceId: "", payloadHash: "" };
  }, [amount, gatewayContract, srcToken?.decimals, srcToken?.symbol]);

  return { swapSrcAndDest, swapOnlyDest, swapOnlySrc, sendToken };
};

export default useSwap;
