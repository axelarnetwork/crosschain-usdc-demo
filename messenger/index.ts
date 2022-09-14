import { ethers } from "ethers";
import { privateKey } from "./secret.json";
import { fetch } from "cross-fetch";
import { Chain } from "./constants/chains";
import { RPC, WSS } from "./constants/rpc";
import { CIRCLE_BRIDGE, MESSAGE_TRANSMITTER } from "./constants/address";

// Mocked the MessageTransmitter contract address
const supportedChains = [Chain.AVALANCHE, Chain.FANTOM];
if (supportedChains.length > 2) {
  console.log("Only two chains are supported");
  process.exit(0);
}

for (const chain of supportedChains) {
  const destChain = supportedChains.find((c) => c !== chain);
  if (!destChain) continue;
  const circleBridgeAddress = CIRCLE_BRIDGE[chain];
  const messageTransmitterAddress = MESSAGE_TRANSMITTER[destChain];
  const srcProvider = new ethers.providers.WebSocketProvider(WSS[chain]);
  const destProvider = new ethers.providers.JsonRpcProvider(RPC[destChain]);
  const destSigner = new ethers.Wallet(privateKey, destProvider);

  // Step 1: Observe for the MessageSent event
  const srcContract = new ethers.Contract(
    circleBridgeAddress,
    ["event MessageSent(bytes message)"],
    srcProvider
  );

  srcContract.on("MessageSent", async (message) => {
    // Step 2: Call the Attestation API to get the signature
    console.log("Received message from Circle Bridge", message);
    const response = await fetch(
      `http://localhost:4000/v1/attestations/${destChain}/${ethers.utils.solidityKeccak256(
        ["bytes"],
        [message]
      )}`
    ).then((resp) => resp.json());
    console.log("Attestation response", response);
    if (response.success) {
      const destContract = new ethers.Contract(
        messageTransmitterAddress,
        ["function receiveMessage(bytes message, bytes signature)"],
        destSigner
      );

      const signature = response.signature;

      // Step 3: Call the receiveMessage function with the signature
      const tx = await destContract
        .receiveMessage(message, signature)
        .then((tx: any) => tx.wait());

      console.log(
        "Message received on the destination chain:",
        tx.transactionHash
      );
    }
  });
}

console.log("Messenger started");
