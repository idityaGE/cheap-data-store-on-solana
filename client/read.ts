import * as web3 from "@solana/web3.js";
import bs58 from "bs58";
import fs from "fs";

const connection = new web3.Connection('http://127.0.0.1:8899', 'confirmed');
const db_account = new web3.PublicKey('AEmR1EuPyReMXJ4KMXCSKBu5qwos2msr2qCY2JgQsqbD');
const data_account = new web3.PublicKey('GtGCXBNzJoMeBArfXRzxJSD2s5qVbZbi8vRoHGpyxED6');

const getAllTxs = async (pubkey: web3.PublicKey) => {
  const txs = await connection.getSignaturesForAddress(pubkey, { limit: 1000 });
  return txs;
}

const getTxInstructionsData = async (signature: string) => {
  const tx = await connection.getTransaction(signature, { commitment: "confirmed" });
  const data = tx.transaction.message.instructions[0].data;
  return data;
}

function decodeAnchorString(arg: Uint8Array): string {
  const len =
    arg[0] |
    (arg[1] << 8) |
    (arg[2] << 16) |
    (arg[3] << 24);

  const strBytes = arg.slice(4, 4 + len);

  return new TextDecoder().decode(strBytes);
}

const process_signatures = async () => {
  const db_txs = await getAllTxs(db_account);

  console.log("Total transactions found:", db_txs.length);
  // fs.writeFileSync('db_txs.json', JSON.stringify(db_txs, null, 2));

  for (let i = db_txs.length - 1; i >= 0; i--) {
    const sig = db_txs[i].signature;
    const data = await connection.getAccountInfo(data_account, { commitment: "confirmed", minContextSlot: db_txs[i].slot });
    if (data === null) {
      console.log(`DB Tx ${i} - Signature: ${sig.substring(0, 8)}... - Data: <No data>`);
      continue;
    }
    const account_data = data.data;
    const arg = account_data.slice(8);
    const argStr = decodeAnchorString(arg);
    console.log(`DB Tx ${i} - Signature: ${sig.substring(0, 8)}... - Data: "${argStr}"`);
  }


  // for (let i = db_txs.length - 1; i >= 0; i--) {
  //   const sig = db_txs[i].signature;
  //   const data = await getTxInstructionsData(sig);
  //   const decoded_data = bs58.decode(data);
  //   const arg = decoded_data.slice(8);
  //   const argStr = decodeAnchorString(arg);
  //   console.log(`DB Tx ${i} - Signature: ${sig.substring(0, 8)}... - Data: "${argStr}"`);
  // }
}

process_signatures().catch(err => console.log(err));