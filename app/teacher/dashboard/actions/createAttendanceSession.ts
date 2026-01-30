"use server";
export const runtime = "nodejs";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { z } from "zod";

const createSessionSchema = z.object({
  course: z.string().min(3),
  year: z.number().int(),
  section: z.string().min(1),
  subject: z.string().min(1),
});

export async function createAttendanceSession(
  input: z.infer<typeof createSessionSchema>,
) {
  // 1.Auth Check (Nextauth V4)
  const session = await getServerSession(authOptions);

  if (!session || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized!");
  }

  //2.Validate input
  const data = createSessionSchema.parse(input);

  const teacherId = Number(session.user.id);
  if (Number.isNaN(teacherId)) {
    throw new Error("Invalid session user!");
  }

  const now = new Date();

  //3.Prevent duplicate active sessions
  const existingSession = await prisma.attendanceSession.findFirst({
    where: {
      teacherId: teacherId,
      course: data.course,
      year: data.year,
      section: data.section,
      subject: data.subject,
      isLocked: false,
      expiresAt: {
        gt: now,
      },
    },
  });

  if (existingSession) {
    throw new Error("An active attendance session already exists.");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  //4.Create Session
  const attendanceSession = await prisma.attendanceSession.create({
    data: {
      course: data.course,
      year: data.year,
      section: data.section,
      subject: data.subject,
      teacherId,
      otp,
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000), //10 min
      deleteAfter: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), //2 days
    },
  });

  return {
    id: attendanceSession.id,
    otp: attendanceSession.otp,
    course: attendanceSession.course,
    year: attendanceSession.year,
    section: attendanceSession.section,
    subject: attendanceSession.subject,
    expiresAt: attendanceSession.expiresAt,
  };
}
