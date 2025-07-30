import * as anchor from "@coral-xyz/anchor";
import { Program, Wallet } from "@coral-xyz/anchor";
import { BayAttendanceCheck } from "../target/types/bay_attendance_check";
import { PublicKey, Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

// Admin script for managing BAY attendance system
async function main() {
  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BayAttendanceCheck as Program<BayAttendanceCheck>;
  
  // Get command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log("Usage: ts-node admin.ts <command> [options]");
    console.log("\nCommands:");
    console.log("  init-admin <wallet-path>     - Initialize an admin member");
    console.log("  init-session <date> <start-time> <late-time> - Create a new session");
    console.log("  close-session <date>         - Close an active session");
    console.log("  reactivate-session <date> <start-time> <late-time> - Reactivate a closed session");
    console.log("  session-stats <date>         - Get session statistics");
    console.log("  member-stats <wallet>        - Get member statistics");
    return;
  }

  try {
    switch (command) {
      case "init-admin":
        await initializeAdmin(program, args[1]);
        break;
      case "init-session":
        await initializeSession(program, args[1], args[2], args[3]);
        break;
      case "close-session":
        await closeSession(program, args[1]);
        break;
      case "reactivate-session":
        await reactivateSession(program, args[1], args[2], args[3]);
        break;
      case "session-stats":
        await getSessionStats(program, args[1]);
        break;
      case "member-stats":
        await getMemberStats(program, args[1]);
        break;
      default:
        console.error("Unknown command:", command);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function initializeAdmin(program: Program<BayAttendanceCheck>, walletPath: string) {
  if (!walletPath) {
    console.error("Please provide wallet path");
    return;
  }

  // Load wallet from file
  const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
  const adminKeypair = Keypair.fromSecretKey(new Uint8Array(walletData));

  // Derive member PDA
  const [memberPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("member"), adminKeypair.publicKey.toBuffer()],
    program.programId
  );

  console.log("Initializing admin member...");
  console.log("Admin wallet:", adminKeypair.publicKey.toString());
  console.log("Member PDA:", memberPDA.toString());

  const tx = await program.methods
    .initializeMember({ admin: {} })
    .accounts({
      authority: adminKeypair.publicKey,
      admin: adminKeypair.publicKey,
      memberWallet: adminKeypair.publicKey,
    })
    .signers([adminKeypair])
    .rpc();

  console.log("Admin initialized successfully!");
  console.log("Transaction:", tx);
}

async function initializeSession(
  program: Program<BayAttendanceCheck>, 
  dateStr: string, 
  startTimeStr: string, 
  lateTimeStr: string
) {
  if (!dateStr || !startTimeStr || !lateTimeStr) {
    console.error("Please provide date, start time, and late time");
    console.error("Example: init-session 2024-07-30 19:30 20:00");
    return;
  }

  // Parse dates
  const sessionDate = new Date(dateStr).getTime() / 1000;
  const startTime = new Date(`${dateStr} ${startTimeStr}`).getTime() / 1000;
  const lateTime = new Date(`${dateStr} ${lateTimeStr}`).getTime() / 1000;

  // Get admin wallet from provider
  const adminWallet = (program.provider as anchor.AnchorProvider).wallet;

  // Derive PDAs
  const [adminMemberPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("member"), adminWallet.publicKey.toBuffer()],
    program.programId
  );

  const [sessionPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), new anchor.BN(sessionDate).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  console.log("Creating session...");
  console.log("Date:", new Date(sessionDate * 1000).toISOString());
  console.log("Start time:", new Date(startTime * 1000).toISOString());
  console.log("Late time:", new Date(lateTime * 1000).toISOString());
  console.log("Session PDA:", sessionPDA.toString());

  const tx = await program.methods
    .initializeSession(
      new anchor.BN(sessionDate),
      new anchor.BN(startTime),
      new anchor.BN(lateTime)
    )
    .accounts({
      authority: adminWallet.publicKey,
    })
    .rpc();

  console.log("Session created successfully!");
  console.log("Transaction:", tx);
}

async function closeSession(program: Program<BayAttendanceCheck>, dateStr: string) {
  if (!dateStr) {
    console.error("Please provide session date");
    return;
  }

  const sessionDate = new Date(dateStr).getTime() / 1000;
  const adminWallet = (program.provider as anchor.AnchorProvider).wallet;

  // Derive PDAs
  const [adminMemberPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("member"), adminWallet.publicKey.toBuffer()],
    program.programId
  );

  const [sessionPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), new anchor.BN(sessionDate).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  console.log("Closing session...");
  console.log("Admin PDA:", adminMemberPDA.toString());
  console.log("Session PDA:", sessionPDA.toString());

  const tx = await program.methods
    .updateSessionStatus(false)
    .accounts({
      authority: adminWallet.publicKey,
      session: sessionPDA,
    })
    .rpc();

  console.log("Session closed successfully!");
  console.log("Transaction:", tx);
}

async function getSessionStats(program: Program<BayAttendanceCheck>, dateStr: string) {
  if (!dateStr) {
    console.error("Please provide session date");
    return;
  }

  const sessionDate = new Date(dateStr).getTime() / 1000;

  const [sessionPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), new anchor.BN(sessionDate).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  try {
    const session = await program.account.session.fetch(sessionPDA);
    
    console.log("\n=== Session Statistics ===");
    console.log("Date:", new Date(session.sessionDate.toNumber() * 1000).toDateString());
    console.log("Start Time:", new Date(session.startTime.toNumber() * 1000).toLocaleTimeString());
    console.log("Late Time:", new Date(session.lateTime.toNumber() * 1000).toLocaleTimeString());
    console.log("Total Attendees:", session.totalAttendees);
    console.log("Total Late:", session.totalLate);
    console.log("Status:", session.isActive ? "Active" : "Closed");
    console.log("Admin:", session.admin.toString());
  } catch (error) {
    console.error("Failed to fetch session data. Session might not exist.");
  }
}

async function getMemberStats(program: Program<BayAttendanceCheck>, walletStr: string) {
  if (!walletStr) {
    console.error("Please provide member wallet address");
    return;
  }

  const memberWallet = new PublicKey(walletStr);

  const [memberPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("member"), memberWallet.toBuffer()],
    program.programId
  );

  try {
    const member = await program.account.member.fetch(memberPDA);
    
    console.log("\n=== Member Statistics ===");
    console.log("Wallet:", member.wallet.toString());
    console.log("Role:", Object.keys(member.role)[0]);
    console.log("Total Attendance:", member.totalAttendance);
    console.log("Total Late:", member.totalLate);
    console.log("Total Absence:", member.totalAbsence);
    console.log("Total Points:", member.totalPoints.toString());
    console.log("Status:", member.isActive ? "Active" : "Inactive");
  } catch (error) {
    console.error("Failed to fetch member data. Member might not be initialized.");
  }
}

async function reactivateSession(
  program: Program<BayAttendanceCheck>,
  dateStr: string,
  startTimeStr: string,
  lateTimeStr: string
) {
  if (!dateStr || !startTimeStr || !lateTimeStr) {
    console.error("Please provide date, new start time, and new late time");
    console.error("Example: reactivate-session 2024-07-28 19:30 20:00");
    return;
  }

  // Parse dates
  const sessionDate = new Date(dateStr).getTime() / 1000;
  const newStartTime = new Date(`${dateStr} ${startTimeStr}`).getTime() / 1000;
  const newLateTime = new Date(`${dateStr} ${lateTimeStr}`).getTime() / 1000;

  // Get admin wallet from provider
  const adminWallet = (program.provider as anchor.AnchorProvider).wallet;

  // Derive PDAs
  const [adminMemberPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("member"), adminWallet.publicKey.toBuffer()],
    program.programId
  );

  const [sessionPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), new anchor.BN(sessionDate).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  console.log("Reactivating session...");
  console.log("Date:", new Date(sessionDate * 1000).toDateString());
  console.log("New start time:", new Date(newStartTime * 1000).toLocaleTimeString());
  console.log("New late time:", new Date(newLateTime * 1000).toLocaleTimeString());
  console.log("Session PDA:", sessionPDA.toString());

  const tx = await program.methods
    .reactivateSession(
      new anchor.BN(newStartTime),
      new anchor.BN(newLateTime)
    )
    .accounts({
      authority: adminWallet.publicKey,
      session: sessionPDA,
    })
    .rpc();

  console.log("Session reactivated successfully!");
  console.log("Transaction:", tx);
}

main().catch(console.error);