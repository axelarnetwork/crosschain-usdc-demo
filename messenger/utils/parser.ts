import { ethers } from "ethers";
import { GATEWAY } from "../constants/address";
import { Chain } from "../constants/chains";
import { WSS } from "../constants/endpoint";
import { getCallContractEvent } from "../utils/event";

export async function parseCallContractLog(txHash: string, chain: Chain) {
  const srcProvider = new ethers.providers.WebSocketProvider(WSS[chain]);
  const txReceipt = await srcProvider.getTransactionReceipt(txHash);

  const srcGatewayContract = new ethers.Contract(GATEWAY[chain], [
    "event ContractCall(address indexed sender, string destinationChain, string destinationContractAddress, bytes32 indexed payloadHash, bytes payload)",
  ]);

  return getCallContractEvent(srcGatewayContract, txReceipt);
}
