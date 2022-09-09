import { HardhatRuntimeEnvironment } from "hardhat/types";

const setupMinterRole = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments } = hre;
  const { execute } = deployments;
  const namedAccounts = await getNamedAccounts();
  const { deployer } = namedAccounts;
  const MessageTransmitter = await deployments.get("MessageTransmitter");
  const CircleBridge = await deployments.get("CircleBridge");
  console.log("Setting up burner role for USDC...");
  const burnerTx = await execute(
    "USDC",
    { from: deployer },
    "setBurnerRole",
    CircleBridge.address
  );
  console.log("Burner role set for USDC:", burnerTx.transactionHash);
  console.log("Setting up minter role for USDC...");
  const minterTx = await execute(
    "USDC",
    { from: deployer },
    "setMinterRole",
    MessageTransmitter.address
  );
  console.log("Minter role set for USDC:", minterTx.transactionHash);
};

setupMinterRole.tags = ["MessageTransmitter", "CircleBridge"];
setupMinterRole.runAtTheEnd = true;

export default setupMinterRole;
