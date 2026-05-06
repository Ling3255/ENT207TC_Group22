"use strict";

require("dotenv/config");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function toPlain(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && typeof value.toJSON === "function") {
    return value.toJSON();
  }
  if (Array.isArray(value)) return value.map(toPlain);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, toPlain(entryValue)])
    );
  }
  return value;
}

async function main() {
  const universities = await prisma.university.findMany({
    orderBy: [{ rank: "asc" }, { name: "asc" }],
  });

  const programmes = await prisma.programme.findMany({
    include: {
      university: true,
      academic_requirements: true,
      language_requirements: true,
      documents: true,
      compliance: true,
      prerequisite_modules: {
        orderBy: [{ required: "desc" }, { canonical_module_name: "asc" }, { display_text: "asc" }],
      },
    },
    orderBy: [{ university: { rank: "asc" } }, { programme_name: "asc" }],
  });

  const timelineEvents = await prisma.timelineEvent.findMany({
    orderBy: [{ phase_order: "asc" }, { month_min: "asc" }, { created_at: "asc" }],
  });

  const payload = {
    exported_at: new Date().toISOString(),
    universities: universities.map((university) => ({
      name: university.name,
      slug: university.slug,
      official_domain: university.official_domain,
      rank: university.rank,
      country: university.country,
    })),
    programmes: programmes.map((programme) => ({
      university_slug: programme.university.slug,
      programme_name: programme.programme_name,
      slug: programme.slug,
      degree_type: programme.degree_type,
      department: programme.department,
      study_mode: programme.study_mode,
      duration_text: programme.duration_text,
      intake_term: programme.intake_term,
      application_system_type: programme.application_system_type,
      application_open_date: toPlain(programme.application_open_date),
      application_deadline_visa: toPlain(programme.application_deadline_visa),
      application_deadline_non_visa: toPlain(programme.application_deadline_non_visa),
      tuition_fee_home_gbp: toPlain(programme.tuition_fee_home_gbp),
      tuition_fee_overseas_gbp: toPlain(programme.tuition_fee_overseas_gbp),
      official_url: programme.official_url,
      source_last_checked_at: toPlain(programme.source_last_checked_at),
      source_page_title: programme.source_page_title,
      raw_requirement_text: programme.raw_requirement_text,
      parser_version: programme.parser_version,
      human_verified: programme.human_verified,
      confidence_score: programme.confidence_score,
      is_active: programme.is_active,
      academic_requirements: toPlain(programme.academic_requirements),
      language_requirements: toPlain(programme.language_requirements),
      documents: toPlain(programme.documents),
      compliance: toPlain(programme.compliance),
      prerequisite_modules: programme.prerequisite_modules.map((module) => ({
        canonical_module_name: module.canonical_module_name,
        display_text: module.display_text,
        min_grade_rule: module.min_grade_rule,
        required: module.required,
      })),
    })),
    timeline_events: timelineEvents.map((event) => ({
      title: event.title,
      title_en: event.title_en,
      description: event.description,
      description_en: event.description_en,
      phase: event.phase,
      phase_order: event.phase_order,
      category: event.category,
      month_min: event.month_min,
      month_max: event.month_max,
      is_required: event.is_required,
      icon: event.icon,
    })),
  };

  const outputPath = path.join(__dirname, "..", "prisma", "seed-data.json");
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

  console.log(
    `Exported ${payload.universities.length} universities, ${payload.programmes.length} programmes, and ${payload.timeline_events.length} timeline events to ${outputPath}`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
