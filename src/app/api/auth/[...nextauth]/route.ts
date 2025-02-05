import NextAuth from "next-auth";
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt"
import { User } from "@/app/models/User";
import connectDB from "@/lib/db";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { 
          label: "Email", 
          type: "email",
          placeholder: "momohussein@lutscht.com"
        },
        password: { 
          label: "Password", 
          type: "password",
          placeholder: "******"
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();

          const user = await User.findOne({email: credentials.email});
          if(!user){
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if(!passwordMatch){
            return null
          }

          return{
            id: user._id.toString(),
            email: user.email
          };

        } catch (error) {
          console.error("Error: ", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',  
    signOut: '/auth/signout', 
    error: '/auth/error',    
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };