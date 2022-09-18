import {
  createListenerMiddleware,
  TypedStartListening,
} from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "store";
import { ethers } from "ethers";
import { CIRCLE_BRIDGE, MESSAGE_TRANSMITTER, WSS } from "config/constants";
import { setStep } from "slices/swapStatusSlice";
import { getMessageSentEvent } from "utils/contract";
import { getTxLink } from "utils/explorer";

export const usdcMessengerMiddleware = createListenerMiddleware();

type RootStartListening = TypedStartListening<RootState, AppDispatch>;
const usdcMessengerStartListening =
  usdcMessengerMiddleware.startListening as RootStartListening;

usdcMessengerStartListening({
  predicate: (action, currentState, _prevState) => {
    const step = currentState.swapStatus.step;

    return action.type === setStep.type && step === 1;
  },
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState();
    const srcChain = state.swapInputs.srcChain;
    const destChain = state.swapInputs.destChain;
    const srcTxHash = state.swapStatus.srcTx;
    if (!srcChain || !destChain || !srcTxHash) return;

    const circleBridgeAddress = CIRCLE_BRIDGE[srcChain.name];
    const messageTransmitterAddress = MESSAGE_TRANSMITTER[destChain.name];
    const srcProvider = new ethers.providers.WebSocketProvider(
      WSS[srcChain.name]
    );

    // Step 1: Observe for the MessageSent event
    const srcContract = new ethers.Contract(
      circleBridgeAddress,
      ["event MessageSent(bytes message)"],
      srcProvider
    );

    const messageSentReceipt = await srcProvider.getTransactionReceipt(
      srcTxHash
    );

    const log = getMessageSentEvent(srcContract, messageSentReceipt);

    if (log) {
      const message = log.args.message;
      // Step 2: Call the Attestation API to get the signature
      console.log("Receive MessageSent event: ", message);
      const messageHash = ethers.utils.solidityKeccak256(["bytes"], [message]);
      console.log("Getting signature from attestation API...");
      const response = await fetch(
        `/api/attestations?chain=${destChain.name}&messageHash=${messageHash}`
      )
        .then((resp) => resp.json())
        .catch((err: any) => {
          console.log(err);
        });

      if (response.success) {
        const destContract = new ethers.Contract(messageTransmitterAddress, [
          "function receiveMessage(bytes message, bytes signature)",
        ]);

        const signature = response.signature;
        console.log("Received signature:", signature);

        // Step 3: Call the receiveMessage function with the signature
        const txRequest = await destContract.populateTransaction.receiveMessage(
          message,
          signature
        );

        // Step 4: Request to send tx
        console.log("Sending tx to mint USDC on ", destChain.name, "...");
        const txResponse = await fetch("/api/sendTx", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chain: destChain.name,
            rawTx: txRequest,
          }),
        })
          .then((resp) => resp.json())
          .catch(() => undefined);
        if (txResponse && txResponse.success) {
          console.log("Minted USDC", getTxLink(destChain.id, txResponse.hash));
        }
      }
    }
  },
});
