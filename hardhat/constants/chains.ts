import { GasToken } from "@axelar-network/axelarjs-sdk";

export enum Chain {
  MOONBEAM = "moonbeam",
  AVALANCHE = "avalanche",
  ETHEREUM = "ethereum-2",
  FANTOM = "fantom",
  POLYGON = "polygon",
}

export const NativeToken = {
  [Chain.MOONBEAM]: GasToken.GLMR,
  [Chain.AVALANCHE]: GasToken.AVAX,
  [Chain.ETHEREUM]: GasToken.ETH,
  [Chain.FANTOM]: GasToken.FTM,
  [Chain.POLYGON]: GasToken.MATIC,
};
