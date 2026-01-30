import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { updateStudentProfile } from "./actions/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function StudentProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "STUDENT") {
    redirect("/");
  }

  const student = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: {
      name: true,
      studentCode: true,
      course: true,
      year: true,
      section: true,
    },
  });

  if (!student) redirect("/");

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Student Profile</CardTitle>
        </CardHeader>

        <CardContent>
          <form action={updateStudentProfile} className="space-y-6">
            {/* Read-only */}
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={student.name ?? ""} disabled />
            </div>

            <div className="space-y-2">
              <Label>Student Code</Label>
              <Input value={student.studentCode ?? ""} disabled />
            </div>

            {/* Editable */}
            {/* Course */}
            <div className="space-y-2">
              <Label>Course</Label>
              <Select name="course" defaultValue={student.course ?? undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BCA">BCA</SelectItem>
                  <SelectItem value="BCS">BCS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label>Year</Label>
              <Select
                name="year"
                defaultValue={student.year ? String(student.year) : undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Section */}
            <div className="space-y-2">
              <Label>Section</Label>
              <Select
                name="section"
                defaultValue={student.section ?? undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full">
              Save Profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
