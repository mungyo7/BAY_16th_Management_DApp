import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";
import { getAccount, getMint } from "@solana/spl-token";

async function main() {
  console.log("=== Check Existing Marketplace ===");
  
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const programId = new PublicKey("9zDrthQpoM5enKgdv62EgERyJ4SrHsfD2kNxz9At4dRE");
  
  console.log("Program ID:", programId.toString());
  
  // Derive marketplace PDA
  const [marketplacePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace")],
    programId
  );
  console.log("Marketplace PDA:", marketplacePda.toString());
  
  // Derive treasury PDA
  const [treasuryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), marketplacePda.toBuffer()],
    programId
  );
  console.log("Treasury PDA:", treasuryPda.toString());
  
  // Check if marketplace account exists
  try {
    const accountInfo = await connection.getAccountInfo(marketplacePda);
    if (accountInfo) {
      console.log("\n✅ Marketplace exists!");
      console.log("Account owner:", accountInfo.owner.toString());
      console.log("Account data length:", accountInfo.data.length);
      console.log("Account lamports:", accountInfo.lamports);
      
      // Try to decode the marketplace data
      // The first 8 bytes are the discriminator, then the data
      const data = accountInfo.data;
      
      // Skip discriminator (8 bytes) and read the admin pubkey (32 bytes)
      const adminPubkey = new PublicKey(data.slice(8, 40));
      console.log("\nMarketplace admin:", adminPubkey.toString());
      
      // Read token mint (32 bytes)
      const tokenMint = new PublicKey(data.slice(40, 72));
      console.log("Token mint:", tokenMint.toString());
      
      // Read treasury (32 bytes)
      const treasury = new PublicKey(data.slice(72, 104));
      console.log("Treasury:", treasury.toString());
      
      // Check the token mint info
      try {
        const mintInfo = await getMint(connection, tokenMint);
        console.log("\nToken mint info:");
        console.log("- Decimals:", mintInfo.decimals);
        console.log("- Supply:", mintInfo.supply.toString());
        console.log("- Mint authority:", mintInfo.mintAuthority?.toString() || "None");
      } catch (e) {
        console.log("Could not fetch mint info:", e);
      }
      
      // Check treasury account
      try {
        const treasuryAccount = await getAccount(connection, treasuryPda);
        console.log("\nTreasury token account:");
        console.log("- Owner:", treasuryAccount.owner.toString());
        console.log("- Mint:", treasuryAccount.mint.toString());
        console.log("- Balance:", treasuryAccount.amount.toString());
      } catch (e) {
        console.log("Treasury token account not found or error:", e);
      }
      
    } else {
      console.log("\n❌ Marketplace does not exist");
    }
  } catch (error) {
    console.error("Error checking marketplace:", error);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});