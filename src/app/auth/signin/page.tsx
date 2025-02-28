import { LoginForm } from "@/components/login-form";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Sign In",
    description: "Sign in to your account",
}

export default function signInPage(){
    return(
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <div className="absolute top-4 left-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                </Button>
            </div>
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <LoginForm />
            </div>
        </div>
    )
}