import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 1. Try Staff Login
        const staff = await prisma.staff.findUnique({
          where: { email: credentials.email as string },
        });

        if (staff) {
          const isValid = await bcrypt.compare(
            credentials.password as string,
            staff.password
          );
          if (isValid) {
            return {
              id: staff.id,
              email: staff.email,
              name: staff.name,
              role: "staff",
            };
          }
        }

        // 2. Try Customer Login
        const customer = await prisma.customer.findUnique({
          where: { email: credentials.email as string },
        });

        // パスワードは電話番号（ハイフンありなし両方考慮も可能だがまずは完全一致）
        if (customer && customer.phone === credentials.password) {
          return {
            id: customer.id,
            email: customer.email,
            name: customer.name,
            role: "customer",
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const isPublicPage = pathname === "/register" || 
                           pathname === "/admin/login" ||
                           pathname === "/client/login" ||
                           pathname.startsWith("/api/auth") ||
                           pathname.startsWith("/public");

      if (isPublicPage) return true;
      return isLoggedIn;
    },
  },
});
