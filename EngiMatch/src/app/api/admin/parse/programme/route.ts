import { NextRequest, NextResponse } from "next/server";
import { parseProgrammePage } from "@/lib/crawler/rule-parser";
import { cleanHtml, extractTextContent } from "@/lib/crawler/html-cleaner";
import { prisma } from "@/lib/prisma";

// POST /api/admin/parse/programme
// Parse raw text/html and update structured fields on a programme record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { programmeId, rawText, useHtmlCleaner = true } = body;

    if (!programmeId) {
      return NextResponse.json({ error: "programmeId is required" }, { status: 400 });
    }

    if (!rawText) {
      return NextResponse.json({ error: "rawText is required" }, { status: 400 });
    }

    const cleaned = useHtmlCleaner ? extractTextContent(rawText) : rawText;
    const parsed = parseProgrammePage(cleaned);

    // Build academic requirements
    const arData = {
      min_degree_level: "bachelor",
      min_uk_classification: parsed.min_uk_classification,
      accepted_backgrounds: parsed.accepted_backgrounds,
      prerequisite_module_logic: "ALL",
    };

    // Build language requirements
    const lrData = {
      ielts_overall: parsed.ielts_overall,
      ielts_lrw_min: parsed.ielts_lrw_min,
      toefl_total: parsed.toefl_total,
    };

    // Build documents
    const docData = {
      transcript_required: parsed.transcript_required,
      personal_statement_required: parsed.personal_statement_required,
      references_required_count: parsed.references_required_count,
      cv_resume_required: parsed.cv_resume_required,
    };

    // Build compliance
    const complianceData = {
      atas_possible: parsed.atas_possible,
      atas_rule_text: parsed.atas_rule_text,
    };

    // Upsert all related records
    await prisma.programmeAcademicRequirement.upsert({
      where: { programme_id: programmeId },
      update: arData,
      create: { programme_id: programmeId, ...arData },
    });

    await prisma.programmeLanguageRequirement.upsert({
      where: { programme_id: programmeId },
      update: lrData,
      create: { programme_id: programmeId, ...lrData },
    });

    await prisma.programmeDocument.upsert({
      where: { programme_id: programmeId },
      update: docData,
      create: { programme_id: programmeId, ...docData },
    });

    await prisma.programmeCompliance.upsert({
      where: { programme_id: programmeId },
      update: complianceData,
      create: { programme_id: programmeId, ...complianceData },
    });

    // Delete old prerequisite modules and recreate
    await prisma.prerequisiteModule.deleteMany({ where: { programme_id: programmeId } });
    if (parsed.prerequisite_modules.length > 0) {
      await prisma.prerequisiteModule.createMany({
        data: parsed.prerequisite_modules.map((m) => ({
          programme_id: programmeId,
          canonical_module_name: m.canonical,
          display_text: m.display,
          required: m.required,
        })),
      });
    }

    // Update programme with parser metadata
    await prisma.programme.update({
      where: { id: programmeId },
      data: {
        parser_version: "v0.1",
        confidence_score: parsed.confidence_score,
        human_verified: false,
      },
    });

    // Return full updated programme
    const programme = await prisma.programme.findUnique({
      where: { id: programmeId },
      include: {
        university: true,
        academic_requirements: true,
        language_requirements: true,
        documents: true,
        compliance: true,
        prerequisite_modules: true,
      },
    });

    return NextResponse.json({ success: true, parsed, programme });
  } catch (error) {
    console.error("POST /api/admin/parse/programme error:", error);
    return NextResponse.json({ error: "Parse failed" }, { status: 500 });
  }
}
