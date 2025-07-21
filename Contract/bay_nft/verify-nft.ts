import {
    findMetadataPda,
    mplTokenMetadata,
    verifyCollectionV1,
  } from "@metaplex-foundation/mpl-token-metadata";
  
  import {
    airdropIfRequired,
    getExplorerLink,
  } from "@solana-developers/helpers";
  
  import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
  
  import { Connection, LAMPORTS_PER_SOL, clusterApiUrl, Keypair } from "@solana/web3.js";
  import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
  import * as fs from "fs";
  
  const connection = new Connection(clusterApiUrl("devnet"));
  
  // baySMce3jxfnxTH1UivnFaDVXQRpTxziGU2YgnKFRNy.json 파일에서 키페어 로드 -> 관리자 지갑 키페어 (컬렉션 업데이트 권한 소유)
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
  
  // Collection Address
  const collectionAddress = publicKey(
    "Gf2NsrsD6skni1LhYekTDuqVs8BLdqbTZfwrethz2orR"
  );
  
  // NFT Address
  const nftAddress = publicKey("oB64JZdSnFBKjXYwV6gitmJyfhazRN4Loj7DCTzZ1Zm");
  
  console.log("Creating verification transaction...");
  const transaction = await verifyCollectionV1(umi, {
    metadata: findMetadataPda(umi, { mint: nftAddress }),
    collectionMint: collectionAddress,
    authority: umi.identity,
  });
  
  try {
    console.log("Sending verification transaction...");
    await transaction.sendAndConfirm(umi);
    console.log("Verification transaction confirmed!");
    
    console.log(
      `✅ NFT ${nftAddress} verified as member of collection ${collectionAddress}! See Explorer at ${getExplorerLink(
        "address",
        nftAddress,
        "devnet"
      )}`
    );
  } catch (error) {
    console.error("Verification failed:", error.message);
    console.log("Possible causes:");
    console.log("1. Collection address might be incorrect");
    console.log("2. NFT address might be incorrect"); 
    console.log("3. Current user might not have update authority for the collection");
    console.log("4. Collection or NFT might not exist yet");
  }