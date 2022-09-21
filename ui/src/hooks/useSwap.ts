import { BigNumberish, ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";
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
import {
  useContract,
  useContractWrite,
  usePrepareContractWrite,
  useSigner,
} from "wagmi";
import { v4 as uuidv4 } from "uuid";
import { createDestTradeData, createSrcTradeData } from "utils/contract";
import gatewayAbi from "abi/axelarGateway.json";
import { SquidChain } from "types/chain";
import { Token } from "types/token";
import { AxelarQueryAPI, Environment } from "@axelar-network/axelarjs-sdk";

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
  const [swapArgs, setSwapArgs] = useState<any[]>([]);
  const [gasFee, setGasFee] = useState<string>();
  const [sentAmount, setSentAmount] = useState<BigNumberish>();
  const { config } = usePrepareContractWrite({
    addressOrName: srcChain?.swapExecutorAddress,
    contractInterface: squidSwapExecutableAbi,
    functionName: "nativeTradeSendTrade",
    args: swapArgs,
    overrides: {
      value: sentAmount,
    },
    enabled:
      swapArgs.length === 6 && gasFee !== undefined && sentAmount !== undefined,
  });
  const { writeAsync } = useContractWrite(config);
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

  useEffect(() => {
    async function loadArgs() {
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
      setSwapArgs([
        destChain.name,
        srcTradeData,
        destTradeData,
        traceId,
        recipientAddress,
        AMOUNT_INPUT_POS,
      ]);
    }
    if (srcChain && srcToken && destChain && destToken && amount) {
      loadArgs();
    }
  }, [
    amount,
    destChain,
    destCrosschainToken?.address,
    destToken,
    recipientAddress,
    srcChain,
    srcCrosschainToken?.address,
    srcToken,
  ]);

  useEffect(() => {
    async function loadGasFee() {
      const api = new AxelarQueryAPI({ environment: Environment.TESTNET });
      const gasFee = ethers.utils.parseEther("0.001").toString();
      setGasFee(gasFee);
    }
    loadGasFee();
  }, [destChain.name, srcChain.name, srcChain.nativeCurrency?.symbol]);

  useEffect(() => {
    async function loadSentAmount() {
      if (!gasFee) return;
      const sendAmount = ethers.utils.parseUnits(amount, srcToken?.decimals);
      setSentAmount(sendAmount.add(gasFee));
    }
    if (amount && amount !== "0" && gasFee) {
      loadSentAmount();
    }
  }, [amount, gasFee, srcToken?.decimals]);

  const swapSrcAndDest = useCallback(async () => {
    if (!writeAsync || !swapArgs || swapArgs.length === 0) return;
    const tx = await writeAsync();

    return { tx, traceId: swapArgs[3] };
  }, [writeAsync, swapArgs]);

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

  return { swapSrcAndDest, swapOnlyDest, swapOnlySrc, sendToken, writeAsync };
};

export default useSwap;
