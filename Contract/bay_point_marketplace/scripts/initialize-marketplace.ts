import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BayPointMarketplace } from "../target/types/bay_point_marketplace";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import { BAY_TOKEN_MINT } from "../tests/constants";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

async function main() {
  // Setup connection and provider
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  // Load admin wallet
  const walletPath = "./admin_bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u.json";
  const adminKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );
  
  const wallet = new anchor.Wallet(adminKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  
  anchor.setProvider(provider);
  
  // Load the program
  const programId = new PublicKey("8NPWArWjjQthDGGLppygtwwSMtUtajt4jpzVsfu98RAo");
  const idl = JSON.parse(
    fs.readFileSync("./target/idl/bay_point_marketplace.json", "utf-8")
  );
  
  const program = new anchor.Program<BayPointMarketplace>(
    idl,
    provider
  );
  
  try {
    // Derive PDAs
    const [marketplace] = PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace")],
      program.programId
    );
    
    const [treasury] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), marketplace.toBuffer()],
      program.programId
    );
    
    console.log("Initializing marketplace with:");
    console.log("  Admin:", adminKeypair.publicKey.toString());
    console.log("  BAY Token Mint:", BAY_TOKEN_MINT.toString());
    console.log("  Marketplace PDA:", marketplace.toString());
    console.log("  Treasury PDA:", treasury.toString());
    
    // Initialize the marketplace
    const tx = await program.methods
      .initializeMarketplace()
      .accountsStrict({
        marketplace,
        tokenMint: BAY_TOKEN_MINT,
        treasury,
        admin: adminKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    
    console.log("✅ Marketplace initialized successfully!");
    console.log("Transaction signature:", tx);
    
    // Fetch and display marketplace state
    const marketplaceState = await program.account.marketplaceState.fetch(marketplace);
    console.log("\nMarketplace State:");
    console.log("  Admin:", marketplaceState.admin.toString());
    console.log("  Token Mint:", marketplaceState.tokenMint.toString());
    console.log("  Treasury:", marketplaceState.treasury.toString());
    console.log("  Product Count:", marketplaceState.productCount.toString());
    console.log("  Total Sales:", marketplaceState.totalSales.toString());
    console.log("  Initialized:", marketplaceState.isInitialized);
    
  } catch (error) {
    console.error("Error initializing marketplace:", error);
    // If already initialized, fetch the current state
    if (error.toString().includes("already")) {
      try {
        const [marketplace] = PublicKey.findProgramAddressSync(
          [Buffer.from("marketplace")],
          program.programId
        );
        const marketplaceState = await program.account.marketplaceState.fetch(marketplace);
        console.log("\nMarketplace already initialized. Current state:");
        console.log("  Admin:", marketplaceState.admin.toString());
        console.log("  Token Mint:", marketplaceState.tokenMint.toString());
        console.log("  Treasury:", marketplaceState.treasury.toString());
        console.log("  Product Count:", marketplaceState.productCount.toString());
        console.log("  Total Sales:", marketplaceState.totalSales.toString());
      } catch (fetchError) {
        console.error("Could not fetch marketplace state:", fetchError);
      }
    }
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);