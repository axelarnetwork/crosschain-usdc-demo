import { Chain } from "./chains";

export const RPC = {
  [Chain.AVALANCHE]: "https://api.avax-test.network/ext/bc/C/rpc",
  [Chain.MOONBEAM]: "https://rpc.api.moonbase.moonbeam.network",
  [Chain.FANTOM]:
    "https://fantom-testnet.blastapi.io/aa724548-b1ae-4f26-935b-69827f8a1706",
  [Chain.POLYGON]: "https://rpc-mumbai.maticvigil.com",
  [Chain.ETHEREUM]:
    "https://goerli.infura.io/v3/b0e255b9ef4b442c97f8a7458f8bd6ad",
};

export const WSS = {
  [Chain.AVALANCHE]: "wss://api.avax-test.network/ext/bc/C/ws",
  [Chain.MOONBEAM]: "wss://wss.api.moonbase.moonbeam.network",
  [Chain.FANTOM]:
    "wss://fantom-testnet.blastapi.io/aa724548-b1ae-4f26-935b-69827f8a1706",
  [Chain.POLYGON]: "wss://rpc-mumbai.maticvigil.com/ws",
  [Chain.ETHEREUM]:
    "wss://goerli.infura.io/ws/v3/b0e255b9ef4b442c97f8a7458f8bd6ad",
};

export const ATTESTATION_BASE_API = "https://iris-api-sandbox.circle.com";
