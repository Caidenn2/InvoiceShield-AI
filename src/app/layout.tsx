import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'InvoiceShield AI — Verify smarter. Pay faster.',description:'Invoice intelligence meets verifiable Solana Devnet payments.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
