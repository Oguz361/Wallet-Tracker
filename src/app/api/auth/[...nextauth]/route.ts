import NextAuth from "next-auth";
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { 
          label: "Email", 
          type: "email",
          placeholder: "john.doe@example.com"
        },
        password: { 
          label: "Password", 
          type: "password",
          placeholder: "******"
        }
      },
      async authorize(credentials) {
        // Hier kommt später deine Authentifizierungslogik
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Beispiel für die spätere Implementierung:
          // const user = await prisma.user.findUnique({
          //   where: { email: credentials.email }
          // });
          
          // if (!user) {
          //   return null;
          // }
          
          // const passwordMatch = await bcrypt.compare(
          //   credentials.password,
          //   user.password
          // );
          
          // if (!passwordMatch) {
          //   return null;
          // }
          
          // return {
          //   id: user.id,
          //   email: user.email,
          //   name: user.name
          // };

          return null;
        } catch (error) {
          console.error("Error: ", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',  // Custom signin page path
    signOut: '/auth/signout', // Custom signout page path
    error: '/auth/error',    // Error page for auth issues
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };