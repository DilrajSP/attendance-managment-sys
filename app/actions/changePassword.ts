"use server";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/auth";

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = Number(session.user.id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // verify old password
  const isValid = await bcrypt.compare(currentPassword, user.password);

  if (!isValid) {
    throw new Error("Current password is incorrect");
  }

  // prevent same password reuse
  const samePassword = await bcrypt.compare(newPassword, user.password);

  if (samePassword) {
    throw new Error("New password must be different");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      isFirstLogin: false,
    },
  });

  return { success: true };
}
