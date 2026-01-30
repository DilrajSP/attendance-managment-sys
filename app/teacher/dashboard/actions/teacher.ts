"use server";
export const runtime = "nodejs";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function getTeacherDashboardData() {
  // 1.Auth check
  const session = await getServerSession(authOptions);
  if (!session || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized!");
  }

  const teacherId = Number(session.user.id);
  const now = new Date();

  // 2.Active session (only ONE max)
  const activeSession = await prisma.attendanceSession.findFirst({
    where: {
      teacherId: teacherId,
      expiresAt: {
        gt: now,
      },
      isLocked: false,
    },
    select: {
      id: true,
      subject: true,
      course: true,
      year: true,
      section: true,
      otp: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  //3.session history
  const historySessions = await prisma.attendanceSession.findMany({
    where: {
      teacherId: teacherId,
      expiresAt: {
        lt: now,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      subject: true,
      course: true,
      year: true,
      section: true,
      createdAt: true,
    },
  });
  //Return Clean Data

  return {
    teacherName: session.user.name,
    activeSession,
    historySessions,
  };
}
