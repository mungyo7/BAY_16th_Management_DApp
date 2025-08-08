import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BayPointMarketplace } from "../target/types/bay_point_marketplace";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID,
  createMint, 
  createAccount,
  mintTo,
  getAccount,
  getMint
} from "@solana/spl-token";
import fs from "fs";

async function main() {
  console.log("=== Testing Purchase Fix for Decimal Issue ===");
  
  // Configure the client to use devnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BayPointMarketplace as Program<BayPointMarketplace>;
  
  // Load admin keypair
  const adminKeypairData = JSON.parse(
    fs.readFileSync("./admin_bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u.json", "utf-8")
  );
  const adminKeypair = Keypair.fromSecretKey(new Uint8Array(adminKeypairData));
  
  // Create test buyer
  const buyerKeypair = Keypair.generate();
  
  console.log("\n📍 Configuration:");
  console.log("Admin:", adminKeypair.publicKey.toString());
  console.log("Buyer:", buyerKeypair.publicKey.toString());
  console.log("Program ID:", program.programId.toString());

  // Airdrop SOL to buyer
  console.log("\n💸 Airdropping SOL to buyer...");
  const airdropSig = await provider.connection.requestAirdrop(
    buyerKeypair.publicKey,
    2 * anchor.web3.LAMPORTS_PER_SOL
  );
  await provider.connection.confirmTransaction(airdropSig);
  console.log("✅ Airdrop completed");

  // Create BAY token mint with 6 decimals using standard TOKEN_PROGRAM_ID
  console.log("\n🪙 Creating BAY token mint (6 decimals, standard token program)...");
  const tokenMint = await createMint(
    provider.connection,
    adminKeypair,
    adminKeypair.publicKey,
    null,
    6, // 6 decimals for BAY token
    undefined,
    undefined,
    TOKEN_PROGRAM_ID // Explicitly use standard token program
  );
  console.log("Token mint:", tokenMint.toString());
  
  // Verify mint configuration
  const mintInfo = await getMint(provider.connection, tokenMint, undefined, TOKEN_PROGRAM_ID);
  console.log("✅ Mint decimals:", mintInfo.decimals);
  console.log("✅ Mint supply:", mintInfo.supply.toString());

  // Create token accounts using standard token program
  console.log("\n💳 Creating token accounts...");
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

  // Mint tokens to buyer (with correct decimals)
  console.log("\n💰 Minting tokens to buyer...");
  const mintAmount = 1000 * Math.pow(10, 6); // 1000 tokens with 6 decimals
  await mintTo(
    provider.connection,
    adminKeypair,
    tokenMint,
    buyerTokenAccount,
    adminKeypair,
    mintAmount,
    [],
    undefined,
    TOKEN_PROGRAM_ID
  );
  
  const buyerBalance = await getAccount(
    provider.connection, 
    buyerTokenAccount,
    undefined,
    TOKEN_PROGRAM_ID
  );
  console.log("✅ Buyer balance:", Number(buyerBalance.amount) / Math.pow(10, 6), "BAY tokens");

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

  // Initialize marketplace with standard token program
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
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([adminKeypair])
      .rpc();

    console.log("✅ Marketplace initialized:", tx);
    
    const marketplaceAccount = await program.account.marketplaceState.fetch(marketplacePda);
    console.log("Token mint in marketplace:", marketplaceAccount.tokenMint.toString());
    console.log("Treasury in marketplace:", marketplaceAccount.treasury.toString());
  } catch (error: any) {
    if (error.toString().includes("already been initialized")) {
      console.log("⚠️  Marketplace already initialized, checking configuration...");
      
      const marketplaceAccount = await program.account.marketplaceState.fetch(marketplacePda);
      console.log("Existing token mint:", marketplaceAccount.tokenMint.toString());
      
      if (!marketplaceAccount.tokenMint.equals(tokenMint)) {
        console.error("❌ Marketplace uses different token mint!");
        return;
      }
    } else {
      throw error;
    }
  }

  // Add a test product
  console.log("\n=== Add Test Product ===");
  const productId = Date.now() % 1000; // Random product ID
  const [productPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("product"),
      marketplacePda.toBuffer(),
      new anchor.BN(productId).toArrayLike(Buffer, "le", 8)
    ],
    program.programId
  );

  const productPrice = 100 * Math.pow(10, 6); // 100 BAY tokens with 6 decimals
  
  try {
    const tx = await program.methods
      .addProduct(
        `Test Product ${productId}`,
        "Testing decimal fix",
        new anchor.BN(productPrice),
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
    
    const productAccount = await program.account.product.fetch(productPda);
    console.log("Product price:", productAccount.price.toNumber() / Math.pow(10, 6), "BAY tokens");
    console.log("Product stock:", productAccount.stock.toString());
  } catch (error: any) {
    console.error("Product creation error:", error);
    return;
  }

  // Attempt purchase with correct decimals
  console.log("\n=== Testing Purchase with Correct Decimals ===");
  const quantity = 1;
  
  // Get current marketplace state for purchase ID
  const marketplaceState = await program.account.marketplaceState.fetch(marketplacePda);
  const purchaseId = marketplaceState.totalSales.toNumber();
  
  const [purchasePda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("purchase"),
      buyerKeypair.publicKey.toBuffer(),
      new anchor.BN(purchaseId).toArrayLike(Buffer, "le", 8)
    ],
    program.programId
  );

  try {
    console.log("\n📋 Purchase Configuration:");
    console.log("- Product ID:", productId);
    console.log("- Quantity:", quantity);
    console.log("- Price per item:", productPrice / Math.pow(10, 6), "BAY tokens");
    console.log("- Total price:", (productPrice * quantity) / Math.pow(10, 6), "BAY tokens");
    console.log("- Buyer balance:", Number(buyerBalance.amount) / Math.pow(10, 6), "BAY tokens");
    console.log("- Token mint:", tokenMint.toString());
    console.log("- Token program:", TOKEN_PROGRAM_ID.toString());
    console.log("- Mint decimals:", mintInfo.decimals);
    
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

    console.log("\n✅ Purchase successful! TX:", tx);
    
    // Verify balances
    const buyerBalanceAfter = await getAccount(
      provider.connection,
      buyerTokenAccount,
      undefined,
      TOKEN_PROGRAM_ID
    );
    console.log("\n💰 Final Balances:");
    console.log("Buyer balance after:", Number(buyerBalanceAfter.amount) / Math.pow(10, 6), "BAY tokens");
    
    const treasuryBalance = await getAccount(
      provider.connection,
      treasuryPda,
      undefined,
      TOKEN_PROGRAM_ID
    );
    console.log("Treasury balance:", Number(treasuryBalance.amount) / Math.pow(10, 6), "BAY tokens");
    
    // Verify purchase record
    const purchaseAccount = await program.account.purchase.fetch(purchasePda);
    console.log("\n🧾 Purchase Record:");
    console.log("- Product ID:", purchaseAccount.productId.toString());
    console.log("- Buyer:", purchaseAccount.buyer.toString());
    console.log("- Quantity:", purchaseAccount.quantity.toString());
    console.log("- Total Price:", purchaseAccount.totalPrice.toNumber() / Math.pow(10, 6), "BAY tokens");
    
    console.log("\n🎉 Decimal issue fixed! Purchase works correctly with 6 decimal BAY tokens.");
    
  } catch (error: any) {
    console.error("\n❌ Purchase failed!");
    console.error("Error:", error.toString());
    
    if (error.logs) {
      console.error("\n📜 Transaction logs:");
      error.logs.forEach((log: string) => {
        console.error(log);
        // Check for decimal error specifically
        if (log.includes("decimals different from the Mint decimals")) {
          console.error("\n⚠️  DECIMAL MISMATCH DETECTED!");
          console.error("The transaction is still using incorrect decimals.");
          console.error("Please verify:");
          console.error("1. Token mint decimals:", mintInfo.decimals);
          console.error("2. Transfer amount calculation");
          console.error("3. Token program consistency");
        }
      });
    }
  }
}

main().catch((err) => {
  console.error("Script error:", err);
  process.exit(1);
});