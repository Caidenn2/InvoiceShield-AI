import { describe, it, expect } from "vitest";
import { Keypair } from "@solana/web3.js";
import { paymentInputError } from "../src/lib/payment";
describe("Pre-signing payment form validation", () => {
  const sender = Keypair.generate().publicKey.toBase58(),
    recipient = Keypair.generate().publicKey.toBase58();
  it("accepts a separate valid wallet and positive Devnet amount", () =>
    expect(paymentInputError(recipient, "0.001", sender)).toBeNull());
  it("rejects malformed and same-wallet recipients", () => {
    expect(paymentInputError("bad", "0.001", sender)).toContain(
      "valid recipient",
    );
    expect(paymentInputError(sender, "0.001", sender)).toContain("different");
  });
  it.each(["0", "-1", "1.001", "NaN", "0.0000000001"])(
    "blocks invalid amount %s before wallet approval",
    (amount) =>
      expect(paymentInputError(recipient, amount, sender)).not.toBeNull(),
  );
});
