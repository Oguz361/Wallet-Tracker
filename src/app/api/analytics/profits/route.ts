import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";
import { analyzeProfitLoss, getHistoricalTransactions } from "@/lib/solana";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the timeframe from query params, default to "day"
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe") || "day";
    const sortDirection = searchParams.get("sort") || "desc"; // desc = highest profit first, asc = lowest profit first

    // Find the user and their wallets
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallets: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate days back based on timeframe
    let daysBack: number;
    switch (timeframe) {
      case "day":
        daysBack = 1;
        break;
      case "3days":
        daysBack = 3;
        break;
      case "week":
        daysBack = 7;
        break;
      case "month":
        daysBack = 30;
        break;
      case "6months":
        daysBack = 180;
        break;
      default:
        daysBack = 1;
    }

    // Process each wallet to calculate profits
    const profitSummaries = await Promise.all(
      user.wallets.map(async (wallet) => {
        // Get historical transactions for this wallet
        const transactions = await getHistoricalTransactions(
          wallet.address,
          daysBack
        );

        // Calculate profits
        const profits = await analyzeProfitLoss(
          wallet.address,
          transactions,
          daysBack
        );

        return {
          walletId: wallet.id,
          walletAddress: wallet.address,
          walletLabel: wallet.label,
          profitDay: profits.day,
          profit3Days: profits.threeDays,
          profitWeek: profits.week,
          profitMonth: profits.month,
          profit6Months: profits.sixMonths,
        };
      })
    );

    // Sort by the requested timeframe
    let sortField: keyof (typeof profitSummaries)[0];
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
        details: error instanceof Error ? error.message : String(error),
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
  const relevantTxs = transactions.filter((tx) => {
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
