import { LoginForm } from "@/components/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign In",
    description: "Sign in to your account",
}

export default function signInPage(){
    return(
        <div className="container flex h-screen w-screen flex-col items-center justify-content">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <LoginForm />
            </div>
        </div>
    )
}