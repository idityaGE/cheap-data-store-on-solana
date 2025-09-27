import * as anchor from '@coral-xyz/anchor'
import * as web3 from "@solana/web3.js";
import type { CheapDataStore } from "../target/types/cheap_data_store"
import { Program } from '@coral-xyz/anchor'

const wallet = web3.Keypair.fromSecretKey(new Uint8Array([191, 191, 88, 89, 191, 57, 127, 155, 134, 10, 223, 155, 240, 240, 177, 78, 184, 250, 119, 112, 229, 82, 77, 70, 193, 181, 1, 250, 181, 190, 31, 76, 134, 132, 63, 172, 16, 118, 140, 243, 202, 60, 162, 185, 44, 22, 138, 104, 114, 77, 38, 155, 102, 98, 36, 246, 103, 28, 7, 205, 214, 166, 254, 144]))

const connection = new web3.Connection('http://127.0.0.1:8899', 'confirmed')
const anchorWallet = new anchor.Wallet(wallet)
const provider = new anchor.AnchorProvider(connection, anchorWallet, {})

anchor.setProvider(provider)
const program = anchor.workspace.CheapDataStore as Program<CheapDataStore>

const [dbAccountPda, dbBump] = web3.PublicKey.findProgramAddressSync(
  [Buffer.from("db_account"), wallet.publicKey.toBuffer()],
  program.programId
);

const [dataAccountPda, dataBump] = web3.PublicKey.findProgramAddressSync(
  [Buffer.from("data_account"), wallet.publicKey.toBuffer()],
  program.programId
);

console.log("DB Account PDA: ", dbAccountPda.toBase58());
console.log("Data Account PDA: ", dataAccountPda.toBase58());

const init_user = async () => {
  const txhash = await program.methods.initializeDb("String").accounts({
    user: wallet.publicKey,
    dataAccount: dataAccountPda,
    dbAccount: dbAccountPda,
    systemProgram: web3.SystemProgram.programId
  }).signers([wallet]).rpc();

  await program.provider.connection.confirmTransaction(txhash);

  console.log("Tx Hash : ", txhash);

  return txhash
};

const data = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

const chunks: string[] = [];
const chunkSizeBytes = 100;

const encoder = new TextEncoder();
const dataBytes = encoder.encode(data);

for (let i = 0; i < dataBytes.length; i += chunkSizeBytes) {
  const chunkBytes = dataBytes.slice(i, i + chunkSizeBytes);
  const decoder = new TextDecoder();
  chunks.push(decoder.decode(chunkBytes));
}

for (let i = 0; i < chunks.length; i++) {
  console.log(`Chunk ${i + 1}/${chunks.length}:`, chunks[i]);
}

const process_one_chunk = async (chunk: string, index: number) => {
  console.log(`Processing chunk ${index + 1}/"${chunks.length}"`);

  const txHash = await program.methods.addChunk(chunk).accounts({
    user: wallet.publicKey,
    dataAccount: dataAccountPda,
    dbAccount: dbAccountPda,
  }).rpc();

  await program.provider.connection.confirmTransaction(txHash);

  const updateTxHash = await program.methods.updateDbAccount(txHash).accounts({
    user: wallet.publicKey,
    dbAccount: dbAccountPda,
  }).rpc();

  await program.provider.connection.confirmTransaction(updateTxHash);

  console.log(`Completed chunk ${index + 1}/${chunks.length}, AddChunk Tx: ${txHash}`);
}

const process_all_chunks = async () => {
  for (let i = 0; i < chunks.length; i++) {
    await process_one_chunk(chunks[i], i);
  }
}

const main = async () => {
  await init_user();
  await process_all_chunks();
}

main().catch(err => console.log(err));