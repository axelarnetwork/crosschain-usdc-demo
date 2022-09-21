import { ChainId } from "types/chain";

export const getAddressLink = (chainId: ChainId, address: string) => {
  if (chainId === ChainId.AVALANCHE) {
    return `https://testnet.snowtrace.io/address/${address}`;
  } else if (chainId === ChainId.ETHEREUM) {
    return `https://goerli.etherscan.io/address/${address}`;
  }
  return "";
};

export const getTxLink = (chainId: ChainId, hash: string) => {
  if (chainId === ChainId.AVALANCHE) {
    return `https://testnet.snowtrace.io/tx/${hash}`;
  } else if (chainId === ChainId.ETHEREUM) {
    return `https://goerli.etherscan.io/tx/${hash}`;
  }
  return "";
};
