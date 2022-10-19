import { task } from "hardhat/config";
import { CROSSCHAIN_NATIVE_SWAP, USDC } from "../constants/address";
import { Chain } from "../constants/chains";
import circleSwapExecutableAbi from "./abi/circleSwapExecutable.json";

const SIBLING_CHAINS = {
  [Chain.ETHEREUM]: 0,
  [Chain.AVALANCHE]: 1,
};

task("addSibling", "Add sibling contract to the CircleSwapExecutable contract")
  .addPositionalParam("siblingChain")
  .setAction(async (taskArgs, hre) => {
    const { siblingChain } = taskArgs;
    const ethers = hre.ethers;
    const [deployer] = await ethers.getSigners();
    const chainName = hre.network.name as Chain;
    const siblingChainName = siblingChain as Chain;

    if (chainName !== Chain.AVALANCHE && chainName !== Chain.ETHEREUM) return;
    if (
      siblingChainName !== Chain.ETHEREUM &&
      siblingChainName !== Chain.AVALANCHE
    )
      return;
    if (!CROSSCHAIN_NATIVE_SWAP[siblingChainName]) return;

    const contract = new ethers.Contract(
      CROSSCHAIN_NATIVE_SWAP[chainName],
      circleSwapExecutableAbi,
      deployer
    );
    const tx = await contract
      .addSibling(
        siblingChain === "ethereum" ? "ethereum-2" : siblingChain,
        CROSSCHAIN_NATIVE_SWAP[siblingChainName]
      )
      .then((tx: any) => tx.wait());

    console.log("Added sibling", tx.transactionHash);
  });
