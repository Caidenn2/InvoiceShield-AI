import Workspace from "@/components/workspace";
import WalletContext from "@/components/wallet-provider";
export default function Dashboard() {
  return (
    <WalletContext>
      <Workspace />
    </WalletContext>
  );
}
