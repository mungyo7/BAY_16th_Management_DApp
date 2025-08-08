import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BayPointMarketplace } from "../target/types/bay_point_marketplace";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";

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
  const programId = new PublicKey("32Kb2ew5KzGkUzNdaR1Mq27knK39ijkqKG6ZKUrTZAeq");
  const idl = JSON.parse(
    fs.readFileSync("./target/idl/bay_point_marketplace.json", "utf-8")
  );
  
  const program = new anchor.Program<BayPointMarketplace>(
    idl,
    provider
  );
  
  try {
    // Derive marketplace PDA with admin's public key in seed
    const [marketplace] = PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace"), adminKeypair.publicKey.toBuffer()],
      program.programId
    );
    
    // Get current product count
    const marketplaceState = await program.account.marketplaceState.fetch(marketplace);
    const productId = marketplaceState.productCount.toNumber();
    
    // Derive product PDA
    const [product] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        marketplace.toBuffer(),
        new anchor.BN(productId).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    
    console.log("Adding product #" + productId);
    console.log("  Marketplace:", marketplace.toString());
    console.log("  Product PDA:", product.toString());
    
    // Add product
    const tx = await program.methods
      .addProduct(
        "NFT Artwork #" + (productId + 1),
        "Beautiful digital art piece from BAY collection",
        new anchor.BN(100_000_000_000), // 100 BAY tokens (9 decimals)
        new anchor.BN(10) // 10 in stock
      )
      .accountsStrict({
        marketplace,
        product,
        admin: adminKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log("✅ Product added successfully!");
    console.log("Transaction signature:", tx);
    
    // Fetch and display product state
    const productState = await program.account.product.fetch(product);
    console.log("\nProduct State:");
    console.log("  ID:", productState.id.toString());
    console.log("  Name:", productState.name);
    console.log("  Description:", productState.description);
    console.log("  Price:", productState.price.toString(), "(in smallest units)");
    console.log("  Stock:", productState.stock.toString());
    console.log("  Is Active:", productState.isActive);
    console.log("  Seller:", productState.seller.toString());
    
  } catch (error) {
    console.error("Error adding product:", error);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);