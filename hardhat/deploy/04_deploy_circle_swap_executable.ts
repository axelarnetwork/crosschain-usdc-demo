import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { deployments } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  CIRCLE_BRIDGE,
  GAS_RECEIVER,
  GATEWAY,
  USDC,
  WRAPPED_NATIVE_ASSET,
} from "../constants/address";
import { Chain } from "../constants/chains";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  const chainName = hre.network.name as Chain;
  const args = [
    GATEWAY[chainName],
    GAS_RECEIVER[chainName],
    USDC[chainName],
    CIRCLE_BRIDGE[chainName],
    WRAPPED_NATIVE_ASSET[chainName],
  ];
  const result: DeployResult = await deploy("CircleSwapExecutable", {
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

deploy.tags = ["CircleSwapExecutable"];

export default deploy;
