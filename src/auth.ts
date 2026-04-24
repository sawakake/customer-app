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

        const staff = await prisma.staff.findUnique({
          where: { email: credentials.email as string },
        });

        if (!staff) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          staff.password
        );

        if (!isValid) return null;

        return {
          id: staff.id,
          email: staff.email,
          name: staff.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicPage = nextUrl.pathname === "/register" || 
                           nextUrl.pathname === "/admin/login" ||
                           nextUrl.pathname.startsWith("/api/auth") ||
                           nextUrl.pathname.startsWith("/public"); // 将来の公開ページ用

      if (isPublicPage) return true;
      return isLoggedIn;
    },
  },
});
