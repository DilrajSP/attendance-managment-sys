"use server";
export const runtime = "nodejs";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function verifyOtpAndMarkAttendance(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "STUDENT") {
    throw new Error("Unauthorized");
  }

  const otp = formData.get("otp") as string;
  const sessionId = Number(formData.get("sessionId"));

  if (!otp || !sessionId) {
    throw new Error("Invalid request");
  }

  const studentId = Number(session.user.id);
  const now = new Date();

  // 1. Fetch session
  const attendanceSession = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      otp: true,
      expiresAt: true,
      isLocked: true,
    },
  });

  if (
    !attendanceSession ||
    attendanceSession.expiresAt <= now ||
    attendanceSession.isLocked
  ) {
    throw new Error("Attendance session expired");
  }

  // 2. OTP check
  if (attendanceSession.otp !== otp) {
    throw new Error("Invalid OTP");
  }

  // 3. Prevent duplicate attendance
  const alreadyMarked = await prisma.attendanceRecord.findUnique({
    where: {
      sessionId_studentId: {
        sessionId,
        studentId,
      },
    },
  });

  if (alreadyMarked) {
    throw new Error("Attendance already marked");
  }

  // 4. Mark attendance
  await prisma.attendanceRecord.create({
    data: {
      sessionId,
      studentId,
      status: "PRESENT",
    },
  });

  return { success: true };
}
