// Read-only verification of an owner-provided public transaction signature.
const fs = require("node:fs/promises");
const bs58 = require("bs58").default;
const { Connection } = require("@solana/web3.js");
const {
  assertDevnet,
  verifyReceipt,
  DEVNET_RPC,
} = require("../src/lib/payment.ts");
async function main() {
  const signature = process.argv[2];
  if (!signature || bs58.decode(signature).length !== 64)
    throw new Error("Provide a valid public Solana transaction signature.");
  const connection = new Connection(DEVNET_RPC, "confirmed");
  await assertDevnet(connection);
  const tx = await connection.getParsedTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 1,
  });
  if (!tx || tx.meta?.err)
    throw new Error("No successful confirmed transaction found.");
  const transfers = tx.transaction.message.instructions.filter(
    (i) =>
      "parsed" in i && i.program === "system" && i.parsed?.type === "transfer",
  );
  if (transfers.length !== 1 || !("parsed" in transfers[0]))
    throw new Error("Expected one direct SOL transfer for this receipt check.");
  const info = transfers[0].parsed.info;
  const receipt = await verifyReceipt(connection, {
    signature,
    sender: info.source,
    recipient: info.destination,
    lamports: info.lamports,
  });
  await fs.mkdir("test-results", { recursive: true });
  await fs.writeFile(
    "test-results/existing-receipt.json",
    JSON.stringify(receipt, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        status: "PASS",
        check: "Existing owner-provided Devnet signature; no new payment",
        ...receipt,
      },
      null,
      2,
    ),
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
