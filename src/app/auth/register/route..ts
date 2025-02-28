import { NextResponse } from "next/server";
import bcrypt from "bcrypt"
import { prisma } from "@/lib/prisma";

export async function POST(req: Request){
    try {
        const { email, password } = await req.json();
        
        if(!email || !password){
            return NextResponse.json(
                { error: 'Missing email or password' },
                { status: 400 }
            );
        }
        
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        
        if(existingUser){
            return NextResponse.json(
                { error: "Email already exists" },
                { status: 400 }
            );
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
            }
        });
        
        console.log("User created successfully:", user.id);
        
        return NextResponse.json(
            { message: "User created successfully", userId: user.id },
            { status: 201 }
        );
    } catch(error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { 
                error: "Error creating user",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}