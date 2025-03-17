import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";
import { TelegramService } from "@/lib/telegram";

// Configure Telegram webhook and setup
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { chatId } = await req.json();
    
    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    // Find the user
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

    // Create or update telegram config
    const telegramConfig = await prisma.telegramConfig.upsert({
      where: { 
        userId: user.id 
      },
      update: { 
        chatId,
        isActive: true
      },
      create: {
        userId: user.id,
        chatId,
        isActive: true
      }
    });

    // Send a test message
    const telegramService = new TelegramService();
    const messageSent = await telegramService.sendMessage({
      chatId,
      text: `🔔 <b>Sentinel Bot connected successfully!</b>\n\nYou'll now receive alerts for your Solana wallets.`,
      parseMode: 'HTML'
    });

    return NextResponse.json({ 
      success: true, 
      messageSent,
      telegramConfig
    });
  } catch (error) {
    console.error("Error configuring Telegram:", error);
    return NextResponse.json(
      { 
        error: "Failed to configure Telegram",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Get Telegram configuration status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the user with their Telegram config
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

    return NextResponse.json({ 
      configured: !!user.telegramConfig,
      active: user.telegramConfig?.isActive || false,
      chatId: user.telegramConfig?.chatId
    });
  } catch (error) {
    console.error("Error getting Telegram config:", error);
    return NextResponse.json(
      { error: "Failed to get Telegram configuration" },
      { status: 500 }
    );
  }
}
