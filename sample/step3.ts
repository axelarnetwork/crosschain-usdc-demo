import { ethers } from "ethers";
import { MESSAGE_TRANSMITTER_ADDRESS } from "./constant";
import { getMessageFromTxHash } from "./step2";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAttestation(messageHash: string, maxAttempt = 10) {
  let attempt = 0;
  while (attempt < maxAttempt) {
    const _response = await fetch(
      `https://iris-api-sandbox.circle.com/api/attestations?messageHash=${messageHash}`
    ).then((resp) => resp.json());

    if (_response?.status === "complete") {
      return _response?.attestation;
    }

    sleep(5000);
    attempt++;
  }
}

async function retrieveUSDC(
  depositTxHash: string,
  depositChain: string,
  withdrawChain: string,
  signer: ethers.Signer
) {
  const messageTransmitterAddress = MESSAGE_TRANSMITTER_ADDRESS[withdrawChain];

  const contract = new ethers.Contract(
    messageTransmitterAddress,
    [
      "function receiveMessage(bytes memory _message, bytes calldata _attestation)",
    ],
    signer
  );

  // Retrieves the message by txHash
  const message = await getMessageFromTxHash(depositTxHash, depositChain);

  // Calculate message hash
  const messageHash = ethers.utils.solidityKeccak256(["bytes"], [message]);

  // Fetch attestation from Circle Attestation Service API.
  const attestation = await fetchAttestation(messageHash);

  // Call `receiveMessage` function to mint USDC to the recipient address
  if (attestation) {
    return contract
      .receiveMessage(message, attestation)
      .then((tx) => tx.wait());
  }
}
