import NextAuth from "next-auth";
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt"
import { prisma } from "@/lib/prisma";

// Define custom auth type that matches our Prisma User model
interface UserAuth {
  id: string;
  email: string;
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { 
          label: "Email", 
          type: "email",
          placeholder: "email@example.com"
        },
        password: { 
          label: "Password", 
          type: "password",
          placeholder: "******"
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          console.log("Looking up user:", credentials.email);
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });
          
          if (!user) {
            console.log("User not found");
            return null;
          }

          console.log("Comparing password for user:", user.id);
          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordMatch) {
            console.log("Password does not match");
            return null;
          }

          console.log("Authentication successful for user:", user.id);
          
          // Return only the fields needed for auth
          return {
            id: user.id,
            email: user.email
          } as UserAuth;

        } catch (error) {
          console.error("Auth error: ", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Use type assertion here to help TypeScript understand the structure
        const userAuth = user as UserAuth;
        token.id = userAuth.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',  
    signOut: '/auth/signout', 
    error: '/auth/error',    
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };