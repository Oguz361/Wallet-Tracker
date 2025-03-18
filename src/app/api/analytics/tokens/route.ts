import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getTopTokensPurchased } from "@/lib/solana";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the timeframe from query params, default to "day"
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe") || "day";
    
    // Find the user and their wallets
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallets: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get wallet addresses
    const walletAddresses = user.wallets.map(wallet => wallet.address);
    
    // Calculate days back based on timeframe
    let daysBack: number;
    switch(timeframe) {
      case "day": daysBack = 1; break;
      case "3days": daysBack = 3; break;
      case "week": daysBack = 7; break;
      case "month": daysBack = 30; break;
      case "6months": daysBack = 180; break;
      default: daysBack = 1;
    }
    
    // Get top tokens purchased
    const topTokens = await getTokenPurchases(walletAddresses, daysBack);
    
    return NextResponse.json(topTokens);
  } catch (error) {
    console.error("Error fetching top tokens:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch top tokens",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}