"use client";

import { Button } from "../components/ui/button";
import Link from "next/link";
import { Meteors } from "../components/ui/meteors";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "../components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Particles } from "@/components/ui/particles";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <main className="relative">
      <div className="fixed inset-0 z-0">
        <Particles />
      </div>
      
      <div className="relative min-h-screen z-10">
        {/* Fixierte Navbar mit Blur-Effekt */}
        <nav className="fixed top-0 w-full h-16 px-8 flex items-center bg-black/10 backdrop-blur-sm z-50">
          <div className="flex justify-between items-center w-full">
            {/* Logo - Links */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/" legacyBehavior passHref>
                    <NavigationMenuLink className="font-semibold text-xl tracking-tight text-white hover:text-white/90 transition-colors duration-200">
                      Sentinel
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Auth Buttons - Rechts */}
            <div className="flex gap-4">
              {session ? (
                <>
                  <Button
                    asChild
                    className="bg-transparent hover:bg-white/10 text-white"
                  >
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button 
                    asChild 
                    className="bg-white text-black hover:bg-white/90"
                  >
                    <Link href="/auth/signout">Sign out</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    className="bg-transparent hover:bg-white/10 text-white"
                  >
                    <Link href="/auth/signin">Sign in</Link>
                  </Button>
                  <Button 
                    asChild 
                    className="bg-white text-black hover:bg-white/90"
                  >
                    <Link href="/auth/signup">Sign up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hauptinhalt */}
        <div className="flex flex-col items-center pt-32 px-4">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-6xl font-bold text-white bg-clip-text">
              Sentinel - The New Way to Track Solana Wallets
            </h1>
          </div>

          <p className="mb-12 max-w-2xl text-center text-lg text-white/60">
            Track wallets, analyze transactions, and stay informed about all
            activities with our real-time notifications.
          </p>

          <div className="flex gap-4 items-center">
            <Button asChild className="group rounded-full h-12">
              <Link
                href={session ? "/dashboard" : "/auth/signup"}
                className="flex items-center gap-2 px-5"
              >
                {session ? "Go to Dashboard" : "Get Started for Free"}
              </Link>
            </Button>
            <Button
              asChild
              className="group rounded-md h-12 bg-transparent text-white hover:bg-transparent"
            >
              <Link
                href="/about"
                className="flex items-center gap-2 px-5"
              >
                Know more
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}