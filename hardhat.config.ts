import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  typechain: {
    outDir: "src/types/contracts",
    target: "ethers-v5",
  },
  networks: {
    hardhat: {},
    "avalanche-testnet": {
      url: process.env.NEXT_PUBLIC_AVALANCHE_TESTNET_RPC,
      chainId: 43113,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    "avalanche-mainnet": {
      url: process.env.NEXT_PUBLIC_AVALANCHE_MAINNET_RPC,
      chainId: 43114,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config; 