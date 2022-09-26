import { ChainName } from "types/chain";
import { Relayer } from "defender-relay-client";
import { PopulatedTransaction } from "ethers";

export async function sendTx(chain: ChainName, rawTx: PopulatedTransaction) {
  const credentials = getCredential(chain);
  const relayer = new Relayer(credentials);
  return relayer.sendTransaction({
    gasLimit: rawTx.gasLimit?.toNumber() || 1000000,
    to: rawTx.to,
    data: rawTx.data,
    value: rawTx.value?.toNumber() || 0,
    speed: getTxSpeed(chain),
  });
}

function getCredential(chain: ChainName) {
  if (chain === ChainName.AVALANCHE) {
    return {
      apiKey: process.env.DEFENDER_AVALANCHE_API_KEY || "",
      apiSecret: process.env.DEFENDER_AVALANCHE_API_SECRET || "",
    };
  } else {
    return {
      apiKey: process.env.DEFENDER_ETHEREUM_API_KEY || "",
      apiSecret: process.env.DEFENDER_ETHEREUM_API_SECRET || "",
    };
  }
}

function getTxSpeed(chain: ChainName) {
  if (chain === ChainName.AVALANCHE) {
    return "fast";
  } else {
    return "average";
  }
}
