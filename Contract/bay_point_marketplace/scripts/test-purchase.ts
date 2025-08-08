import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BayPointMarketplace } from "../target/types/bay_point_marketplace";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import { 
  TOKEN_2022_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { BAY_TOKEN_MINT } from "../tests/constants";

async function main() {
  // Setup connection and provider
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  // Load admin wallet (marketplace owner)
  const adminWalletPath = "./admin_bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u.json";
  const adminKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(adminWalletPath, "utf-8")))
  );
  
  // Load buyer wallet (member2)
  const buyerWalletPath = "./member2-wallet.json";
  const buyerKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(buyerWalletPath, "utf-8")))
  );
  
  const wallet = new anchor.Wallet(buyerKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  
  anchor.setProvider(provider);
  
  // Load the program
  const programId = new PublicKey("32Kb2ew5KzGkUzNdaR1Mq27knK39ijkqKG6ZKUrTZAeq");
  const idl = JSON.parse(
    fs.readFileSync("./target/idl/bay_point_marketplace.json", "utf-8")
  );
  
  const program = new anchor.Program<BayPointMarketplace>(
    idl,
    provider
  );
  
  try {
    console.log("=== Purchase Test ===");
    console.log("Buyer:", buyerKeypair.publicKey.toString());
    console.log("Admin:", adminKeypair.publicKey.toString());
    
    // Derive marketplace PDA (using admin's public key in seed)
    const [marketplace] = PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace"), adminKeypair.publicKey.toBuffer()],
      program.programId
    );
    
    console.log("Marketplace:", marketplace.toString());
    
    // Get marketplace state
    const marketplaceState = await program.account.marketplaceState.fetch(marketplace);
    console.log("Product Count:", marketplaceState.productCount.toString());
    
    // Derive product PDA (using product ID 0)
    const productId = 0;
    const [product] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        marketplace.toBuffer(),
        new anchor.BN(productId).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    
    console.log("Product PDA:", product.toString());
    
    // Get product state
    const productState = await program.account.product.fetch(product);
    console.log("\nProduct to purchase:");
    console.log("  Name:", productState.name);
    console.log("  Price:", productState.price.toString(), "BAY points (smallest units)");
    console.log("  Stock:", productState.stock.toString());
    
    // Get buyer's token account
    const buyerTokenAccount = getAssociatedTokenAddressSync(
      BAY_TOKEN_MINT,
      buyerKeypair.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    console.log("\nBuyer token account:", buyerTokenAccount.toString());
    
    // Check buyer's balance
    try {
      const buyerAccountInfo = await getAccount(connection, buyerTokenAccount, "confirmed", TOKEN_2022_PROGRAM_ID);
      console.log("Buyer balance:", buyerAccountInfo.amount.toString(), "BAY points");
    } catch (error) {
      console.log("Buyer token account doesn't exist yet");
    }
    
    // Derive treasury PDA
    const [treasury] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), marketplace.toBuffer()],
      program.programId
    );
    
    console.log("Treasury:", treasury.toString());
    
    // Derive purchase PDA
    const [purchase] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("purchase"),
        buyerKeypair.publicKey.toBuffer(),
        new anchor.BN(0).toArrayLike(Buffer, "le", 8) // First purchase for this buyer
      ],
      program.programId
    );
    
    console.log("Purchase PDA:", purchase.toString());
    
    // Execute purchase
    const quantity = 1;
    console.log("\n🛒 Purchasing", quantity, "item(s)...");
    
    const tx = await program.methods
      .purchaseProduct(
        new anchor.BN(productId),
        new anchor.BN(quantity)
      )
      .accountsStrict({
        marketplace,
        tokenMint: BAY_TOKEN_MINT,
        product,
        purchase,
        buyerTokenAccount,
        treasury,
        buyer: buyerKeypair.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log("✅ Purchase successful!");
    console.log("Transaction signature:", tx);
    
    // Fetch and display purchase record
    const purchaseRecord = await program.account.purchase.fetch(purchase);
    console.log("\n📝 Purchase Record:");
    console.log("  Product ID:", purchaseRecord.productId.toString());
    console.log("  Buyer:", purchaseRecord.buyer.toString());
    console.log("  Quantity:", purchaseRecord.quantity.toString());
    console.log("  Total Price:", purchaseRecord.totalPrice.toString());
    console.log("  Timestamp:", new Date(purchaseRecord.timestamp.toNumber() * 1000).toLocaleString());
    
    // Check updated product state
    const updatedProductState = await program.account.product.fetch(product);
    console.log("\n📦 Updated Product State:");
    console.log("  Remaining Stock:", updatedProductState.stock.toString());
    console.log("  Sold Count:", updatedProductState.soldCount.toString());
    
    // Check treasury balance
    const treasuryAccount = await getAccount(connection, treasury, "confirmed", TOKEN_2022_PROGRAM_ID);
    console.log("\n💰 Treasury Balance:", treasuryAccount.amount.toString(), "BAY points");
    
    // Check buyer's remaining balance
    const buyerAccountInfo = await getAccount(connection, buyerTokenAccount, "confirmed", TOKEN_2022_PROGRAM_ID);
    console.log("🔸 Buyer remaining balance:", buyerAccountInfo.amount.toString(), "BAY points");
    
  } catch (error: any) {
    console.error("\n❌ Error during purchase:", error);
    if (error.logs) {
      console.error("Program logs:", error.logs);
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