"use server";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export async function updateStudentProfile(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "STUDENT") {
    throw new Error("Unauthorized");
  }

  const course = formData.get("course") as string;
  const section = formData.get("section") as string;
  const year = Number(formData.get("year"));

  if (!course || !section || !year) {
    throw new Error("All fields are required");
  }

  await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: {
      course,
      section,
      year,
    },
  });

  redirect("/student/dashboard");
}
