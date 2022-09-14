import { Chain } from "./chains";

export const RPC = {
  [Chain.AVALANCHE]: "https://api.avax-test.network/ext/bc/C/rpc",
  [Chain.MOONBEAM]: "https://rpc.api.moonbase.moonbeam.network",
  [Chain.FANTOM]:
    "https://fantom-testnet.blastapi.io/aa724548-b1ae-4f26-935b-69827f8a1706",
  [Chain.POLYGON]: "https://rpc-mumbai.maticvigil.com",
  [Chain.ETHEREUM]:
    "https://ropsten.infura.io/v3/6b8c3c7f3f1d4c3e9c2d3f7f8e7e5e65",
};

export const WSS = {
  [Chain.AVALANCHE]: "wss://api.avax-test.network/ext/bc/C/ws",
  [Chain.MOONBEAM]: "wss://wss.api.moonbase.moonbeam.network",
  [Chain.FANTOM]:
    "wss://fantom-testnet.blastapi.io/aa724548-b1ae-4f26-935b-69827f8a1706",
  [Chain.POLYGON]: "wss://rpc-mumbai.maticvigil.com/ws",
  [Chain.ETHEREUM]:
    "wss://ropsten.infura.io/ws/v3/6b8c3c7f3f1d4c3e9c2d3f7f8e7e5e65",
};
