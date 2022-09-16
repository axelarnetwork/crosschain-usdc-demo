import { ChainId } from "types/chain";

export const getAddressLink = (chainId: ChainId, address: string) => {
  if (chainId === ChainId.AVALANCHE) {
    return `https://testnet.snowtrace.io/address/${address}`;
  } else if (chainId === ChainId.FANTOM) {
    return `https://testnet.ftmscan.com/address/${address}`;
  }
  return "";
};

export const getTxLink = (chainId: ChainId, hash: string) => {
  if (chainId === ChainId.AVALANCHE) {
    return `https://testnet.snowtrace.io/tx/${hash}`;
  } else if (chainId === ChainId.FANTOM) {
    return `https://testnet.ftmscan.com/tx/${hash}`;
  }
  return "";
};
