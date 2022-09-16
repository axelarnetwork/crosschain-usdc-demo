import { chains } from "config/constants";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import cn from "classnames";
import React, { useCallback, useEffect } from "react";
import Image from "next/image";
import { useAppSelector } from "hooks/useAppSelector";
import {
  selectSwapStatusDestApprovalTx,
  selectSwapStatusSrcTx,
  selectSwapStatusStep,
  setSrcTx,
} from "slices/swapStatusSlice";
import useConfetti from "hooks/useConfetti";
import { SendProgress } from "components/transaction";
import { useDispatch } from "react-redux";
import { setSrcChain } from "slices/swapInputSlice";

const SendTransactionDetail = () => {
  const { query, push, isReady } = useRouter();
  const step = useAppSelector(selectSwapStatusStep);
  const relayTx = useAppSelector(selectSwapStatusDestApprovalTx);
  const srcTxHash = useAppSelector(selectSwapStatusSrcTx);
  const dispatch = useDispatch();
  const txHash = query.txid as string;
  const chainName = query.chainName as string;
  useConfetti("rewardId", step === 2);

  useEffect(() => {
    if (isReady && txHash && chainName) {
      const chain = chains.find(
        (chain) => chain.name === chainName?.toLowerCase()
      );
      if (!ethers.utils.isHexString(txHash, 32)) {
        push({
          pathname: "/error",
          query: {
            title: "Transaction not found",
            msg: "Transaction hash is invalid.",
          },
        });
      } else if (!chain) {
        push({
          pathname: "/error",
          query: {
            title: "Transaction not found",
            msg: `Unsupported chain ${chainName}`,
          },
        });
      }
    }
  }, [chainName, isReady, push, txHash]);

  useEffect(() => {
    if (!srcTxHash && txHash) {
      const chain = chains.find(
        (chain) => chain.name === chainName?.toLowerCase()
      );
      dispatch(setSrcChain(chain));
      dispatch(
        setSrcTx({
          txHash,
          payloadHash: "",
          traceId: "",
        })
      );
    }
  }, [dispatch, srcTxHash, txHash]);

  const getTxHash = useCallback(
    (index: number) => {
      if (index === 0) {
        return txHash;
      } else if (index === 1) {
        return relayTx;
      }
    },
    [relayTx, txHash]
  );

  const steps = new Array(2).fill(0).map((_, index) => {
    return (
      <li
        className={cn("step", {
          "step-primary": step >= index,
        })}
        key={index}
      >
        <SendProgress
          step={index}
          currentStep={step}
          txHash={getTxHash(index)}
        />
      </li>
    );
  });

  const onClickBackToSwap = useCallback(() => {
    push("/");
  }, [push]);

  return (
    <div className="z-50 flex flex-col p-4 py-6 m-8 shadow-xl card mx-auto rounded-3xl bg-base-900 w-[500px] bg-gradient-to-b to-[#191E31] from-[#192431] relative">
      <div className="z-10 flex flex-col p-4 pb-6">
        <div className="z-50">
          <h2 className="card-title">Swap status</h2>
          <ul className="items-start steps steps-vertical">{steps}</ul>
          {step >= 2 && (
            <button
              className="btn w-full text-white bg-gradient-to-r from-[#760FC8] to-[#7522DE] transition-all ease-in"
              onClick={onClickBackToSwap}
            >
              Back to swap
            </button>
          )}
        </div>
        <div className="absolute top-0 left-0 z-0 w-full h-full">
          <div className="relative w-full h-full">
            <Image
              className="scale-110 rotate-3"
              src={"/assets/svg/pattern.svg"}
              layout="fill"
              alt="background pattern"
              objectFit="cover"
            />
          </div>
        </div>
      </div>
      <span id="rewardId" className="z-20 self-center" />
    </div>
  );
};

export default SendTransactionDetail;
