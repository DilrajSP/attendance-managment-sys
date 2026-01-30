import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  // ✅ unwrap params
  const { sessionId } = await context.params;

  const id = Number(sessionId);
  if (Number.isNaN(id)) {
    return new NextResponse("Invalid session id", { status: 400 });
  }

  // Auth
  const session = await getServerSession(authOptions);
  if (!session || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Fetch session
  const attendanceSession = await prisma.attendanceSession.findUnique({
    where: { id },
    include: {
      records: {
        include: {
          student: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!attendanceSession) {
    return new NextResponse("Session not found", { status: 404 });
  }

  // CSV header (meta info)
  let csv = `Course: ${attendanceSession.course}, Section: ${attendanceSession.section}, Subject: ${attendanceSession.subject}\n`;
  csv += "Student Name,Status\n";

  for (const record of attendanceSession.records) {
    csv += `${record.student.name ?? "Unknown"},${record.status}\n`;
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="attendance-session-${id}.csv"`,
    },
  });
}
