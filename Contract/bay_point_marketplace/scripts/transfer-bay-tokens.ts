import * as anchor from "@coral-xyz/anchor";
import { 
  getOrCreateAssociatedTokenAccount,
  transfer,
  getAccount,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import { BAY_TOKEN_MINT, TOKEN_DECIMALS } from "../tests/constants";

// This script helps transfer BAY tokens from your wallet to test accounts

async function main() {
  // Setup connection
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  // Load your wallet (the one that has BAY tokens)
  // Update this path to your actual wallet with BAY tokens
  const walletPath = "./admin_bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u.json";
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );
  
  // Recipient address (you can change this to any address you want to send tokens to)
  // For testing, you might want to generate a test buyer keypair
  const recipientPubkey = new PublicKey("YOUR_RECIPIENT_ADDRESS_HERE");
  
  // Amount to transfer (in tokens, not lamports)
  const amount = 1000; // Transfer 1000 BAY tokens
  
  try {
    // Get or create associated token accounts
    const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      walletKeypair,
      BAY_TOKEN_MINT,
      walletKeypair.publicKey
    );
    
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      walletKeypair, // Payer for creating the account if needed
      BAY_TOKEN_MINT,
      recipientPubkey
    );
    
    // Check sender balance
    const senderBalance = await getAccount(connection, senderTokenAccount.address);
    console.log("Sender BAY balance:", Number(senderBalance.amount) / Math.pow(10, TOKEN_DECIMALS));
    
    // Transfer tokens
    const signature = await transfer(
      connection,
      walletKeypair,
      senderTokenAccount.address,
      recipientTokenAccount.address,
      walletKeypair.publicKey,
      amount * Math.pow(10, TOKEN_DECIMALS) // Convert to lamports
    );
    
    console.log("Transfer successful!");
    console.log("Transaction signature:", signature);
    console.log(`Transferred ${amount} BAY tokens to ${recipientPubkey.toString()}`);
    
    // Check recipient balance
    const recipientBalance = await getAccount(connection, recipientTokenAccount.address);
    console.log("Recipient new BAY balance:", Number(recipientBalance.amount) / Math.pow(10, TOKEN_DECIMALS));
    
  } catch (error) {
    console.error("Error transferring tokens:", error);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);