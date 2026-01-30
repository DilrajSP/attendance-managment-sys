import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./lib/prisma";
import bcrypt from "bcrypt";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    // student credentials
    CredentialsProvider({
      id: "student",
      name: "Student Login",
      credentials: {
        studentCode: { label: "Student Code", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.studentCode || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        const student = await prisma.user.findUnique({
          where: { studentCode: credentials.studentCode },
        });

        if (!student || student.role !== "STUDENT") {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          student.password,
        );

        if (!isValid) return null;

        return {
          id: student.id.toString(),
          name: student.name,
          role: student.role,
          userCode: student.studentCode!,
          isFirstLogin: student.isFirstLogin,
        };
      },
    }),
    // teacher credentials
    CredentialsProvider({
      id: "teacher",
      name: "Teacher Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const teacher = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!teacher || !["TEACHER", "ADMIN"].includes(teacher.role)) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          teacher.password,
        );

        if (!isValid) return null;

        return {
          id: teacher.id.toString(),
          name: teacher.name,
          role: teacher.role,
          userCode: teacher.username!,
          isFirstLogin: teacher.isFirstLogin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.role = user.role;
        token.userCode = user.userCode;
        token.isFirstLogin = user.isFirstLogin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.userCode = token.userCode;
        session.user.isFirstLogin = token.isFirstLogin;
      }
      return session;
    },
  },
  pages: {
    // custom signin pages
    signIn: "/",
  },
};
