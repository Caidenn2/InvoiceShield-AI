'use client';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { DEVNET_RPC } from '@/lib/payment';
import '@solana/wallet-adapter-react-ui/styles.css';
const wallets:[]=[];
export default function WalletContext({children}:{children:React.ReactNode}) {return <ConnectionProvider endpoint={DEVNET_RPC}><WalletProvider wallets={wallets} autoConnect={false}><WalletModalProvider>{children}</WalletModalProvider></WalletProvider></ConnectionProvider>}
