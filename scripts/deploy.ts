import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const platformFee = 250; // 2.5% in basis points

  const AIInferenceMarketplace = await ethers.getContractFactory("AIInferenceMarketplace");
  const marketplace = await AIInferenceMarketplace.deploy(platformFee);

  await marketplace.deployed();

  console.log("AIInferenceMarketplace deployed to:", marketplace.address);
  console.log("Platform fee set to:", platformFee, "basis points");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 