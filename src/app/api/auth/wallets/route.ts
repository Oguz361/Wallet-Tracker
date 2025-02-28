import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const wallets = await prisma.wallet.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(wallets);
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallets" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { address, label } = await req.json();
    
    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    try {
      const { isValidSolanaAddress } = require('@/lib/solana');
      if (!isValidSolanaAddress(address)) {
        return NextResponse.json(
          { error: "Invalid Solana wallet address" },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid Solana wallet address" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const existingWallet = await prisma.wallet.findFirst({
      where: {
        userId: user.id,
        address,
      },
    });

    if (existingWallet) {
      return NextResponse.json(
        { error: "Wallet already exists for this user" },
        { status: 400 }
      );
    }

    const walletCount = await prisma.wallet.count({
      where: { userId: user.id },
    });

    const wallet = await prisma.wallet.create({
      data: {
        address,
        label: label || address.substring(0, 4) + "..." + address.substring(address.length - 4),
        isMain: walletCount === 0, 
        userId: user.id,
      },
    });

    return NextResponse.json(wallet, { status: 201 });
  } catch (error) {
    console.error("Error adding wallet:", error);
    return NextResponse.json(
      { error: "Failed to add wallet" },
      { status: 500 }
    );
  }
}