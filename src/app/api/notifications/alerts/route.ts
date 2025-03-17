import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

// Get all alerts for the user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        telegramConfig: {
          include: { alerts: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.telegramConfig) {
      return NextResponse.json(
        { error: "Telegram not configured" },
        { status: 404 }
      );
    }

    return NextResponse.json(user.telegramConfig.alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

// Create a new alert
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const alertData = await req.json();
    
    if (!alertData.type) {
      return NextResponse.json(
        { error: "Alert type is required" },
        { status: 400 }
      );
    }

    // Find the user and their Telegram config
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { telegramConfig: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.telegramConfig) {
      return NextResponse.json(
        { error: "Telegram not configured" },
        { status: 404 }
      );
    }

    // Create the alert
    const alert = await prisma.alert.create({
      data: {
        telegramConfigId: user.telegramConfig.id,
        type: alertData.type,
        walletAddress: alertData.walletAddress,
        tokenAddress: alertData.tokenAddress,
        threshold: alertData.threshold,
        isActive: true
      }
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Error creating alert:", error);
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}
