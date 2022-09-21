import { Chain } from "wagmi";

export enum ChainName {
  AVALANCHE = "avalanche",
  ETHEREUM = "ethereum",
}

export enum ChainId {
  AVALANCHE = 43113,
  ETHEREUM = 5,
}

export interface SquidChain extends Chain {
  name: ChainName;
  icon: string;
  swapExecutorAddress: string;
  gatewayAddress: string;
  routerAddress: string;
  wrappedNativeToken: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: 18;
  };
  multicallAddress: string;
}
