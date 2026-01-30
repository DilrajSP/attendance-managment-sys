import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import students from "./students.json";
import { Role } from "@prisma/client";

const DEFAULT_PASSWORD = "ChangeMe@123";

async function main() {
  console.log("🌱 Starting database seeding...");

  //create super admin/teacher
  const adminPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  await prisma.user.upsert({
    where: { username: "AnitaMam" },
    update: {},
    create: {
      role: Role.ADMIN,
      username: "AnitaMam",
      name: "Ms.Anita Shinde",
      password: adminPassword,
      isFirstLogin: true,
    },
  });
  console.log("✅ Admin user seeded");
  //Seed Student---
  const studentPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  let createdCount = 0;
  for (const student of students) {
    if (!student.studentCode || !student.name) continue;

    await prisma.user.upsert({
      where: { studentCode: student.studentCode },
      update: {},
      create: {
        role: Role.STUDENT,
        studentCode: student.studentCode,
        name: student.name,
        password: studentPassword,
        isFirstLogin: true,
      },
    });
    createdCount++;
  }
  console.log(`✅ ${createdCount} students seeded successfully`);
}

try {
  main();
} catch (error) {
  console.error("❌ Seeding error:", error);
  process.exit(1);
} finally {
  async () => {
    await prisma.$disconnect();
  };
}
