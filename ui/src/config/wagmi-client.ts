import { configureChains, createClient } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { chains as _chains } from "./constants";
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet";
import { InjectedConnector } from "wagmi/connectors/injected";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";

const { chains, provider } = configureChains(_chains, [
  jsonRpcProvider({
    rpc: (chain) => {
      return { http: chain?.rpcUrls?.default };
    },
  }),
]);

export const wagmiClient = createClient({
  autoConnect: true,
  provider,
  connectors: [
    new InjectedConnector({
      chains,
      options: {
        shimDisconnect: true,
      },
    }),
    new WalletConnectConnector({
      chains,
      options: {
        qrcode: true,
      },
    }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: "SquiDex",
      },
    }),
  ],
});
