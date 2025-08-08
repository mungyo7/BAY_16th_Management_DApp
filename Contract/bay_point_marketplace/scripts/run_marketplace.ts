import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BayPointMarketplace } from "../target/types/bay_point_marketplace";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  createMint, 
  createAccount,
  mintTo,
  getAccount
} from "@solana/spl-token";
import fs from "fs";

async function main() {
  console.log("=== BAY Point Marketplace Test ===");
  
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
  
  let tokenMint: PublicKey;
  let adminTokenAccount: PublicKey;
  let buyerTokenAccount: PublicKey;
  let marketplacePda: PublicKey;
  let treasuryPda: PublicKey;
  let marketplaceBump: number;
  let treasuryBump: number;

  console.log("\n📍 Addresses:");
  console.log("Admin:", adminKeypair.publicKey.toString());
  console.log("Buyer:", buyerKeypair.publicKey.toString());
  console.log("Program ID:", program.programId.toString());

  // Setup phase
  console.log("\n🔧 Setup Phase");
  console.log("Airdropping SOL to buyer...");
  const airdropSig = await provider.connection.requestAirdrop(
    buyerKeypair.publicKey,
    2 * anchor.web3.LAMPORTS_PER_SOL
  );
  await provider.connection.confirmTransaction(airdropSig);
  console.log("✅ Airdrop completed!");

  // Create BAY Point token mint
  console.log("\n📦 Creating BAY Point token mint...");
  tokenMint = await createMint(
    provider.connection,
    adminKeypair,
    adminKeypair.publicKey,
    null,
    6 // 6 decimals for BAY token
  );
  console.log("Token mint:", tokenMint.toString());

  // Create token accounts
  console.log("\n💳 Creating token accounts...");
  adminTokenAccount = await createAccount(
    provider.connection,
    adminKeypair,
    tokenMint,
    adminKeypair.publicKey
  );
  console.log("Admin token account:", adminTokenAccount.toString());

  buyerTokenAccount = await createAccount(
    provider.connection,
    buyerKeypair,
    tokenMint,
    buyerKeypair.publicKey
  );
  console.log("Buyer token account:", buyerTokenAccount.toString());

  // Mint tokens
  console.log("\n💰 Minting tokens...");
  await mintTo(
    provider.connection,
    adminKeypair,
    tokenMint,
    adminTokenAccount,
    adminKeypair,
    10000 * 10 ** 6 // 10,000 tokens (6 decimals)
  );
  console.log("✅ Minted 10,000 tokens to admin");

  await mintTo(
    provider.connection,
    adminKeypair,
    tokenMint,
    buyerTokenAccount,
    adminKeypair,
    5000 * 10 ** 6 // 5,000 tokens (6 decimals)
  );
  console.log("✅ Minted 5,000 tokens to buyer");

  // Derive PDAs
  [marketplacePda, marketplaceBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace"), adminKeypair.publicKey.toBuffer()],
    program.programId
  );
  console.log("\n🏪 Marketplace PDA:", marketplacePda.toString());

  [treasuryPda, treasuryBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), marketplacePda.toBuffer()],
    program.programId
  );
  console.log("💎 Treasury PDA:", treasuryPda.toString());

  // 1. Initialize marketplace
  console.log("\n=== 1. Initialize Marketplace ===");
  try {
    const tx = await program.methods
      .initializeMarketplace()
      .accountsStrict({
        marketplace: marketplacePda,
        tokenMint: tokenMint,
        treasury: treasuryPda,
        admin: adminKeypair.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([adminKeypair])
      .rpc();

    console.log("✅ Transaction:", tx);
    
    const marketplaceAccount = await program.account.marketplaceState.fetch(marketplacePda);
    console.log("\n📊 Marketplace State:");
    console.log("- Admin:", marketplaceAccount.admin.toString());
    console.log("- Token Mint:", marketplaceAccount.tokenMint.toString());
    console.log("- Treasury:", marketplaceAccount.treasury.toString());
    console.log("- Product Count:", marketplaceAccount.productCount.toString());
    console.log("- Total Sales:", marketplaceAccount.totalSales.toString());
    console.log("- Is Initialized:", marketplaceAccount.isInitialized);
  } catch (error: any) {
    if (error.toString().includes("already been initialized")) {
      console.log("⚠️  Marketplace already initialized, continuing...");
    } else {
      throw error;
    }
  }

  // 2. Add first product
  console.log("\n=== 2. Add Product: NFT Artwork ===");
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
        "NFT Artwork #1",
        "Beautiful digital art piece from BAY collection",
        new anchor.BN(100 * 10 ** 6), // 100 tokens (6 decimals)
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

    console.log("✅ Transaction:", tx);
    
    const productAccount = await program.account.product.fetch(productPda);
    console.log("\n📦 Product State:");
    console.log("- ID:", productAccount.id.toString());
    console.log("- Name:", productAccount.name);
    console.log("- Description:", productAccount.description);
    console.log("- Price:", (productAccount.price.toNumber() / 10 ** 6), "tokens");
    console.log("- Stock:", productAccount.stock.toString());
    console.log("- Is Active:", productAccount.isActive);
  } catch (error) {
    console.error("❌ Error adding product:", error);
  }

  // 3. Update product
  console.log("\n=== 3. Update Product Price & Stock ===");
  try {
    const tx = await program.methods
      .updateProduct(
        new anchor.BN(80 * 10 ** 6), // New price: 80 tokens (6 decimals)
        new anchor.BN(15) // New stock: 15
      )
      .accountsStrict({
        marketplace: marketplacePda,
        product: productPda,
        admin: adminKeypair.publicKey,
      })
      .signers([adminKeypair])
      .rpc();

    console.log("✅ Transaction:", tx);
    
    const productAccount = await program.account.product.fetch(productPda);
    console.log("\n📝 Updated Product:");
    console.log("- New Price:", (productAccount.price.toNumber() / 10 ** 6), "tokens");
    console.log("- New Stock:", productAccount.stock.toString());
  } catch (error) {
    console.error("❌ Error updating product:", error);
  }

  // 4. Purchase product
  console.log("\n=== 4. Purchase Product ===");
  const quantity = 2;
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
    const buyerBalanceBefore = await getAccount(provider.connection, buyerTokenAccount);
    console.log("💰 Buyer balance before:", (Number(buyerBalanceBefore.amount) / 10 ** 6), "tokens");

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
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyerKeypair])
      .rpc();

    console.log("✅ Transaction:", tx);
    
    const buyerBalanceAfter = await getAccount(provider.connection, buyerTokenAccount);
    console.log("💰 Buyer balance after:", (Number(buyerBalanceAfter.amount) / 10 ** 6), "tokens");
    
    const treasuryBalance = await getAccount(provider.connection, treasuryPda);
    console.log("💎 Treasury balance:", (Number(treasuryBalance.amount) / 10 ** 6), "tokens");
    
    const purchaseAccount = await program.account.purchase.fetch(purchasePda);
    console.log("\n🧾 Purchase Record:");
    console.log("- Product ID:", purchaseAccount.productId.toString());
    console.log("- Buyer:", purchaseAccount.buyer.toString());
    console.log("- Quantity:", purchaseAccount.quantity.toString());
    console.log("- Total Price:", (purchaseAccount.totalPrice.toNumber() / 10 ** 6), "tokens");
    
    const productAccount = await program.account.product.fetch(productPda);
    console.log("\n📦 Product after purchase:");
    console.log("- Remaining Stock:", productAccount.stock.toString());
    console.log("- Sold Count:", productAccount.soldCount.toString());
  } catch (error) {
    console.error("❌ Error purchasing product:", error);
  }

  // 5. Add second product
  console.log("\n=== 5. Add Second Product: Limited Badge ===");
  const marketplaceAccount = await program.account.marketplaceState.fetch(marketplacePda);
  const productId2 = marketplaceAccount.productCount.toNumber();
  
  const [productPda2] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("product"),
      marketplacePda.toBuffer(),
      new anchor.BN(productId2).toArrayLike(Buffer, "le", 8)
    ],
    program.programId
  );

  try {
    const tx = await program.methods
      .addProduct(
        "Limited Edition Badge",
        "Exclusive BAY community badge for early supporters",
        new anchor.BN(500 * 10 ** 6), // 500 tokens (6 decimals)
        new anchor.BN(5) // Only 5 available
      )
      .accountsStrict({
        marketplace: marketplacePda,
        product: productPda2,
        admin: adminKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([adminKeypair])
      .rpc();

    console.log("✅ Transaction:", tx);
    
    const productAccount = await program.account.product.fetch(productPda2);
    console.log("\n🎖️ Second Product:");
    console.log("- ID:", productAccount.id.toString());
    console.log("- Name:", productAccount.name);
    console.log("- Description:", productAccount.description);
    console.log("- Price:", (productAccount.price.toNumber() / 10 ** 6), "tokens");
    console.log("- Stock:", productAccount.stock.toString());
  } catch (error) {
    console.error("❌ Error adding second product:", error);
  }

  // 6. Deactivate first product
  console.log("\n=== 6. Deactivate First Product ===");
  try {
    const tx = await program.methods
      .deactivateProduct()
      .accountsStrict({
        marketplace: marketplacePda,
        product: productPda,
        admin: adminKeypair.publicKey,
      })
      .signers([adminKeypair])
      .rpc();

    console.log("✅ Transaction:", tx);
    
    const productAccount = await program.account.product.fetch(productPda);
    console.log("\n🚫 Deactivated Product:");
    console.log("- Name:", productAccount.name);
    console.log("- Is Active:", productAccount.isActive);
  } catch (error) {
    console.error("❌ Error deactivating product:", error);
  }

  // Final state
  console.log("\n=== 📊 Final Marketplace State ===");
  const finalMarketplace = await program.account.marketplaceState.fetch(marketplacePda);
  console.log("- Total Products:", finalMarketplace.productCount.toString());
  console.log("- Total Sales:", (finalMarketplace.totalSales.toNumber() / 10 ** 6), "tokens");
  
  const treasuryBalance = await getAccount(provider.connection, treasuryPda);
  console.log("- Treasury Balance:", (Number(treasuryBalance.amount) / 10 ** 6), "tokens");
  
  console.log("\n✨ All tests completed successfully!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});