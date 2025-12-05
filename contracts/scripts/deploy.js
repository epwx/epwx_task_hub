const hre = require("hardhat");

async function main() {
  console.log("Deploying EPWX Task Platform contracts to Base...");

  // EPWX Token address on Base
  const EPWX_TOKEN_ADDRESS = process.env.EPWX_TOKEN_ADDRESS || "0xef5f5751cf3eca6cc3572768298b7783d33d60eb";

  console.log(`Using EPWX Token at: ${EPWX_TOKEN_ADDRESS}`);

  // Deploy TaskManager
  const TaskManager = await hre.ethers.getContractFactory("TaskManager");
  const taskManager = await TaskManager.deploy(EPWX_TOKEN_ADDRESS);

  await taskManager.waitForDeployment();
  const taskManagerAddress = await taskManager.getAddress();

  console.log(`TaskManager deployed to: ${taskManagerAddress}`);

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  await taskManager.deploymentTransaction().wait(5);

  console.log("\n=== Deployment Summary ===");
  console.log(`Network: ${hre.network.name}`);
  console.log(`EPWX Token: ${EPWX_TOKEN_ADDRESS}`);
  console.log(`TaskManager: ${taskManagerAddress}`);
  console.log("\n=== Next Steps ===");
  console.log(`1. Verify contract on BaseScan:`);
  console.log(`   npx hardhat verify --network ${hre.network.name} ${taskManagerAddress} ${EPWX_TOKEN_ADDRESS}`);
  console.log(`2. Update backend .env with:`);
  console.log(`   TASK_MANAGER_CONTRACT=${taskManagerAddress}`);
  console.log(`3. Update frontend config with contract address`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
