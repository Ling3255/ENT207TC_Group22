import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/universities
export async function GET() {
  const universities = await prisma.university.findMany({
    orderBy: [{ rank: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(universities);
}
