import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BayAttendanceCheck } from "../target/types/bay_attendance_check";
import { PublicKey } from "@solana/web3.js";

// Statistics script for BAY attendance system
async function main() {
  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BayAttendanceCheck as Program<BayAttendanceCheck>;
  
  // Get command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log("Usage: ts-node stats.ts <command> [options]");
    console.log("\nCommands:");
    console.log("  session-summary <date>       - Get detailed session summary");
    console.log("  member-ranking               - Show member attendance ranking");
    console.log("  all-sessions                 - List all sessions (requires additional implementation)");
    return;
  }

  try {
    switch (command) {
      case "session-summary":
        await getSessionSummary(program, args[1]);
        break;
      case "member-ranking":
        await getMemberRanking(program);
        break;
      case "all-sessions":
        await getAllSessions(program);
        break;
      default:
        console.error("Unknown command:", command);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getSessionSummary(program: Program<BayAttendanceCheck>, dateStr: string) {
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
    
    console.log("\n=== Session Summary ===");
    console.log("Date:", new Date(session.sessionDate.toNumber() * 1000).toDateString());
    console.log("Start Time:", new Date(session.startTime.toNumber() * 1000).toLocaleTimeString());
    console.log("Late Time:", new Date(session.lateTime.toNumber() * 1000).toLocaleTimeString());
    console.log("\n--- Attendance Statistics ---");
    console.log("Total Attendees:", session.totalAttendees);
    console.log("On-time Attendance:", session.totalAttendees - session.totalLate);
    console.log("Late Attendance:", session.totalLate);
    
    if (session.totalAttendees > 0) {
      const onTimeRate = ((session.totalAttendees - session.totalLate) / session.totalAttendees * 100).toFixed(2);
      console.log("On-time Rate:", onTimeRate + "%");
    }
    
    console.log("\n--- Session Info ---");
    console.log("Status:", session.isActive ? "Active" : "Closed");
    console.log("Admin:", session.admin.toString());

    // Calculate session duration
    const duration = (session.lateTime.toNumber() - session.startTime.toNumber()) / 60;
    console.log("Check-in Window:", duration + " minutes");

  } catch (error) {
    console.error("Failed to fetch session data. Session might not exist.");
  }
}

async function getMemberRanking(program: Program<BayAttendanceCheck>) {
  console.log("\n=== Member Attendance Ranking ===");
  console.log("(This feature requires fetching all member accounts)");
  
  try {
    // Fetch all member accounts
    const members = await program.account.member.all();
    
    // Sort by total points (descending)
    members.sort((a, b) => b.account.totalPoints.toNumber() - a.account.totalPoints.toNumber());
    
    console.log("\nTop 10 Members by Points:");
    console.log("Rank | Wallet | Points | Attendance | Late | Absence | Rate");
    console.log("-".repeat(80));
    
    members.slice(0, 10).forEach((member, index) => {
      const acc = member.account;
      const totalSessions = acc.totalAttendance + acc.totalLate + acc.totalAbsence;
      const attendanceRate = totalSessions > 0 
        ? ((acc.totalAttendance + acc.totalLate) / totalSessions * 100).toFixed(1)
        : "N/A";
      
      console.log(
        `${(index + 1).toString().padStart(4)} | ` +
        `${acc.wallet.toString().substring(0, 6)}... | ` +
        `${acc.totalPoints.toString().padStart(6)} | ` +
        `${acc.totalAttendance.toString().padStart(10)} | ` +
        `${acc.totalLate.toString().padStart(4)} | ` +
        `${acc.totalAbsence.toString().padStart(7)} | ` +
        `${attendanceRate.padStart(4)}%`
      );
    });
    
    console.log("\nTotal Members:", members.length);
    
    // Calculate overall statistics
    const totalPoints = members.reduce((sum, m) => sum + m.account.totalPoints.toNumber(), 0);
    const totalAttendance = members.reduce((sum, m) => sum + m.account.totalAttendance, 0);
    const totalLate = members.reduce((sum, m) => sum + m.account.totalLate, 0);
    const totalAbsence = members.reduce((sum, m) => sum + m.account.totalAbsence, 0);
    
    console.log("\n--- Overall Statistics ---");
    console.log("Total Points Distributed:", totalPoints);
    console.log("Total Attendance Records:", totalAttendance);
    console.log("Total Late Records:", totalLate);
    console.log("Total Absence Records:", totalAbsence);
    
  } catch (error) {
    console.error("Failed to fetch member data:", error);
  }
}

async function getAllSessions(program: Program<BayAttendanceCheck>) {
  console.log("\n=== All Sessions ===");
  console.log("(This feature requires additional implementation to track all session dates)");
  console.log("\nIn a production system, you would:");
  console.log("1. Maintain a separate account that stores all session dates");
  console.log("2. Or emit events that can be queried");
  console.log("3. Or use an off-chain database to track sessions");
  
  // For now, we can show how to fetch a specific session if we know the date
  console.log("\nExample: To fetch a session for July 30, 2024:");
  console.log("ts-node stats.ts session-summary 2024-07-30");
}

main().catch(console.error);