import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BayPointMarketplace } from "../target/types/bay_point_marketplace";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createMint, 
  createAccount,
  mintTo,
  getAccount,
  getMint
} from "@solana/spl-token";
import fs from "fs";

async function main() {
  console.log("=== Debug Purchase Issue ===");
  
  // Configure the client to use devnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BayPointMarketplace as Program<BayPointMarketplace>;
  
  // Load admin keypair
  const adminKeypairData = JSON.parse(
    fs.readFileSync("./admin_bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u.json", "utf-8")
  );
  const adminKeypair = Keypair.fromSecretKey(new Uint8Array(adminKeypairData));
  
  // Create a test buyer keypair
  const buyerKeypair = Keypair.generate();
  
  console.log("\n📍 Addresses:");
  console.log("Admin:", adminKeypair.publicKey.toString());
  console.log("Buyer:", buyerKeypair.publicKey.toString());
  console.log("Program ID:", program.programId.toString());

  // Airdrop SOL to buyer
  console.log("\nAirdropping SOL to buyer...");
  const airdropSig = await provider.connection.requestAirdrop(
    buyerKeypair.publicKey,
    2 * anchor.web3.LAMPORTS_PER_SOL
  );
  await provider.connection.confirmTransaction(airdropSig);

  // Create token mint with TOKEN_PROGRAM_ID (not TOKEN_2022)
  console.log("\n📦 Creating BAY Point token mint with standard Token Program...");
  const tokenMint = await createMint(
    provider.connection,
    adminKeypair,
    adminKeypair.publicKey,
    null,
    6, // 6 decimals
    undefined, // Let it default
    undefined, // Let it default
    TOKEN_PROGRAM_ID // Explicitly use standard token program
  );
  console.log("Token mint:", tokenMint.toString());
  
  // Check mint info
  const mintInfo = await getMint(provider.connection, tokenMint);
  console.log("Mint decimals:", mintInfo.decimals);
  console.log("Mint supply:", mintInfo.supply.toString());

  // Create token accounts
  console.log("\n💳 Creating token accounts...");
  const adminTokenAccount = await createAccount(
    provider.connection,
    adminKeypair,
    tokenMint,
    adminKeypair.publicKey,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );
  console.log("Admin token account:", adminTokenAccount.toString());

  const buyerTokenAccount = await createAccount(
    provider.connection,
    buyerKeypair,
    tokenMint,
    buyerKeypair.publicKey,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );
  console.log("Buyer token account:", buyerTokenAccount.toString());

  // Mint tokens with correct decimals
  console.log("\n💰 Minting tokens...");
  await mintTo(
    provider.connection,
    adminKeypair,
    tokenMint,
    buyerTokenAccount,
    adminKeypair,
    5000 * Math.pow(10, 6), // 5,000 tokens with 6 decimals
    [],
    undefined,
    TOKEN_PROGRAM_ID
  );
  
  const buyerBalance = await getAccount(provider.connection, buyerTokenAccount);
  console.log("Buyer token balance:", Number(buyerBalance.amount) / Math.pow(10, 6), "tokens");

  // Derive PDAs
  const [marketplacePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace")],
    program.programId
  );
  console.log("\n🏪 Marketplace PDA:", marketplacePda.toString());

  const [treasuryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), marketplacePda.toBuffer()],
    program.programId
  );
  console.log("💎 Treasury PDA:", treasuryPda.toString());

  // Initialize marketplace if needed
  console.log("\n=== Initialize Marketplace ===");
  try {
    const tx = await program.methods
      .initializeMarketplace()
      .accountsStrict({
        marketplace: marketplacePda,
        tokenMint: tokenMint,
        treasury: treasuryPda,
        admin: adminKeypair.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID, // Use standard token program
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([adminKeypair])
      .rpc();

    console.log("✅ Marketplace initialized:", tx);
  } catch (error: any) {
    if (error.toString().includes("already been initialized")) {
      console.log("⚠️  Marketplace already initialized");
      
      // Check if it's using the same mint
      const marketplaceAccount = await program.account.marketplaceState.fetch(marketplacePda);
      console.log("Existing token mint:", marketplaceAccount.tokenMint.toString());
      console.log("Our token mint:", tokenMint.toString());
      
      if (!marketplaceAccount.tokenMint.equals(tokenMint)) {
        console.error("❌ Marketplace is using a different token mint!");
        console.log("The marketplace is using a different token mint.");
        return;
      }
    } else {
      throw error;
    }
  }

  // Add a product
  console.log("\n=== Add Product ===");
  const productId = 0;
  const [productPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("product"),
      marketplacePda.toBuffer(),
      new anchor.BN(productId).toArrayLike(Buffer, "le", 8)
    ],
    program.programId
  );

  try {
    const tx = await program.methods
      .addProduct(
        "Test Product",
        "A test product for debugging",
        new anchor.BN(100 * Math.pow(10, 6)), // 100 tokens with 6 decimals
        new anchor.BN(10) // 10 in stock
      )
      .accountsStrict({
        marketplace: marketplacePda,
        product: productPda,
        admin: adminKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([adminKeypair])
      .rpc();

    console.log("✅ Product added:", tx);
  } catch (error: any) {
    console.log("Product might already exist, continuing...");
  }

  // Try to purchase
  console.log("\n=== Attempting Purchase ===");
  const quantity = 1;
  const purchaseId = 0;
  
  const [purchasePda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("purchase"),
      buyerKeypair.publicKey.toBuffer(),
      new anchor.BN(purchaseId).toArrayLike(Buffer, "le", 8)
    ],
    program.programId
  );

  try {
    console.log("\n📋 Purchase details:");
    console.log("- Product ID:", productId);
    console.log("- Quantity:", quantity);
    console.log("- Buyer token account:", buyerTokenAccount.toString());
    console.log("- Treasury:", treasuryPda.toString());
    console.log("- Token mint:", tokenMint.toString());
    console.log("- Token program:", TOKEN_PROGRAM_ID.toString());
    
    const tx = await program.methods
      .purchaseProduct(
        new anchor.BN(productId),
        new anchor.BN(quantity)
      )
      .accountsStrict({
        marketplace: marketplacePda,
        tokenMint: tokenMint,
        product: productPda,
        purchase: purchasePda,
        buyerTokenAccount: buyerTokenAccount,
        treasury: treasuryPda,
        buyer: buyerKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID, // Use standard token program
        systemProgram: SystemProgram.programId,
      })
      .signers([buyerKeypair])
      .rpc();

    console.log("✅ Purchase successful:", tx);
    
    const buyerBalanceAfter = await getAccount(provider.connection, buyerTokenAccount);
    console.log("Buyer balance after:", Number(buyerBalanceAfter.amount) / Math.pow(10, 6), "tokens");
    
  } catch (error: any) {
    console.error("\n❌ Purchase failed!");
    console.error("Error:", error.toString());
    
    if (error.logs) {
      console.error("\n📜 Transaction logs:");
      error.logs.forEach((log: string) => console.error(log));
    }
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});