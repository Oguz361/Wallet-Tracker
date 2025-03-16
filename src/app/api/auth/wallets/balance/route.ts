import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getWalletBalance, getTokenBalances, isValidSolanaAddress, getLastTransactionDate } from "@/lib/solana";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get("address");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Validate the Solana address format
    if (!isValidSolanaAddress(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid Solana address format" },
        { status: 400 }
      );
    }

    // Verify wallet belongs to the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        wallets: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userOwnsWallet = user.wallets.some(wallet => wallet.address === walletAddress);
    if (!userOwnsWallet) {
      return NextResponse.json(
        { error: "Wallet not found for this user" },
        { status: 404 }
      );
    }

    // Fetch SOL balance, token balances, and last transaction date in parallel
    const [solBalance, tokens, lastTxDate] = await Promise.all([
      getWalletBalance(walletAddress),
      getTokenBalances(walletAddress),
      getLastTransactionDate(walletAddress)
    ]);

    return NextResponse.json({
      address: walletAddress,
      solBalance,
      tokens,
      lastTransactionDate: lastTxDate
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch wallet balance",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
