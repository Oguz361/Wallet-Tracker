"use client";

import { Button } from "../components/ui/button";
import Link from "next/link";
import { Meteors } from "../components/ui/meteors";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "../components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Particles } from "@/components/ui/particles";

export default function Home() {
  return (
    <main className="relative">
      <div className="fixed inset-0 z-0">
        <Particles />
      </div>
      
      <div className="relative min-h-screen z-10">
        {/* Erweiterte NavigationMenu mit zwei Listen */}
        <NavigationMenu className="absolute top-4 left-8">
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
        <NavigationMenu className="absolute top-4 right-8">
          <NavigationMenuList className="flex gap-4">
            <NavigationMenuItem>
              <Button
                asChild
                className="bg-transparent hover:bg-white/10 text-white"
              >
                <Link href="/signin">Sign in</Link>
              </Button>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Button 
                asChild 
                className="bg-white text-black hover:bg-white/90"
              >
                <Link href="/signup">Sign up</Link>
              </Button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Hauptinhalt */}
        <div className="flex flex-col items-center pt-32 px-4">
          {/* Title Section */}
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-6xl font-bold text-white bg-clip-text">
              Sentinel - The New Way to Track Solana Wallets
            </h1>
          </div>

          {/* Description */}
          <p className="mb-12 max-w-2xl text-center text-lg text-white/60">
            Track wallets, analyze transactions, and stay informed about all
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
              </Link>
            </Button>
            <Button
              asChild
              className="group rounded-md h-12 bg-transparent text-white hover:bg-transparent"
            >
              <Link
                href="../components/ui/login-form.tsx"
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