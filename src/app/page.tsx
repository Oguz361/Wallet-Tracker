"use client";

import { Button } from "../components/ui/button";
import Link from "next/link";
import { Meteors } from "../components/ui/meteors";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <div className="relative flex min-h-screen flex-col items-center z-20">
        <main className="flex flex-col items-center mt-32 px-4">
          {/* Title Section */}
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-6xl font-bold text-white bg-clip-text">
              Sentinel - The New Way to Track Solana Wallets
            </h1>
          </div>

          {/* Description */}
          <p className="mb-12 max-w-2xl text-center text-lg text-white/60">
            Track your wallets, analyze transactions, and stay informed about all
            activities with our real-time notifications.
          </p>

          {/* Button Container */}
          <div className="flex gap-4 items-center">
            <Button asChild className="group rounded-full h-12">
              <Link 
                href="../components/ui/login-form.tsx" 
                className="flex items-center gap-2 px-5"
              >
                Get Started for Free
                <span className="text-xl transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </Button>
          </div>
        </main>
      </div>
      <Meteors number={20}/>
    </div>
  );
}