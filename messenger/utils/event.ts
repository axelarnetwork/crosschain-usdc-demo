import { Contract, ethers } from "ethers";

export const getCallContractEvent = (
  contract: Contract,
  txReceipt: ethers.providers.TransactionReceipt
) => {
  const eventLogs = txReceipt.logs;
  const contractCallEventId = ethers.utils.id(
    "ContractCall(address,string,string,bytes32,bytes)"
  );
  for (const log of eventLogs) {
    if (log.topics[0] === contractCallEventId) {
      return contract.interface.parseLog(log);
    }
  }
  return null;
};
