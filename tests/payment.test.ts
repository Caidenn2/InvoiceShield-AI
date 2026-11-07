import { describe, it, expect, vi } from "vitest";
import {
  Keypair,
  Connection,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
  ComputeBudgetInstruction,
  PublicKey,
} from "@solana/web3.js";
import {
  toLamports,
  validAddress,
  verifyReceipt,
  submitPayment,
  DEVNET_GENESIS,
  waitForReceipt,
  readConfirmedTransfer,
} from "../src/lib/payment";
import bs58 from "bs58";
const sender = Keypair.generate(),
  recipient = Keypair.generate().publicKey.toBase58();
const pending = {
  signature: "test-signature",
  sender: sender.publicKey.toBase58(),
  recipient,
  lamports: 10000000,
};
function mockRpc(error: unknown = null, amount = 10000000) {
  return {
    getGenesisHash: vi.fn().mockResolvedValue(DEVNET_GENESIS),
    getParsedTransaction: vi.fn().mockResolvedValue({
      slot: 123,
      blockTime: 100,
      meta: { err: error },
      transaction: {
        message: {
          accountKeys: [{ pubkey: sender.publicKey, signer: true }],
          instructions: [
            {
              program: "system",
              parsed: {
                type: "transfer",
                info: {
                  source: pending.sender,
                  destination: recipient,
                  lamports: amount,
                },
              },
            },
          ],
        },
      },
    }),
  } as unknown as Connection;
}
describe("Payment safeguards", () => {
  it("reads an existing confirmed transfer by signature with no signing or submission API", async () => {
    const rpc = mockRpc();
    const signature = bs58.encode(new Uint8Array(64).fill(3));
    const result = await readConfirmedTransfer(rpc, signature);
    expect(result).toMatchObject({ ...pending, signature, network: "devnet" });
    expect(rpc.getParsedTransaction).toHaveBeenCalledTimes(2);
  });
  it("rejects malformed lookup signatures before contacting RPC", async () => {
    const rpc = mockRpc();
    await expect(readConfirmedTransfer(rpc, "bad")).rejects.toThrow(
      "valid public",
    );
    expect(rpc.getGenesisHash).not.toHaveBeenCalled();
  });
  it("refuses failed or non-transfer signatures in the read-only viewer", async () => {
    const signature = bs58.encode(new Uint8Array(64).fill(3));
    await expect(
      readConfirmedTransfer(mockRpc({ error: 1 }), signature),
    ).rejects.toThrow("failed on-chain");
    const rpc = mockRpc();
    const tx = await rpc.getParsedTransaction("unused");
    tx!.transaction.message.instructions = [];
    vi.mocked(rpc.getParsedTransaction).mockResolvedValue(tx);
    await expect(readConfirmedTransfer(rpc, signature)).rejects.toThrow(
      "one direct SOL transfer",
    );
  });
  it.each(["recipient", "amount", "blockhash", "fee payer", "priority fee"])(
    "blocks a changed %s before persistence or broadcast",
    async (change) => {
      const rpc = {
        ...mockRpc(),
        getLatestBlockhash: vi.fn().mockResolvedValue({
          blockhash: Keypair.generate().publicKey.toBase58(),
          lastValidBlockHeight: 100,
        }),
        sendRawTransaction: vi.fn(),
      };
      const persist = vi.fn();
      await expect(
        submitPayment(
          rpc as unknown as Connection,
          sender.publicKey,
          recipient,
          "0.01",
          async (tx) => {
            if (change === "recipient")
              tx.instructions[2] = SystemProgram.transfer({
                fromPubkey: sender.publicKey,
                toPubkey: Keypair.generate().publicKey,
                lamports: 10000000,
              });
            if (change === "amount")
              tx.instructions[2] = SystemProgram.transfer({
                fromPubkey: sender.publicKey,
                toPubkey: new PublicKey(recipient),
                lamports: 10000001,
              });
            if (change === "blockhash")
              tx.recentBlockhash = Keypair.generate().publicKey.toBase58();
            if (change === "fee payer")
              tx.feePayer = Keypair.generate().publicKey;
            if (change === "priority fee")
              tx.instructions[1] = ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: 1000000n,
              });
            tx.partialSign(sender);
            return tx;
          },
          persist,
        ),
      ).rejects.toThrow("different from the approved");
      expect(persist).not.toHaveBeenCalled();
      expect(rpc.sendRawTransaction).not.toHaveBeenCalled();
    },
  );
  it("rejects invalid signatures before recording a submitted payment", async () => {
    const rpc = {
      ...mockRpc(),
      getLatestBlockhash: vi.fn().mockResolvedValue({
        blockhash: Keypair.generate().publicKey.toBase58(),
        lastValidBlockHeight: 100,
      }),
      sendRawTransaction: vi.fn(),
    };
    const persist = vi.fn();
    await expect(
      submitPayment(
        rpc as unknown as Connection,
        sender.publicKey,
        recipient,
        "0.01",
        async (tx) => {
          tx.sign(sender);
          tx.signatures[0].signature!.fill(0);
          return tx;
        },
        persist,
      ),
    ).rejects.toThrow(/Signature verification failed/);
    expect(persist).not.toHaveBeenCalled();
    expect(rpc.sendRawTransaction).not.toHaveBeenCalled();
  });
  it("supports Phantom fee handling without changing the approved message", async () => {
    const rpc = {
      ...mockRpc(),
      getLatestBlockhash: vi.fn().mockResolvedValue({
        blockhash: Keypair.generate().publicKey.toBase58(),
        lastValidBlockHeight: 100,
      }),
      sendRawTransaction: vi.fn().mockResolvedValue("sig"),
      confirmTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
    };
    const sign = vi.fn(async (tx: Transaction) => {
      // Reproduce Phantom's documented policy on a serialized wallet round trip.
      const returned = Transaction.from(
        tx.serialize({ requireAllSignatures: false, verifySignatures: false }),
      );
      if (
        !returned.instructions.some((ix) =>
          ix.programId.equals(ComputeBudgetProgram.programId),
        )
      ) {
        returned.instructions.unshift(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 20000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 }),
        );
      }
      returned.sign(sender);
      return returned;
    });
    const result = await submitPayment(
      rpc as unknown as Connection,
      sender.publicKey,
      recipient,
      "0.01",
      sign,
      async () => {},
    );
    expect(result.lamports).toBe(10000000);
    expect(rpc.sendRawTransaction).toHaveBeenCalledTimes(1);
    const approved = sign.mock.calls[0][0];
    expect(
      ComputeBudgetInstruction.decodeSetComputeUnitLimit(
        approved.instructions[0],
      ).units,
    ).toBe(20000);
    expect(
      ComputeBudgetInstruction.decodeSetComputeUnitPrice(
        approved.instructions[1],
      ).microLamports,
    ).toBe(0n);
  });
  it("does not broadcast a wallet-modified transfer", async () => {
    const rpc = {
      ...mockRpc(),
      getLatestBlockhash: vi.fn().mockResolvedValue({
        blockhash: Keypair.generate().publicKey.toBase58(),
        lastValidBlockHeight: 100,
      }),
      sendRawTransaction: vi.fn(),
    };
    const persist = vi.fn();
    await expect(
      submitPayment(
        rpc as unknown as Connection,
        sender.publicKey,
        recipient,
        "0.01",
        async (tx) => {
          tx.add(
            SystemProgram.transfer({
              fromPubkey: sender.publicKey,
              toPubkey: Keypair.generate().publicKey,
              lamports: 1,
            }),
          );
          tx.sign(sender);
          return tx;
        },
        persist,
      ),
    ).rejects.toThrow("different from the approved");
    expect(persist).not.toHaveBeenCalled();
    expect(rpc.sendRawTransaction).not.toHaveBeenCalled();
  });
  it("retries a delayed transaction lookup and never accepts mismatches", async () => {
    const rpc = mockRpc();
    const result = await rpc.getParsedTransaction("test");
    vi.mocked(rpc.getParsedTransaction)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(result);
    expect((await waitForReceipt(rpc, pending, 2, 0)).slot).toBe(123);
    await expect(
      waitForReceipt(mockRpc(null, 5), pending, 2, 0),
    ).rejects.toThrow("does not match");
  });
  it("recovers confirmation transport errors using the already-submitted signature", async () => {
    const rpc = {
      ...mockRpc(),
      getLatestBlockhash: vi.fn().mockResolvedValue({
        blockhash: Keypair.generate().publicKey.toBase58(),
        lastValidBlockHeight: 100,
      }),
      sendRawTransaction: vi.fn().mockResolvedValue("sig"),
      confirmTransaction: vi
        .fn()
        .mockRejectedValue(new Error("WebSocket unavailable")),
    };
    const result = await submitPayment(
      rpc as unknown as Connection,
      sender.publicKey,
      recipient,
      "0.01",
      async (tx) => {
        tx.sign(sender);
        return tx;
      },
      async () => {},
    );
    expect(result.slot).toBe(123);
    expect(rpc.sendRawTransaction).toHaveBeenCalledTimes(1);
  });
  it("pins the full Devnet genesis hash, not its truncated CAIP chain identifier", () => {
    expect(DEVNET_GENESIS).toBe("EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG");
  });
  it("validates wallet addresses", () => {
    expect(validAddress(recipient)).toBe(true);
    expect(validAddress("bad")).toBe(false);
    expect(validAddress("")).toBe(false);
  });
  it("converts decimal SOL exactly", () => {
    expect(toLamports("0.000000001")).toBe(1);
    expect(toLamports("0.01")).toBe(10000000);
    expect(toLamports("1")).toBe(1000000000);
  });
  it.each(["0", "-1", "1.01", "NaN", "1e-2", "0.0000000001", " 0.1", "0x10"])(
    "rejects unsafe amount %s",
    (value) => expect(() => toLamports(value)).toThrow(),
  );
  it("generates a receipt only for a confirmed matching transfer", async () => {
    const rpc = mockRpc();
    const receipt = await verifyReceipt(rpc, pending);
    expect(rpc.getParsedTransaction).toHaveBeenCalledWith(pending.signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 1,
    });
    expect(receipt).toEqual({
      ...pending,
      network: "devnet",
      slot: 123,
      timestamp: 100,
    });
  });
  it("rejects failed, mismatching, absent, and wrong-network transfers", async () => {
    await expect(
      verifyReceipt(mockRpc({ InstructionError: 1 }), pending),
    ).rejects.toThrow("failed");
    await expect(verifyReceipt(mockRpc(null, 123), pending)).rejects.toThrow(
      "does not match",
    );
    const rpc = mockRpc();
    vi.mocked(rpc.getParsedTransaction).mockResolvedValue(null);
    await expect(verifyReceipt(rpc, pending)).rejects.toThrow("not yet");
    vi.mocked(rpc.getGenesisHash).mockResolvedValue("mainnet");
    await expect(verifyReceipt(rpc, pending)).rejects.toThrow(
      "not Solana Devnet",
    );
  });
  it("never broadcasts when the wallet rejects signing", async () => {
    const rpc = {
      ...mockRpc(),
      getLatestBlockhash: vi.fn().mockResolvedValue({
        blockhash: Keypair.generate().publicKey.toBase58(),
        lastValidBlockHeight: 100,
      }),
      sendRawTransaction: vi.fn(),
    };
    const persist = vi.fn();
    await expect(
      submitPayment(
        rpc as unknown as Connection,
        sender.publicKey,
        recipient,
        "0.01",
        async () => {
          throw new Error("User rejected");
        },
        persist,
      ),
    ).rejects.toThrow("User rejected");
    expect(rpc.sendRawTransaction).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });
  it("records signature before broadcast and rejects on-chain confirmation error", async () => {
    const events: string[] = [];
    const rpc = {
      ...mockRpc(),
      getLatestBlockhash: vi.fn().mockResolvedValue({
        blockhash: Keypair.generate().publicKey.toBase58(),
        lastValidBlockHeight: 100,
      }),
      sendRawTransaction: vi.fn().mockImplementation(async () => {
        events.push("broadcast");
        return "sig";
      }),
      confirmTransaction: vi
        .fn()
        .mockResolvedValue({ value: { err: "failed" } }),
    };
    await expect(
      submitPayment(
        rpc as unknown as Connection,
        sender.publicKey,
        recipient,
        "0.01",
        async (tx) => {
          tx.sign(sender);
          return tx;
        },
        async () => {
          events.push("persist");
        },
      ),
    ).rejects.toThrow("rejected on-chain");
    expect(events).toEqual(["persist", "broadcast"]);
  });
  it("completes submission, confirmation, and receipt verification", async () => {
    const rpc = {
      ...mockRpc(),
      getLatestBlockhash: vi.fn().mockResolvedValue({
        blockhash: Keypair.generate().publicKey.toBase58(),
        lastValidBlockHeight: 100,
      }),
      sendRawTransaction: vi.fn().mockResolvedValue("sig"),
      confirmTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
    };
    const receipt = await submitPayment(
      rpc as unknown as Connection,
      sender.publicKey,
      recipient,
      "0.01",
      async (tx) => {
        tx.sign(sender);
        return tx;
      },
      async () => {},
    );
    expect(receipt.network).toBe("devnet");
    expect(receipt.lamports).toBe(10000000);
  });
});
