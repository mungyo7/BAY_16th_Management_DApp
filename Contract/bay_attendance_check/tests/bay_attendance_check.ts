import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BayAttendanceCheck } from "../target/types/bay_attendance_check";
import { assert } from "chai";

describe("bay_attendance_check", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.BayAttendanceCheck as Program<BayAttendanceCheck>;
  const provider = anchor.getProvider();

  // Test accounts
  let admin: anchor.web3.Keypair;
  let member1: anchor.web3.Keypair;
  let member2: anchor.web3.Keypair;

  // PDAs
  let adminMemberPDA: anchor.web3.PublicKey;
  let member1PDA: anchor.web3.PublicKey;
  let member2PDA: anchor.web3.PublicKey;
  let sessionPDA: anchor.web3.PublicKey;
  let attendanceRecordPDA: anchor.web3.PublicKey;

  // Test data
  const sessionDate = new anchor.BN(Date.now() / 1000); // Current timestamp
  const startTime = new anchor.BN(Date.now() / 1000 + 3600); // 1 hour from now
  const lateTime = new anchor.BN(Date.now() / 1000 + 5400); // 1.5 hours from now

  before(async () => {
    // Generate test keypairs
    admin = anchor.web3.Keypair.generate();
    member1 = anchor.web3.Keypair.generate();
    member2 = anchor.web3.Keypair.generate();

    // Airdrop SOL to test accounts
    const airdropAdmin = await provider.connection.requestAirdrop(
      admin.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropAdmin);

    const airdropMember1 = await provider.connection.requestAirdrop(
      member1.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropMember1);

    const airdropMember2 = await provider.connection.requestAirdrop(
      member2.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropMember2);

    // Derive PDAs
    [adminMemberPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("member"), admin.publicKey.toBuffer()],
      program.programId
    );

    [member1PDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("member"), member1.publicKey.toBuffer()],
      program.programId
    );

    [member2PDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("member"), member2.publicKey.toBuffer()],
      program.programId
    );

    [sessionPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("session"), sessionDate.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
  });

  it("Initialize admin member", async () => {
    await program.methods
      .initializeMember({ admin: {} })
      .accounts({
        authority: admin.publicKey,
        admin: admin.publicKey,
        memberWallet: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    const memberAccount = await program.account.member.fetch(adminMemberPDA);
    assert.equal(memberAccount.wallet.toString(), admin.publicKey.toString());
    assert.deepEqual(memberAccount.role, { admin: {} });
    assert.equal(memberAccount.totalAttendance, 0);
    assert.equal(memberAccount.totalLate, 0);
    assert.equal(memberAccount.totalAbsence, 0);
    assert.equal(memberAccount.totalPoints.toNumber(), 0);
    assert.equal(memberAccount.isActive, true);
  });

  it("Initialize regular member", async () => {
    await program.methods
      .initializeMember({ member: {} })
      .accounts({
        authority: member1.publicKey,
        admin: admin.publicKey,
        memberWallet: member1.publicKey,
      })
      .signers([member1])
      .rpc();

    const memberAccount = await program.account.member.fetch(member1PDA);
    assert.equal(memberAccount.wallet.toString(), member1.publicKey.toString());
    assert.deepEqual(memberAccount.role, { member: {} });
    assert.equal(memberAccount.isActive, true);
  });

  it("Initialize session", async () => {
    await program.methods
      .initializeSession(sessionDate, startTime, lateTime)
      .accounts({
        authority: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    const sessionAccount = await program.account.session.fetch(sessionPDA);
    assert.equal(sessionAccount.admin.toString(), admin.publicKey.toString());
    assert.equal(sessionAccount.sessionDate.toNumber(), sessionDate.toNumber());
    assert.equal(sessionAccount.startTime.toNumber(), startTime.toNumber());
    assert.equal(sessionAccount.lateTime.toNumber(), lateTime.toNumber());
    assert.equal(sessionAccount.totalAttendees, 0);
    assert.equal(sessionAccount.totalLate, 0);
    assert.equal(sessionAccount.isActive, true);
  });

  it("Member checks in on time", async () => {
    // Derive attendance record PDA
    [attendanceRecordPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("attendance"),
        sessionPDA.toBuffer(),
        member1.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Simulate on-time check-in by manipulating clock (in real test, would need mock)
    await program.methods
      .checkIn()
      .accounts({
        memberWallet: member1.publicKey,
        session: sessionPDA,
      })
      .signers([member1])
      .rpc();

    const attendanceRecord = await program.account.attendanceRecord.fetch(
      attendanceRecordPDA
    );
    assert.equal(
      attendanceRecord.member.toString(),
      member1.publicKey.toString()
    );
    assert.equal(attendanceRecord.session.toString(), sessionPDA.toString());
    
    // Check member stats updated
    const memberAccount = await program.account.member.fetch(member1PDA);
    assert.isTrue(memberAccount.totalPoints.toNumber() > 0);
  });

  it("Cannot check in twice", async () => {
    try {
      await program.methods
        .checkIn()
        .accounts({
          memberWallet: member1.publicKey,
          session: sessionPDA,
        })
        .signers([member1])
        .rpc();
      
      assert.fail("Should have failed");
    } catch (err) {
      assert.include(err.toString(), "already in use");
    }
  });

  it("Admin can update session status", async () => {
    await program.methods
      .updateSessionStatus(false)
      .accounts({
        authority: admin.publicKey,
        session: sessionPDA,
      })
      .signers([admin])
      .rpc();

    const sessionAccount = await program.account.session.fetch(sessionPDA);
    assert.equal(sessionAccount.isActive, false);
  });

  it("Get member stats", async () => {
    await program.methods
      .getMemberStats()
      .accounts({
        member: member1PDA,
      })
      .rpc();
    // Check logs for stats output
  });

  it("Get session stats", async () => {
    await program.methods
      .getSessionStats()
      .accounts({
        session: sessionPDA,
      })
      .rpc();
    // Check logs for stats output
  });
});