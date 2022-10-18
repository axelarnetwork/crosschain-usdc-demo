import { ethers } from "ethers";

export const MESSAGE_TRANSMITTER_ADDRESS = {
  ethereum: "0x40A61D3D2AfcF5A5d31FcDf269e575fB99dd87f7",
  avalanche: "0x52FfFb3EE8Fa7838e9858A2D5e454007b9027c3C",
};
export const PROVIDERS = {
  ethereum: new ethers.providers.WebSocketProvider(
    "wss://goerli.infura.io/ws/v3/INFURA_PROJECT_ID"
  ),
  avalanche: new ethers.providers.WebSocketProvider(
    "wss://api.avax-test.network/ext/bc/C/ws"
  ),
};
