import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { 
  createMint,
  mintTo,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import * as fs from "fs";

async function main() {
  // Setup connection
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  // Load admin wallet
  const walletPath = "./admin_bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u.json";
  const adminKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );
  
  console.log("Creating BAY token with admin:", adminKeypair.publicKey.toString());
  
  try {
    // Create a new mint
    const mint = await createMint(
      connection,
      adminKeypair,
      adminKeypair.publicKey, // mint authority
      adminKeypair.publicKey, // freeze authority
      6, // decimals (6 for BAY token)
      undefined,
      { commitment: "confirmed" },
      TOKEN_PROGRAM_ID
    );
    
    console.log("✅ BAY Token created!");
    console.log("Token Mint Address:", mint.toString());
    
    // Create or get token account for admin
    const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      adminKeypair,
      mint,
      adminKeypair.publicKey
    );
    
    console.log("Admin Token Account:", adminTokenAccount.address.toString());
    
    // Mint initial supply to admin (e.g., 1,000,000 BAY tokens)
    const initialSupply = 1_000_000 * 10 ** 6; // 1M tokens with 6 decimals
    
    await mintTo(
      connection,
      adminKeypair,
      mint,
      adminTokenAccount.address,
      adminKeypair,
      initialSupply
    );
    
    console.log("✅ Minted", initialSupply / 10 ** 6, "BAY tokens to admin");
    
    // Update the constants file with the new mint address
    const constantsContent = `import { PublicKey } from "@solana/web3.js";

// BAY token mint address (created on devnet)
export const BAY_TOKEN_MINT = new PublicKey("${mint.toString()}");

// Token decimals
export const TOKEN_DECIMALS = 6;
`;
    
    fs.writeFileSync("./tests/constants.ts", constantsContent);
    console.log("✅ Updated constants.ts with new token mint address");
    
    console.log("\n🎉 BAY Token setup complete!");
    console.log("You can now run the marketplace initialization script.");
    
  } catch (error) {
    console.error("Error creating BAY token:", error);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);