import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BayPointMarketplace } from "../target/types/bay_point_marketplace";
import { PublicKey } from "@solana/web3.js";
import fs from "fs";
import path from "path";

const BAY_TOKEN_MINT = "bay3egCym863ziQsvesuGptuGDkekVN6jwwdPd3Ywu2";

async function main() {
  console.log("🏪 Initializing BAY Point Marketplace...");
  
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.BayPointMarketplace as Program<BayPointMarketplace>;
  
  const tokenMint = new PublicKey(BAY_TOKEN_MINT);
  
  const [marketplace] = PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace")],
    program.programId
  );
  
  const [treasury] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), marketplace.toBuffer()],
    program.programId
  );
  
  console.log("Marketplace PDA:", marketplace.toString());
  console.log("Treasury PDA:", treasury.toString());
  console.log("Admin:", provider.wallet.publicKey.toString());
  console.log("BAY Token Mint:", tokenMint.toString());
  
  try {
    const marketplaceAccount = await program.account.marketplaceState.fetch(marketplace);
    console.log("⚠️  Marketplace already initialized");
    console.log("Admin:", marketplaceAccount.admin.toString());
    console.log("Token Mint:", marketplaceAccount.tokenMint.toString());
    console.log("Product Count:", marketplaceAccount.productCount.toString());
    return;
  } catch (error) {
    console.log("Marketplace not initialized yet. Proceeding with initialization...");
  }
  
  try {
    const tx = await program.methods
      .initializeMarketplace()
      .accounts({
        marketplace,
        tokenMint,
        treasury,
        admin: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    
    console.log("✅ Marketplace initialized successfully!");
    console.log("Transaction signature:", tx);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const marketplaceAccount = await program.account.marketplaceState.fetch(marketplace);
    
    const initInfo = {
      marketplace: marketplace.toString(),
      treasury: treasury.toString(),
      admin: marketplaceAccount.admin.toString(),
      tokenMint: marketplaceAccount.tokenMint.toString(),
      productCount: marketplaceAccount.productCount.toString(),
      totalSales: marketplaceAccount.totalSales.toString(),
      isInitialized: marketplaceAccount.isInitialized,
      initializedAt: new Date().toISOString(),
      transactionSignature: tx,
    };
    
    const initPath = path.join(__dirname, "../marketplace-init.json");
    fs.writeFileSync(initPath, JSON.stringify(initInfo, null, 2));
    
    console.log("\n📋 Initialization Summary:");
    console.log("===========================");
    console.log(JSON.stringify(initInfo, null, 2));
    console.log("\n🎉 Marketplace initialization completed!");
    console.log("Next step: Run 'npm run admin' to manage products");
    
  } catch (error) {
    console.error("❌ Initialization failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});