import { task } from "hardhat/config";
import { CIRCLE_SWAP_EXECUTABLE, USDC } from "../constants/address";
import { Chain } from "../constants/chains";
import circleSwapExecutableAbi from "./abi/circleSwapExecutable.json";

task("addSibling", "Add sibling contract to the CircleSwapExecutable contract")
  .addPositionalParam("siblingChain")
  .setAction(async (taskArgs, hre) => {
    const { siblingChain } = taskArgs;
    const ethers = hre.ethers;
    const [deployer] = await ethers.getSigners();
    const chainId = hre.config.networks[siblingChain].chainId;
    const chainName = hre.network.name as Chain;
    const siblingChainName = siblingChain as Chain;

    if (chainName !== Chain.MOONBEAM && chainName !== Chain.AVALANCHE) return;
    if (
      siblingChainName !== Chain.MOONBEAM &&
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
        chainId,
        CIRCLE_SWAP_EXECUTABLE[siblingChainName]
      )
      .then((tx: any) => tx.wait());

    console.log("Added sibling", tx.transactionHash);
  });
