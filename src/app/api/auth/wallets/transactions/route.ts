import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRecentTransactions, isValidSolanaAddress } from "@/lib/solana";
import { authOptions } from "../../[...nextauth]/route";

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
    const limitParam = searchParams.get("limit");
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    if (!isValidSolanaAddress(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid Solana address format" },
        { status: 400 }
      );
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: "Invalid limit parameter. Must be between 1 and 50." },
        { status: 400 }
      );
    }

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

    const transactions = await getRecentTransactions(walletAddress, limit);

    return NextResponse.json({
      address: walletAddress,
      transactions
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch transactions",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}