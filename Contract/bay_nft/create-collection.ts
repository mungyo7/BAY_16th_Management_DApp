import {
    createNft,
    fetchDigitalAsset,
    mplTokenMetadata,
  } from "@metaplex-foundation/mpl-token-metadata";
  
  import {
    airdropIfRequired,
    getExplorerLink,
  } from "@solana-developers/helpers";
  
  import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
  
  import { Connection, LAMPORTS_PER_SOL, clusterApiUrl, Keypair } from "@solana/web3.js";
  import {
    generateSigner,
    keypairIdentity,
    percentAmount,
  } from "@metaplex-foundation/umi";
  import * as fs from "fs";
  
  const connection = new Connection(clusterApiUrl("devnet"));
  
  // baySMce3jxfnxTH1UivnFaDVXQRpTxziGU2YgnKFRNy.json 파일에서 키페어 로드
  const secretKeyArray = JSON.parse(fs.readFileSync("./baySMce3jxfnxTH1UivnFaDVXQRpTxziGU2YgnKFRNy.json", "utf8"));
  const user = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
  
  await airdropIfRequired(
    connection,
    user.publicKey,
    1 * LAMPORTS_PER_SOL,
    0.5 * LAMPORTS_PER_SOL
  );
  
  console.log("Loaded user", user.publicKey.toBase58());
  
  const umi = createUmi(connection.rpcEndpoint);
  umi.use(mplTokenMetadata());
  
  const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
  umi.use(keypairIdentity(umiUser));
  
  console.log("Set up Umi instance for user");
  
  const collectionMint = generateSigner(umi);
  
    const transaction = await createNft(umi, {
    mint: collectionMint,
    name: "BAY NFT Collection",
    symbol: "BAY",
    uri: "https://apricot-selective-kangaroo-871.mypinata.cloud/ipfs/bafkreihkczmawnyjcxebjm6xfpzziikneddjmwzx5xifgs5oiskciowv4i",
    sellerFeeBasisPoints: percentAmount(0),
    isCollection: true,
  });
  
  console.log("Sending transaction...");
  const result = await transaction.sendAndConfirm(umi);
  console.log("Transaction confirmed!");

  // 트랜잭션이 완전히 처리될 때까지 잠시 대기
  console.log("Waiting for account to be available...");
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    const createdCollectionNft = await fetchDigitalAsset(
      umi,
      collectionMint.publicKey
    );

    console.log(
      `Created Collection 📦! Address is ${getExplorerLink(
        "address",
        createdCollectionNft.mint.publicKey,
        "devnet"
      )}`
    );
  } catch (error) {
    console.log("Error fetching digital asset, but collection was created:");
    console.log(
      `Collection Address: ${getExplorerLink(
        "address",
        collectionMint.publicKey,
        "devnet"
      )}`
    );
    console.log("Mint Public Key:", collectionMint.publicKey);
  }