import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BayPointMarketplace } from "../target/types/bay_point_marketplace";
import { PublicKey } from "@solana/web3.js";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log("🛠️  BAY Point Marketplace Admin Panel");
  console.log("=====================================\n");
  
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.BayPointMarketplace as Program<BayPointMarketplace>;
  
  const [marketplace] = PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace")],
    program.programId
  );
  
  try {
    const marketplaceAccount = await program.account.marketplaceState.fetch(marketplace);
    
    if (marketplaceAccount.admin.toString() !== provider.wallet.publicKey.toString()) {
      console.error("❌ You are not the admin of this marketplace!");
      console.log("Admin:", marketplaceAccount.admin.toString());
      console.log("Your wallet:", provider.wallet.publicKey.toString());
      process.exit(1);
    }
    
    console.log("✅ Admin verified");
    console.log("Current product count:", marketplaceAccount.productCount.toString());
    console.log("Total sales:", marketplaceAccount.totalSales.toString(), "points\n");
    
  } catch (error) {
    console.error("❌ Marketplace not initialized. Please run 'npm run initialize' first");
    process.exit(1);
  }
  
  while (true) {
    console.log("\n📋 Admin Actions:");
    console.log("1. Add Product");
    console.log("2. Update Product");
    console.log("3. Deactivate Product");
    console.log("4. View All Products");
    console.log("5. Exit");
    
    const choice = await question("\nSelect an action (1-5): ");
    
    switch (choice) {
      case "1":
        await addProduct(program, marketplace);
        break;
      case "2":
        await updateProduct(program, marketplace);
        break;
      case "3":
        await deactivateProduct(program, marketplace);
        break;
      case "4":
        await viewProducts(program, marketplace);
        break;
      case "5":
        console.log("👋 Goodbye!");
        rl.close();
        process.exit(0);
      default:
        console.log("Invalid choice. Please try again.");
    }
  }
}

async function addProduct(
  program: Program<BayPointMarketplace>,
  marketplace: PublicKey
) {
  console.log("\n➕ Add New Product");
  console.log("==================");
  
  const name = await question("Product name: ");
  const description = await question("Product description: ");
  const priceStr = await question("Price (in points): ");
  const stockStr = await question("Initial stock: ");
  
  const price = new anchor.BN(priceStr);
  const stock = new anchor.BN(stockStr);
  
  const marketplaceAccount = await program.account.marketplaceState.fetch(marketplace);
  const productId = marketplaceAccount.productCount;
  
  const [product] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("product"),
      marketplace.toBuffer(),
      productId.toArrayLike(Buffer, "le", 8)
    ],
    program.programId
  );
  
  try {
    const tx = await program.methods
      .addProduct(name, description, price, stock)
      .accounts({
        marketplace,
        product,
        admin: program.provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log("\n✅ Product added successfully!");
    console.log("Product ID:", productId.toString());
    console.log("Product PDA:", product.toString());
    console.log("Transaction:", tx);
    
  } catch (error) {
    console.error("❌ Failed to add product:", error);
  }
}

async function updateProduct(
  program: Program<BayPointMarketplace>,
  marketplace: PublicKey
) {
  console.log("\n✏️  Update Product");
  console.log("=================");
  
  const productIdStr = await question("Product ID to update: ");
  const productId = new anchor.BN(productIdStr);
  
  const [product] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("product"),
      marketplace.toBuffer(),
      productId.toArrayLike(Buffer, "le", 8)
    ],
    program.programId
  );
  
  try {
    const productAccount = await program.account.product.fetch(product);
    console.log("\nCurrent product info:");
    console.log("Name:", productAccount.name);
    console.log("Price:", productAccount.price.toString(), "points");
    console.log("Stock:", productAccount.stock.toString());
    console.log("Active:", productAccount.isActive);
    
    const newPriceStr = await question("\nNew price (leave empty to keep current): ");
    const newStockStr = await question("New stock (leave empty to keep current): ");
    
    const newPrice = newPriceStr ? new anchor.BN(newPriceStr) : null;
    const newStock = newStockStr ? new anchor.BN(newStockStr) : null;
    
    const tx = await program.methods
      .updateProduct(newPrice, newStock)
      .accounts({
        marketplace,
        product,
        admin: program.provider.publicKey,
      })
      .rpc();
    
    console.log("\n✅ Product updated successfully!");
    console.log("Transaction:", tx);
    
  } catch (error) {
    console.error("❌ Failed to update product:", error);
  }
}

async function deactivateProduct(
  program: Program<BayPointMarketplace>,
  marketplace: PublicKey
) {
  console.log("\n🚫 Deactivate Product");
  console.log("====================");
  
  const productIdStr = await question("Product ID to deactivate: ");
  const productId = new anchor.BN(productIdStr);
  
  const [product] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("product"),
      marketplace.toBuffer(),
      productId.toArrayLike(Buffer, "le", 8)
    ],
    program.programId
  );
  
  try {
    const productAccount = await program.account.product.fetch(product);
    console.log("\nProduct to deactivate:");
    console.log("Name:", productAccount.name);
    console.log("Current status:", productAccount.isActive ? "Active" : "Inactive");
    
    const confirm = await question("\nAre you sure? (yes/no): ");
    
    if (confirm.toLowerCase() === "yes") {
      const tx = await program.methods
        .deactivateProduct()
        .accounts({
          marketplace,
          product,
          admin: program.provider.publicKey,
        })
        .rpc();
      
      console.log("\n✅ Product deactivated successfully!");
      console.log("Transaction:", tx);
    } else {
      console.log("❌ Deactivation cancelled");
    }
    
  } catch (error) {
    console.error("❌ Failed to deactivate product:", error);
  }
}

async function viewProducts(
  program: Program<BayPointMarketplace>,
  marketplace: PublicKey
) {
  console.log("\n📦 All Products");
  console.log("===============");
  
  const marketplaceAccount = await program.account.marketplaceState.fetch(marketplace);
  const productCount = marketplaceAccount.productCount.toNumber();
  
  if (productCount === 0) {
    console.log("No products found.");
    return;
  }
  
  for (let i = 0; i < productCount; i++) {
    const [product] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        marketplace.toBuffer(),
        new anchor.BN(i).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    
    try {
      const productAccount = await program.account.product.fetch(product);
      console.log(`\n🏷️  Product #${i}`);
      console.log("├─ Name:", productAccount.name);
      console.log("├─ Description:", productAccount.description);
      console.log("├─ Price:", productAccount.price.toString(), "points");
      console.log("├─ Stock:", productAccount.stock.toString());
      console.log("├─ Sold:", productAccount.soldCount.toString());
      console.log("└─ Status:", productAccount.isActive ? "✅ Active" : "❌ Inactive");
    } catch (error) {
      console.log(`\n❌ Product #${i}: Not found or error reading`);
    }
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});