import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { deployments } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  const chainId = await hre.getChainId();
  const usdc = await deployments.get("USDC");
  const args = [usdc.address, parseInt(chainId)];
  const result: DeployResult = await deploy("CircleBridge", {
    from: deployer,
    args,
    log: true,
  });

  await hre
    .run("verify:verify", {
      address: result.address,
      constructorArguments: args,
    })
    .catch((e) => console.log(e.message));
};

deploy.tags = ["CircleBridge"];
deploy.dependencies = ["USDC"];

export default deploy;
