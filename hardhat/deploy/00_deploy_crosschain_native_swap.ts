import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  CIRCLE_BRIDGE,
  GAS_RECEIVER,
  GATEWAY,
  USDC,
} from "../constants/address";
import { Chain } from "../constants/chains";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  const chainName = hre.network.name as Chain;
  const args = [
    USDC[chainName],
    GAS_RECEIVER[chainName],
    GATEWAY[chainName],
    CIRCLE_BRIDGE[chainName],
  ];
  const result: DeployResult = await deploy("CrosschainNativeSwap", {
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

deploy.tags = ["CrosschainNativeSwap"];

export default deploy;
