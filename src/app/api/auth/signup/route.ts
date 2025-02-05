import { NextResponse } from "next/server";
import bcrypt from "bcrypt"
import { User } from "@/app/models/User";
import connectDB from "@/lib/db";

export async function POST(req: Request){
    try{
        const {email, password} = await req.json();
        
        if(!email || !password){
            return NextResponse.json(
                {error: 'Missing email or password'},
                {status: 400}
            );
        }
        
        await connectDB();
        
        const existingUser = await User.findOne({email});
        if(existingUser){
            return NextResponse.json(
                {error: "Email already exists"},
                {status: 400}
            );
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const user = await User.create({
            email,
            password: hashedPassword,
        });
        
        return NextResponse.json(
            {message: "User created successfully", userId: user._id},
            {status: 201}
        );
    } catch(error) {
        console.error("Registration error", error);
        return NextResponse.json(
            {error: "Error creating user"},
            {status: 500}
        );
    }
}