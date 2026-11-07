# Phantom signing compatibility

The initial builder left compute-budget instructions implicit. Phantom documents that it can add priority-fee instructions to unsigned dApp transactions without existing budget settings. Those extra bytes caused InvoiceShield's exact-message integrity check to reject the signed result before any transaction was persisted or broadcast.

The builder now explicitly includes a 20,000-compute-unit limit and a zero-priority-fee instruction before the wallet sees the transaction. The normal Devnet base fee still applies. The application keeps the exact serialized-message comparison; it does not allow arbitrary wallet modifications or silently accept an additional fee.

The regression first reproduced the original error, then passed with the updated builder and a wallet serialization/signing round trip. Additional tests reject altered recipients, amounts, fee payers, blockhashes, priority fees, extra transfers, and invalid signatures before persistence or broadcast. Signature serialization/verification now also happens before a pending payment record is created.

## Retry the rejected attempt

1. Refresh the local dashboard after the server restart. The payment dialog should state that the Devnet priority fee is explicitly set to zero.
2. Open the same clean invoice. If it already shows a submitted transfer or signature, use Verify submitted transfer rather than sending again.
3. Otherwise enter the full address of your second Phantom account and 0.001 test SOL, review the address and amount, confirm, and approve in Phantom on Devnet.
4. Wait for confirmation and matching receipt data. Open the transaction on Explorer. Share only the public transaction signature if verification needs diagnosis.

The specific message-mismatch error happens before InvoiceShield broadcasts, so that rejection did not submit a transfer through this code path. This fix is regression-tested; a successful live Phantom transfer remains to be confirmed by the owner.

Reference: https://github.com/phantom/docs/blob/master/development-powertools/solana-priority-fees.md.
