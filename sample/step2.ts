import { ethers } from "ethers";
import { MESSAGE_TRANSMITTER_ADDRESS, PROVIDERS } from "./constant";

// Extract the `message` from the `MessageSent` event
const getMessageFromMessageSentEvent = (
  contract: ethers.Contract,
  txReceipt: ethers.providers.TransactionReceipt
) => {
  const eventLogs = txReceipt.logs;
  const messageSentEventId = ethers.utils.id("MessageSent(bytes)");
  for (const log of eventLogs) {
    if (log.topics[0] === messageSentEventId) {
      return contract.interface.parseLog(log).args.message;
    }
  }
  return null;
};

// Get message based on txHash
export async function getMessageFromTxHash(txHash: string, chain: string) {
  // Initialize MessageTransmitter contract
  const srcContract = new ethers.Contract(
    MESSAGE_TRANSMITTER_ADDRESS[chain],
    ["event MessageSent(bytes message)"],
    PROVIDERS[chain]
  );

  // Retrieves transaction receipt
  const txReceipt = await PROVIDERS[chain].getTransactionReceipt(txHash);

  // Retrives `message` from transaction receipt
  return getMessageFromMessageSentEvent(srcContract, txReceipt);
}
