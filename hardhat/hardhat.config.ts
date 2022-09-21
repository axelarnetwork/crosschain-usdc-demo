import "hardhat-deploy";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import { HardhatUserConfig } from "hardhat/config";
import { privateKey } from "./secret.json";
import { Chain } from "./constants/chains";
import "./tasks";

const apiKey = {
  ETHERSCAN_API_KEY: "VCKWHFAA6M5AR8SFVXC43DEMEA8JN2H3WZ",
  MOONSCAN_API_KEY: "8H5PYNQ7P7ACZK46ZAPG67TTMHGIW49AR4",
  SNOWTRACE_API_KEY: "VRT69FQUYP8AY6EGJDEMJRH2PWMZRTXZIG",
  MUMBAISCAN_API_KEY: "JPEQY6SKPH488EUVJXRZN9DZYN8JPZPEGB",
  FTMSCAN_API_KEY: "HS5GVV3QMUJ38ER6UJG6JYNSNJ1P5B8VBR",
};

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  defaultNetwork: Chain.AVALANCHE,
  networks: {
    ethereum: {
      chainId: 5,
      gasMultiplier: 2,
      url: "https://goerli.infura.io/v3/a3a667b533f34fd48ca350546454ea05",
      accounts: [privateKey],
    },
    avalanche: {
      chainId: 43113,
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: [privateKey],
    },
    moonbeam: {
      chainId: 1287,
      url: "https://rpc.api.moonbase.moonbeam.network",
      accounts: [privateKey],
    },
    polygon: {
      chainId: 80001,
      url: "https://rpc-mumbai.maticvigil.com/", // polygon mumbai testnet rpc
      accounts: [privateKey],
    },
    fantom: {
      chainId: 4002,
      url: "https://rpc.testnet.fantom.network",
      accounts: [privateKey],
    },
  },
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: {
      goerli: apiKey.ETHERSCAN_API_KEY,
      avalancheFujiTestnet: apiKey.SNOWTRACE_API_KEY,
      moonbaseAlpha: apiKey.MOONSCAN_API_KEY,
      polygonMumbai: apiKey.MUMBAISCAN_API_KEY,
      ftmTestnet: apiKey.FTMSCAN_API_KEY,
    },
  },
};

export default config;
