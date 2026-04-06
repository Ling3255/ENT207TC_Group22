import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/admin/verify/programme
// Mark a programme as human-verified and update fields
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { programmeId, human_verified, corrections } = body;

    if (!programmeId) {
      return NextResponse.json({ error: "programmeId is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      human_verified: human_verified ?? true,
    };

    // Apply any field corrections from the admin review
    if (corrections) {
      const { academic_requirements, language_requirements, documents, compliance, prerequisite_modules, ...flat } = corrections;

      if (flat.human_verified !== undefined) updateData.human_verified = flat.human_verified;
      if (flat.parser_version !== undefined) updateData.parser_version = flat.parser_version;
      if (flat.confidence_score !== undefined) updateData.confidence_score = parseInt(flat.confidence_score);

      if (academic_requirements) {
        await prisma.programmeAcademicRequirement.upsert({
          where: { programme_id: programmeId },
          update: academic_requirements,
          create: { programme_id: programmeId, ...academic_requirements },
        });
      }
      if (language_requirements) {
        await prisma.programmeLanguageRequirement.upsert({
          where: { programme_id: programmeId },
          update: language_requirements,
          create: { programme_id: programmeId, ...language_requirements },
        });
      }
      if (documents) {
        await prisma.programmeDocument.upsert({
          where: { programme_id: programmeId },
          update: documents,
          create: { programme_id: programmeId, ...documents },
        });
      }
      if (compliance) {
        await prisma.programmeCompliance.upsert({
          where: { programme_id: programmeId },
          update: compliance,
          create: { programme_id: programmeId, ...compliance },
        });
      }
      if (prerequisite_modules) {
        await prisma.prerequisiteModule.deleteMany({ where: { programme_id: programmeId } });
        if (prerequisite_modules.length > 0) {
          await prisma.prerequisiteModule.createMany({
            data: prerequisite_modules.map((m: { canonical_module_name: string; display_text: string; min_grade_rule?: string; required?: boolean }) => ({
              programme_id: programmeId,
              ...m,
            })),
          });
        }
      }
    }

    const programme = await prisma.programme.update({
      where: { id: programmeId },
      data: updateData,
      include: {
        university: true,
        academic_requirements: true,
        language_requirements: true,
        documents: true,
        compliance: true,
        prerequisite_modules: true,
      },
    });

    return NextResponse.json({ success: true, programme });
  } catch (error) {
    console.error("POST /api/admin/verify/programme error:", error);
    return NextResponse.json({ error: "Verify failed" }, { status: 500 });
  }
}
