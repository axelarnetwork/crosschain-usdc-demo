import { Chain } from "./chains";

export const GATEWAY = {
  [Chain.ETHEREUM]: "0xe432150cce91c13a887f7D836923d5597adD8E31",
  [Chain.AVALANCHE]: "0xC249632c2D40b9001FE907806902f63038B737Ab",
  [Chain.MOONBEAM]: "0x5769D84DD62a6fD969856c75c7D321b84d455929",
  [Chain.POLYGON]: "0xBF62ef1486468a6bd26Dd669C06db43dEd5B849B",
  [Chain.FANTOM]: "0x97837985Ec0494E7b9C71f5D3f9250188477ae14",
};

export const GAS_RECEIVER = {
  [Chain.ETHEREUM]: "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6",
  [Chain.AVALANCHE]: "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6",
  [Chain.MOONBEAM]: "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6",
  [Chain.POLYGON]: "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6",
  [Chain.FANTOM]: "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6",
};

export const ROUTER = {
  [Chain.AVALANCHE]: "0x2D99ABD9008Dc933ff5c0CD271B88309593aB921",
  [Chain.ETHEREUM]: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  [Chain.MOONBEAM]: "0x8a1932D6E26433F3037bd6c3A40C816222a6Ccd4",
  [Chain.POLYGON]: "0x8954AfA98594b838bda56FE4C12a09D7739D179b",
  [Chain.FANTOM]: "0x9fE0E1636735153B0b1f5f5b98B5e93C203c94cc",
};

export const WRAPPED_NATIVE_ASSET = {
  [Chain.ETHEREUM]: "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",
  [Chain.MOONBEAM]: "0xD909178CC99d318e4D46e7E66a972955859670E1",
  [Chain.AVALANCHE]: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c",
  [Chain.POLYGON]: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
  [Chain.FANTOM]: "0x3a34e91226052c509cb0dc38dcdefe6a028f869e",
};

export const USDC = {
  [Chain.AVALANCHE]: "0x5425890298aed601595a70ab815c96711a31bc65",
  [Chain.ETHEREUM]: "0x07865c6e87b9f70255377e024ace6630c1eaa37f",
  [Chain.MOONBEAM]: "",
  [Chain.POLYGON]: "",
  [Chain.FANTOM]: "",
};

export const CIRCLE_SWAP_EXECUTABLE = {
  [Chain.AVALANCHE]: "0x18573F9EA647A1ec87456D99978A94C2431347BE",
  [Chain.ETHEREUM]: "0xb7F760CD8613d45c539BE6F52539016D1e920cBD",
  [Chain.MOONBEAM]: "",
  [Chain.POLYGON]: "",
  [Chain.FANTOM]: "",
};

export const MESSAGE_TRANSMITTER = {
  [Chain.AVALANCHE]: "0x52FfFb3EE8Fa7838e9858A2D5e454007b9027c3C",
  [Chain.ETHEREUM]: "0x40A61D3D2AfcF5A5d31FcDf269e575fB99dd87f7",
  [Chain.MOONBEAM]: "",
  [Chain.POLYGON]: "",
  [Chain.FANTOM]: "",
};

export const CIRCLE_BRIDGE = {
  [Chain.AVALANCHE]: "0x0fC1103927AF27aF808D03135214718bCEDbE9ad",
  [Chain.ETHEREUM]: "0xdAbec94B97F7b5FCA28f050cC8EeAc2Dc9920476",
  [Chain.MOONBEAM]: "",
  [Chain.POLYGON]: "",
  [Chain.FANTOM]: "",
};

export const DOMAIN = {
  [Chain.ETHEREUM]: 0,
  [Chain.AVALANCHE]: 1,
};
