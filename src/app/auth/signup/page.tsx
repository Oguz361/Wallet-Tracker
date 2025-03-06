"use client";

import { Metadata } from "next"
import { SignUpForm } from "@/components/signup-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Particles } from "@/components/ui/particles"

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new account",
}

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0">
        <Particles />
      </div>
      
      <div className="container flex h-screen w-screen flex-col items-center justify-center relative z-10">
        <div className="absolute top-4 left-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <SignUpForm />
        </div>
      </div>
    </div>
  )
}