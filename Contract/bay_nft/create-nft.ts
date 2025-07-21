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
    publicKey,
  } from "@metaplex-foundation/umi";
  import * as fs from "fs";
  
  const connection = new Connection(clusterApiUrl("devnet"));
  
  // baySMce3jxfnxTH1UivnFaDVXQRpTxziGU2YgnKFRNy.json 파일에서 키페어 로드 -> 관리자 지갑 키페어
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
  
  const collectionAddress = publicKey(
    "Gf2NsrsD6skni1LhYekTDuqVs8BLdqbTZfwrethz2orR" // Collection Address
  );
  
  console.log(`Creating NFT...`);
  
  const mint = generateSigner(umi);
  
  const transaction = await createNft(umi, {
    mint,
    name: "BAY NFT #1",
    uri: "https://apricot-selective-kangaroo-871.mypinata.cloud/ipfs/bafkreidk3o5xdszxy3ndfywiexeg7lntagbky6mu5meg5mxj6yushe7zo4",
    sellerFeeBasisPoints: percentAmount(0),
    collection: {
      key: collectionAddress,
      verified: false,
    },
  });
  
  console.log("Sending NFT creation transaction...");
  const result = await transaction.sendAndConfirm(umi);
  console.log("NFT transaction confirmed!");
  
  // 트랜잭션이 완전히 처리될 때까지 잠시 대기
  console.log("Waiting for NFT account to be available...");
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    const createdNft = await fetchDigitalAsset(umi, mint.publicKey);
    
    console.log(
      `🖼️ Created NFT! Address is ${getExplorerLink(
        "address",
        createdNft.mint.publicKey,
        "devnet"
      )}`
    );
  } catch (error) {
    console.log("Error fetching digital asset, but NFT was created:");
    console.log(
      `NFT Address: ${getExplorerLink(
        "address",
        mint.publicKey,
        "devnet"
      )}`
    );
    console.log("Mint Public Key:", mint.publicKey);
  }