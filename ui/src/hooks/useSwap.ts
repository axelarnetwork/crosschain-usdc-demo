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
import { createPayloadHash, createTradeData } from "utils/contract";
import gatewayAbi from "abi/axelarGateway.json";
import { SquidChain } from "types/chain";
import { Token } from "types/token";

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
    const sendAmount = ethers.utils
      .parseUnits(amount, srcToken?.decimals)
      .toString();

    const srcTradeData = createTradeData(
      [
        srcToken.address,
        srcChain.wrappedNativeToken,
        srcCrosschainToken.address,
      ],
      srcChain,
      srcChain.swapExecutorAddress,
      sendAmount
    );
    const destTradeData = createTradeData(
      [
        destCrosschainToken.address,
        destChain.wrappedNativeToken,
        destToken.address,
      ],
      destChain,
      recipientAddress,
      0
    );
    const payloadHash = createPayloadHash(
      destTradeData,
      traceId,
      recipientAddress,
      AMOUNT_INPUT_POS
    );

    const tx = await contract.tradeSendTrade(
      destChain.name,
      srcCrosschainToken.symbol,
      srcTradeData,
      destTradeData,
      traceId,
      recipientAddress,
      AMOUNT_INPUT_POS,
      {
        value: ethers.utils.parseEther("0.01"),
      }
    );

    return { tx, traceId, payloadHash };
  }, [
    amount,
    destChain,
    destCrosschainToken,
    destToken,
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

    const tradeData = createTradeData(
      [
        srcTokenAtDestChain.address,
        destChain.wrappedNativeToken,
        destToken.address,
      ],
      destChain,
      recipientAddress,
      0 // will be overrided
    );
    const payloadHash = createPayloadHash(
      tradeData,
      traceId,
      recipientAddress,
      AMOUNT_INPUT_POS
    );

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
    return { tx, payloadHash, traceId };
  }, [
    amount,
    destChain,
    destToken,
    contract,
    recipientAddress,
    srcToken,
    srcTokenAtDestChain,
  ]);

  const swapOnlySrc = useCallback(async () => {
    const sendAmount = ethers.utils
      .parseUnits(amount, srcToken?.decimals)
      .toString();

    const srcTradeData = createTradeData(
      [
        srcToken.address,
        srcChain.wrappedNativeToken,
        srcCrosschainToken.address,
      ],
      srcChain,
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
  }, [
    amount,
    destChain.name,
    gatewayContract,
    recipientAddress,
    srcToken?.decimals,
    srcToken?.symbol,
  ]);

  return { swapSrcAndDest, swapOnlyDest, swapOnlySrc, sendToken };
};

export default useSwap;
