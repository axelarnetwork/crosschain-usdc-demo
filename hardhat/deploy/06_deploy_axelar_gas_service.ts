import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  const result: DeployResult = await deploy("FakeAxelarGasService", {
    from: deployer,
    log: true,
  });

  await hre
    .run("verify:verify", {
      address: result.address,
      constructorArguments: [],
    })
    .catch((e) => console.log(e.message));
};

deploy.tags = ["FakeAxelarGasService"];

export default deploy;
