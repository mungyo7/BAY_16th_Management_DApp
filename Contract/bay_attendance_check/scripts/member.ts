import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BayAttendanceCheck } from "../target/types/bay_attendance_check";
import { PublicKey, Keypair } from "@solana/web3.js";
import * as fs from "fs";

// Member script for BAY attendance system
async function main() {
  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BayAttendanceCheck as Program<BayAttendanceCheck>;
  
  // Get command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log("Usage: ts-node member.ts <command> [options]");
    console.log("\nCommands:");
    console.log("  register <wallet-path>       - Register as a new member");
    console.log("  check-in <wallet-path> <session-date> - Check in to a session");
    console.log("  my-stats <wallet-path>       - View your statistics");
    console.log("  attendance <wallet-path> <session-date> - Check attendance status");
    return;
  }

  try {
    switch (command) {
      case "register":
        await registerMember(program, args[1]);
        break;
      case "check-in":
        await checkIn(program, args[1], args[2]);
        break;
      case "my-stats":
        await getMyStats(program, args[1]);
        break;
      case "attendance":
        await checkAttendance(program, args[1], args[2]);
        break;
      default:
        console.error("Unknown command:", command);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function registerMember(program: Program<BayAttendanceCheck>, walletPath: string) {
  if (!walletPath) {
    console.error("Please provide wallet path");
    return;
  }

  // Load wallet from file
  const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
  const memberKeypair = Keypair.fromSecretKey(new Uint8Array(walletData));

  // Derive member PDA
  const [memberPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("member"), memberKeypair.publicKey.toBuffer()],
    program.programId
  );

  console.log("Registering as member...");
  console.log("Your wallet:", memberKeypair.publicKey.toString());
  console.log("Member PDA:", memberPDA.toString());

  // For regular members, we use a dummy admin account (in production, this would be the actual admin)
  const dummyAdmin = Keypair.generate();

  const tx = await program.methods
    .initializeMember({ member: {} })
    .accounts({
      authority: memberKeypair.publicKey,
      admin: dummyAdmin.publicKey,
      memberWallet: memberKeypair.publicKey,
    })
    .signers([memberKeypair])
    .rpc();

  console.log("Registration successful!");
  console.log("Transaction:", tx);
}

async function checkIn(program: Program<BayAttendanceCheck>, walletPath: string, dateStr: string) {
  if (!walletPath || !dateStr) {
    console.error("Please provide wallet path and session date");
    return;
  }

  // Load wallet from file
  const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
  const memberKeypair = Keypair.fromSecretKey(new Uint8Array(walletData));

  const sessionDate = new Date(dateStr).getTime() / 1000;

  // Derive PDAs
  const [memberPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("member"), memberKeypair.publicKey.toBuffer()],
    program.programId
  );

  const [sessionPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), new anchor.BN(sessionDate).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  const [attendanceRecordPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("attendance"),
      sessionPDA.toBuffer(),
      memberKeypair.publicKey.toBuffer(),
    ],
    program.programId
  );

  console.log("Checking in...");
  console.log("Session date:", new Date(sessionDate * 1000).toDateString());
  console.log("Current time:", new Date().toLocaleString());
  
  // Fetch session data to show time information
  try {
    const session = await program.account.session.fetch(sessionPDA);
    const currentTime = Math.floor(Date.now() / 1000);
    
    console.log("\n=== Session Time Debug Info ===");
    console.log("Current timestamp:", currentTime);
    console.log("Session start timestamp:", session.startTime.toNumber());
    console.log("Session late timestamp:", session.lateTime.toNumber());
    console.log("Session start time:", new Date(session.startTime.toNumber() * 1000).toLocaleString());
    console.log("Session late time:", new Date(session.lateTime.toNumber() * 1000).toLocaleString());
    console.log("Time until start:", (session.startTime.toNumber() - currentTime), "seconds");
    console.log("Time until late:", (session.lateTime.toNumber() - currentTime), "seconds");
    console.log("Session is active:", session.isActive);
    console.log("================================\n");
  } catch (error) {
    console.error("Failed to fetch session data. The session might not exist.");
    return;
  }

  try {
    const tx = await program.methods
      .checkIn()
      .accounts({
        memberWallet: memberKeypair.publicKey,
        session: sessionPDA,
      })
      .signers([memberKeypair])
      .rpc();

    console.log("Check-in successful!");
    console.log("Transaction:", tx);

    // Fetch and display attendance record
    const attendanceRecord = await program.account.attendanceRecord.fetch(attendanceRecordPDA);
    const status = Object.keys(attendanceRecord.status)[0];
    console.log("\nAttendance Status:", status.charAt(0).toUpperCase() + status.slice(1));
    console.log("Points Earned:", attendanceRecord.pointsEarned);
  } catch (error) {
    if (error.toString().includes("already in use")) {
      console.error("You have already checked in for this session!");
    } else if (error.toString().includes("SessionNotActive")) {
      console.error("This session is not active!");
    } else if (error.toString().includes("CheckInTimePassed")) {
      console.error("Check-in time has passed! You cannot check in anymore.");
    } else {
      console.error("Check-in failed:", error);
    }
  }
}

async function getMyStats(program: Program<BayAttendanceCheck>, walletPath: string) {
  if (!walletPath) {
    console.error("Please provide wallet path");
    return;
  }

  // Load wallet from file
  const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
  const memberKeypair = Keypair.fromSecretKey(new Uint8Array(walletData));

  const [memberPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("member"), memberKeypair.publicKey.toBuffer()],
    program.programId
  );

  try {
    const member = await program.account.member.fetch(memberPDA);
    
    console.log("\n=== Your Statistics ===");
    console.log("Wallet:", member.wallet.toString());
    console.log("Role:", Object.keys(member.role)[0]);
    console.log("Total Attendance:", member.totalAttendance);
    console.log("Total Late:", member.totalLate);
    console.log("Total Absence:", member.totalAbsence);
    console.log("Total Points:", member.totalPoints.toString());
    console.log("Status:", member.isActive ? "Active" : "Inactive");

    // Calculate attendance rate
    const totalSessions = member.totalAttendance + member.totalLate + member.totalAbsence;
    if (totalSessions > 0) {
      const attendanceRate = ((member.totalAttendance + member.totalLate) / totalSessions * 100).toFixed(2);
      console.log("\nAttendance Rate:", attendanceRate + "%");
    }
  } catch (error) {
    console.error("Failed to fetch your data. Please make sure you are registered.");
  }
}

async function checkAttendance(program: Program<BayAttendanceCheck>, walletPath: string, dateStr: string) {
  if (!walletPath || !dateStr) {
    console.error("Please provide wallet path and session date");
    return;
  }

  // Load wallet from file
  const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
  const memberKeypair = Keypair.fromSecretKey(new Uint8Array(walletData));

  const sessionDate = new Date(dateStr).getTime() / 1000;

  // Derive PDAs
  const [sessionPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), new anchor.BN(sessionDate).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  const [attendanceRecordPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("attendance"),
      sessionPDA.toBuffer(),
      memberKeypair.publicKey.toBuffer(),
    ],
    program.programId
  );

  try {
    const attendanceRecord = await program.account.attendanceRecord.fetch(attendanceRecordPDA);
    
    console.log("\n=== Attendance Record ===");
    console.log("Session Date:", new Date(sessionDate * 1000).toDateString());
    console.log("Check-in Time:", new Date(attendanceRecord.checkInTime.toNumber() * 1000).toLocaleString());
    console.log("Status:", Object.keys(attendanceRecord.status)[0].charAt(0).toUpperCase() + Object.keys(attendanceRecord.status)[0].slice(1));
    console.log("Points Earned:", attendanceRecord.pointsEarned);
  } catch (error) {
    console.log("No attendance record found for this session.");
    console.log("You have not checked in yet.");
  }
}

main().catch(console.error);