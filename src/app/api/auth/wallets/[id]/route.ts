import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../[...nextauth]/route";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const walletId = params.id;
    
    if (!walletId) {
      return NextResponse.json(
        { error: "Wallet ID is required" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if wallet belongs to the user
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId: user.id,
      },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found or doesn't belong to this user" },
        { status: 404 }
      );
    }

    // Delete the wallet
    await prisma.wallet.delete({
      where: {
        id: walletId,
      },
    });

    return NextResponse.json(
      { message: "Wallet deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting wallet:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete wallet",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Optional: Add a PATCH endpoint to update wallet properties
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const walletId = params.id;
    const { label } = await req.json();
    
    if (!walletId) {
      return NextResponse.json(
        { error: "Wallet ID is required" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if wallet belongs to the user
    const existingWallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId: user.id,
      },
    });

    if (!existingWallet) {
      return NextResponse.json(
        { error: "Wallet not found or doesn't belong to this user" },
        { status: 404 }
      );
    }

    // Update the wallet
    const updatedWallet = await prisma.wallet.update({
      where: {
        id: walletId,
      },
      data: {
        label: label || existingWallet.label,
      },
    });

    return NextResponse.json(updatedWallet);
  } catch (error) {
    console.error("Error updating wallet:", error);
    return NextResponse.json(
      { 
        error: "Failed to update wallet",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}