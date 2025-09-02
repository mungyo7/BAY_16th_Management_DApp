import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BayPointMarketplace } from "../target/types/bay_point_marketplace";
import { 
  getOrCreateAssociatedTokenAccount,
  getAccount,
  transfer,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { assert } from "chai";
import { BAY_TOKEN_MINT } from "./constants";

describe("bay_point_marketplace", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BayPointMarketplace as Program<BayPointMarketplace>;
  
  let marketplace: anchor.web3.PublicKey;
  let treasury: anchor.web3.PublicKey;
  const tokenMint = BAY_TOKEN_MINT; // Use existing BAY token
  let adminTokenAccount: anchor.web3.PublicKey;
  let buyerTokenAccount: anchor.web3.PublicKey;
  
  const admin = anchor.web3.Keypair.generate();
  const buyer = anchor.web3.Keypair.generate();
  
  const INITIAL_BALANCE = 1000000;

  before(async () => {
    // Airdrop SOL for transaction fees
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        admin.publicKey,
        10 * anchor.web3.LAMPORTS_PER_SOL
      )
    );
    
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        buyer.publicKey,
        10 * anchor.web3.LAMPORTS_PER_SOL
      )
    );
    
    // Create or get associated token accounts for the existing BAY token
    adminTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      admin,
      tokenMint,
      admin.publicKey
    ).then(acc => acc.address);
    
    buyerTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      buyer,
      tokenMint,
      buyer.publicKey
    ).then(acc => acc.address);
    
    // Note: For testing, you'll need to ensure the buyer has some BAY tokens
    // Either transfer from an existing wallet or request from admin
    // If you have tokens in your wallet, you can transfer them to the buyer here
    console.log("Admin token account:", adminTokenAccount.toString());
    console.log("Buyer token account:", buyerTokenAccount.toString());
    console.log("Using BAY token mint:", tokenMint.toString());
    
    // Check balances
    const adminBalance = await getAccount(provider.connection, adminTokenAccount);
    const buyerBalance = await getAccount(provider.connection, buyerTokenAccount);
    console.log("Admin BAY balance:", adminBalance.amount.toString());
    console.log("Buyer BAY balance:", buyerBalance.amount.toString());
  });

  it("Initializes the marketplace", async () => {
    [marketplace] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace")],
      program.programId
    );
    
    [treasury] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), marketplace.toBuffer()],
      program.programId
    );
    
    await program.methods
      .initializeMarketplace()
      .accountsStrict({
        marketplace,
        tokenMint,
        treasury,
        admin: admin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([admin])
      .rpc();
    
    const marketplaceAccount = await program.account.marketplaceState.fetch(marketplace);
    assert.equal(marketplaceAccount.admin.toString(), admin.publicKey.toString());
    assert.equal(marketplaceAccount.tokenMint.toString(), tokenMint.toString());
    assert.equal(marketplaceAccount.productCount.toString(), "0");
    assert.equal(marketplaceAccount.isInitialized, true);
  });

  it("Adds a product", async () => {
    const productId = 0;
    const [product] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        marketplace.toBuffer(),
        new anchor.BN(productId).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    
    const productName = "BAY Hoodie";
    const productDescription = "Official BAY blockchain club hoodie";
    const productPrice = new anchor.BN(50000);
    const productStock = new anchor.BN(100);
    
    await program.methods
      .addProduct(productName, productDescription, productPrice, productStock)
      .accountsStrict({
        marketplace,
        product,
        admin: admin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin])
      .rpc();
    
    const productAccount = await program.account.product.fetch(product);
    assert.equal(productAccount.name, productName);
    assert.equal(productAccount.description, productDescription);
    assert.equal(productAccount.price.toString(), productPrice.toString());
    assert.equal(productAccount.stock.toString(), productStock.toString());
    assert.equal(productAccount.isActive, true);
    
    const marketplaceAccount = await program.account.marketplaceState.fetch(marketplace);
    assert.equal(marketplaceAccount.productCount.toString(), "1");
  });

  it("Updates a product", async () => {
    const productId = 0;
    const [product] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        marketplace.toBuffer(),
        new anchor.BN(productId).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    
    const newPrice = new anchor.BN(45000);
    const newStock = new anchor.BN(150);
    
    await program.methods
      .updateProduct(newPrice, newStock)
      .accountsStrict({
        marketplace,
        product,
        admin: admin.publicKey,
      })
      .signers([admin])
      .rpc();
    
    const productAccount = await program.account.product.fetch(product);
    assert.equal(productAccount.price.toString(), newPrice.toString());
    assert.equal(productAccount.stock.toString(), newStock.toString());
  });

  it("Purchases a product", async () => {
    const productId = 0;
    const [product] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        marketplace.toBuffer(),
        new anchor.BN(productId).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    
    const marketplaceAccountBefore = await program.account.marketplaceState.fetch(marketplace);
    const purchaseId = marketplaceAccountBefore.totalSales;
    
    const [purchase] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("purchase"),
        buyer.publicKey.toBuffer(),
        purchaseId.toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    
    const quantity = new anchor.BN(2);
    
    const productAccountBefore = await program.account.product.fetch(product);
    const expectedTotalPrice = productAccountBefore.price.mul(quantity);
    
    const buyerBalanceBefore = await getAccount(provider.connection, buyerTokenAccount);
    
    await program.methods
      .purchaseProduct(new anchor.BN(productId), quantity)
      .accountsStrict({
        marketplace,
        tokenMint,
        product,
        purchase,
        buyerTokenAccount,
        treasury,
        buyer: buyer.publicKey,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();
    
    const purchaseAccount = await program.account.purchase.fetch(purchase);
    assert.equal(purchaseAccount.productId.toString(), productId.toString());
    assert.equal(purchaseAccount.buyer.toString(), buyer.publicKey.toString());
    assert.equal(purchaseAccount.quantity.toString(), quantity.toString());
    assert.equal(purchaseAccount.totalPrice.toString(), expectedTotalPrice.toString());
    
    const productAccountAfter = await program.account.product.fetch(product);
    assert.equal(
      productAccountAfter.stock.toString(),
      productAccountBefore.stock.sub(quantity).toString()
    );
    assert.equal(
      productAccountAfter.soldCount.toString(),
      quantity.toString()
    );
    
    const buyerBalanceAfter = await getAccount(provider.connection, buyerTokenAccount);
    assert.equal(
      buyerBalanceAfter.amount.toString(),
      (BigInt(buyerBalanceBefore.amount.toString()) - BigInt(expectedTotalPrice.toString())).toString()
    );
    
    const treasuryBalance = await getAccount(provider.connection, treasury);
    assert.equal(treasuryBalance.amount.toString(), expectedTotalPrice.toString());
  });

  it("Deactivates a product", async () => {
    const productId = 0;
    const [product] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        marketplace.toBuffer(),
        new anchor.BN(productId).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    
    await program.methods
      .deactivateProduct()
      .accountsStrict({
        marketplace,
        product,
        admin: admin.publicKey,
      })
      .signers([admin])
      .rpc();
    
    const productAccount = await program.account.product.fetch(product);
    assert.equal(productAccount.isActive, false);
  });

  it("Fails to purchase a deactivated product", async () => {
    const productId = 0;
    const [product] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        marketplace.toBuffer(),
        new anchor.BN(productId).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    
    const marketplaceAccount = await program.account.marketplaceState.fetch(marketplace);
    const purchaseId = marketplaceAccount.totalSales;
    
    const [purchase] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("purchase"),
        buyer.publicKey.toBuffer(),
        purchaseId.toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    
    try {
      await program.methods
        .purchaseProduct(new anchor.BN(productId), new anchor.BN(1))
        .accountsStrict({
          marketplace,
          tokenMint,
          product,
          purchase,
          buyerTokenAccount,
          treasury,
          buyer: buyer.publicKey,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();
      
      assert.fail("Should have failed to purchase deactivated product");
    } catch (error) {
      assert.include(error.toString(), "ProductNotActive");
    }
  });

  it("Fails when non-admin tries to add product", async () => {
    const productId = 1;
    const [product] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        marketplace.toBuffer(),
        new anchor.BN(productId).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    
    try {
      await program.methods
        .addProduct("Test Product", "Test Description", new anchor.BN(10000), new anchor.BN(10))
        .accountsStrict({
          marketplace,
          product,
          admin: buyer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();
      
      assert.fail("Should have failed when non-admin tries to add product");
    } catch (error) {
      assert.include(error.toString(), "Unauthorized");
    }
  });
});