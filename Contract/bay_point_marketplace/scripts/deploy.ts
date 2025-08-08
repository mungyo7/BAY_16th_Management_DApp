import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BayPointMarketplace } from "../target/types/bay_point_marketplace";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting deployment of BAY Point Marketplace...");
  
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.BayPointMarketplace as Program<BayPointMarketplace>;
  
  console.log("Program ID:", program.programId.toString());
  console.log("Provider wallet:", provider.wallet.publicKey.toString());
  console.log("Network:", provider.connection.rpcEndpoint);
  
  const deploymentInfo = {
    programId: program.programId.toString(),
    deployedAt: new Date().toISOString(),
    network: provider.connection.rpcEndpoint,
    deployedBy: provider.wallet.publicKey.toString(),
  };
  
  const deploymentPath = path.join(__dirname, "../deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("✅ Deployment information saved to deployment.json");
  console.log("\n📋 Deployment Summary:");
  console.log("=======================");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("\n🎉 Deployment completed successfully!");
  console.log("Next step: Run 'npm run initialize' to initialize the marketplace");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});