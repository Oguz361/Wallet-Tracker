import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Sentinel",
    default: "Authentication | Sentinel",
  },
  description: "Authenticate to access your Solana wallet tracking dashboard",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}