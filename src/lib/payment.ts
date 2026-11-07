import {
  PublicKey,
  SystemProgram,
  Transaction,
  Connection,
} from "@solana/web3.js";
import type { Receipt, PendingPayment } from "./invoice";
import bs58 from "bs58";
export const DEVNET_RPC = "https://api.devnet.solana.com";
export const DEVNET_GENESIS = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
export function validAddress(value: string) {
  try {
    return PublicKey.isOnCurve(new PublicKey(value).toBytes());
  } catch {
    return false;
  }
}
export function toLamports(value: string): number {
  if (!/^(0|[1-9]\d*)(\.\d{1,9})?$/.test(value))
    throw new Error(
      "Enter a positive SOL amount with at most 9 decimal places.",
    );
  const [whole, decimal = ""] = value.split(".");
  const n = BigInt(whole) * 1000000000n + BigInt(decimal.padEnd(9, "0"));
  if (n <= 0n || n > 1000000000n)
    throw new Error(
      "Demo payments must be greater than 0 and at most 1 test SOL.",
    );
  return Number(n);
}
export async function assertDevnet(connection: Connection) {
  if ((await connection.getGenesisHash()) !== DEVNET_GENESIS)
    throw new Error("Payment blocked: the RPC is not Solana Devnet.");
}
export async function verifyReceipt(
  connection: Connection,
  payment: PendingPayment,
): Promise<Receipt> {
  await assertDevnet(connection);
  const tx = await connection.getParsedTransaction(payment.signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  if (!tx || !tx.meta)
    throw new Error(
      "Transaction not yet available. Retry verification; do not send another payment.",
    );
  if (tx.meta.err) throw new Error("The transaction failed on-chain.");
  const signer = tx.transaction.message.accountKeys.find(
    (k) => k.pubkey.toBase58() === payment.sender && k.signer,
  );
  const transfers = tx.transaction.message.instructions.filter(
    (i) =>
      "parsed" in i && i.program === "system" && i.parsed?.type === "transfer",
  );
  if (!signer || transfers.length !== 1)
    throw new Error("Receipt does not match the approved payment.");
  const transfer = transfers[0];
  if (!("parsed" in transfer)) throw new Error("Unrecognized transfer.");
  const info = transfer.parsed.info;
  if (
    info.source !== payment.sender ||
    info.destination !== payment.recipient ||
    info.lamports !== payment.lamports
  )
    throw new Error("On-chain sender, recipient, or amount does not match.");
  return {
    ...payment,
    network: "devnet",
    slot: tx.slot,
    timestamp: tx.blockTime ?? null,
  };
}
export async function submitPayment(
  connection: Connection,
  sender: PublicKey,
  recipient: string,
  amount: string,
  sign: (tx: Transaction) => Promise<Transaction>,
  onSubmitted: (p: PendingPayment) => Promise<void>,
): Promise<Receipt> {
  if (!validAddress(recipient))
    throw new Error("Enter a valid wallet recipient address.");
  if (sender.toBase58() === recipient)
    throw new Error("Choose a recipient different from your connected wallet.");
  const lamports = toLamports(amount);
  await assertDevnet(connection);
  const latest = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({ ...latest, feePayer: sender }).add(
    SystemProgram.transfer({
      fromPubkey: sender,
      toPubkey: new PublicKey(recipient),
      lamports,
    }),
  );
  const signed = await sign(tx);
  // Persist the signature before broadcasting. Ambiguous RPC errors cannot enable a second send.
  const signatureBytes = signed.signature;
  if (!signatureBytes) throw new Error("Wallet did not sign the transaction.");
  const signature = bs58.encode(signatureBytes);
  const pending = { signature, sender: sender.toBase58(), recipient, lamports };
  await onSubmitted(pending);
  await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });
  const result = await connection.confirmTransaction(
    { ...latest, signature },
    "confirmed",
  );
  if (result.value.err)
    throw new Error("The transaction was rejected on-chain.");
  return verifyReceipt(connection, pending);
}
export const explorer = (signature: string) =>
  `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=devnet`;
