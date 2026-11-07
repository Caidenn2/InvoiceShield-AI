// Read-only: validates RPC access and verifies an EXISTING public Devnet transfer.
// This never creates a wallet, requests an airdrop, signs, or submits a transaction.
const { Connection, SystemProgram } = require("@solana/web3.js");
const {
  DEVNET_RPC,
  assertDevnet,
  verifyReceipt,
} = require("../src/lib/payment.ts");
async function main() {
  const connection = new Connection(DEVNET_RPC, "confirmed");
  await assertDevnet(connection);
  const latest = await connection.getLatestBlockhash("confirmed");
  if (!latest.blockhash || !latest.lastValidBlockHeight)
    throw new Error("RPC did not return a usable blockhash");
  console.log("PASS: live Devnet identity and transaction blockhash RPC.");
  const signatures = await connection.getSignaturesForAddress(
    SystemProgram.programId,
    { limit: 10 },
    "confirmed",
  );
  for (const row of signatures.filter((s) => !s.err)) {
    const tx = await connection.getParsedTransaction(row.signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 1,
    });
    const transfers =
      tx?.transaction.message.instructions.filter(
        (i) =>
          "parsed" in i &&
          i.program === "system" &&
          i.parsed?.type === "transfer",
      ) || [];
    if (transfers.length !== 1 || !("parsed" in transfers[0])) continue;
    const info = transfers[0].parsed.info;
    const signed = tx.transaction.message.accountKeys.some(
      (k) => k.pubkey.toBase58() === info.source && k.signer,
    );
    if (!signed) continue;
    const receipt = await verifyReceipt(connection, {
      signature: row.signature,
      sender: info.source,
      recipient: info.destination,
      lamports: info.lamports,
    });
    console.log(
      "PASS: receipt matching against an existing public Devnet transfer. This is not an InvoiceShield-submitted payment.",
    );
    console.log(
      JSON.stringify({
        signature: receipt.signature,
        slot: receipt.slot,
        network: receipt.network,
      }),
    );
    return;
  }
  console.log(
    "SKIP: no suitable direct transfer among the sampled public transactions. Live receipt verification still requires an owner-approved InvoiceShield payment.",
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
