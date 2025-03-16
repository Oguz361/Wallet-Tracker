import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getHistoricalTransactions } from "@/lib/solana";

interface ProfitSummary {
  walletId: string;
  walletAddress: string;
  walletLabel: string | null;
  profitDay: number;
  profit3Days: number;
  profitWeek: number;
  profitMonth: number;
  profit6Months: number;
}

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
    const sortDirection = searchParams.get("sort") || "desc"; // desc = highest profit first, asc = lowest profit first (highest loss)
    
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

    // Calculate profits for each wallet
    const profitSummaries: ProfitSummary[] = [];

    // Process each wallet to calculate profits
    for (const wallet of user.wallets) {
      // Get historical transactions for this wallet
      const transactions = await getHistoricalTransactions(wallet.address, 180); // Get 6 months of data
      
      // Calculate profits for different timeframes
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      
      // Calculate profits for each timeframe
      const profitDay = calculateProfit(transactions, dayAgo);
      const profit3Days = calculateProfit(transactions, threeDaysAgo);
      const profitWeek = calculateProfit(transactions, weekAgo);
      const profitMonth = calculateProfit(transactions, monthAgo);
      const profit6Months = calculateProfit(transactions, sixMonthsAgo);
      
      profitSummaries.push({
        walletId: wallet.id,
        walletAddress: wallet.address,
        walletLabel: wallet.label,
        profitDay,
        profit3Days,
        profitWeek,
        profitMonth,
        profit6Months
      });
    }
    
    // Sort by the requested timeframe
    let sortField: keyof ProfitSummary;
    switch (timeframe) {
      case "day":
        sortField = "profitDay";
        break;
      case "3days":
        sortField = "profit3Days";
        break;
      case "week":
        sortField = "profitWeek";
        break;
      case "month":
        sortField = "profitMonth";
        break;
      case "6months":
        sortField = "profit6Months";
        break;
      default:
        sortField = "profitDay";
    }
    
    profitSummaries.sort((a, b) => {
      return sortDirection === "desc"
        ? b[sortField] - a[sortField]
        : a[sortField] - b[sortField];
    });
    
    return NextResponse.json(profitSummaries);
  } catch (error) {
    console.error("Error fetching profit analytics:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch profit analytics",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate profit for a given timeframe
function calculateProfit(transactions: any[], since: Date): number {
  // This is a simplified version - in a real implementation,
  // you would need to track actual buy/sell transactions, token values, etc.
  
  // Filter transactions that occurred after the start date
  const relevantTxs = transactions.filter(tx => {
    return new Date(tx.blockTime) >= since;
  });
  
  // Calculate total profit from these transactions
  let totalProfit = 0;
  
  for (const tx of relevantTxs) {
    // In a real implementation, you would analyze each transaction
    // to determine if it was a buy, sell, or other transaction
    // and calculate the actual profit/loss.
    // 
    // This is a placeholder that would need to be implemented
    // based on your specific business logic and data structure.
    
    // For now, we'll just use a random value as a placeholder
    const txProfit = Math.random() * 10 - 5; // Random value between -5 and 5
    totalProfit += txProfit;
  }
  
  return totalProfit;
}