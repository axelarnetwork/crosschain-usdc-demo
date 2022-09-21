import { task } from "hardhat/config";
import { CIRCLE_SWAP_EXECUTABLE, USDC } from "../constants/address";
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
    if (!CIRCLE_SWAP_EXECUTABLE[siblingChainName]) return;

    const contract = new ethers.Contract(
      CIRCLE_SWAP_EXECUTABLE[chainName],
      circleSwapExecutableAbi,
      deployer
    );
    const tx = await contract
      .addSibling(
        siblingChain,
        SIBLING_CHAINS[siblingChainName],
        "0xa411977dd24F1547065C6630E468a43275cB4d7f"
        // CIRCLE_SWAP_EXECUTABLE[siblingChainName]
      )
      .then((tx: any) => tx.wait());

    console.log("Added sibling", tx.transactionHash);
  });
