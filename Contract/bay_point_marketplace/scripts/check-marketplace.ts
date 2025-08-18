import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { BayPointMarketplace } from "../target/types/bay_point_marketplace";
const fs = require("fs");

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const programId = new PublicKey("8NPWArWjjQthDGGLppygtwwSMtUtajt4jpzVsfu98RAo");
  
  // Load admin wallet
  const walletPath = "./admin_bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u.json";
  const adminKeypair = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );
  
  const wallet = new anchor.Wallet(adminKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  
  anchor.setProvider(provider);
  
  // Load the program
  const idl = JSON.parse(
    fs.readFileSync("./target/idl/bay_point_marketplace.json", "utf-8")
  );
  
  const program = new anchor.Program<BayPointMarketplace>(
    idl,
    provider
  );
  
  const [marketplace] = PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace")],
    programId
  );
  
  console.log("Checking marketplace at:", marketplace.toString());
  
  try {
    const accountInfo = await connection.getAccountInfo(marketplace);
    if (accountInfo) {
      console.log("✅ Marketplace account exists!");
      console.log("  Owner:", accountInfo.owner.toString());
      console.log("  Data length:", accountInfo.data.length);
      
      // Try to fetch the marketplace state
      const marketplaceState = await program.account.marketplaceState.fetch(marketplace);
      console.log("\nMarketplace State:");
      console.log("  Admin:", marketplaceState.admin.toString());
      console.log("  Token Mint:", marketplaceState.tokenMint.toString());
      console.log("  Treasury:", marketplaceState.treasury.toString());
      console.log("  Product Count:", marketplaceState.productCount.toString());
      console.log("  Total Sales:", marketplaceState.totalSales.toString());
      console.log("  Initialized:", marketplaceState.isInitialized);
    } else {
      console.log("❌ Marketplace does not exist");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);