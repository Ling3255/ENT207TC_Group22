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
const seedDataPath = path.join(__dirname, "seed-data.json");

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(
    password + (process.env.PASSWORD_SALT || "engimatch-salt")
  );
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function seedUsers() {
  const users = [
    {
      email: "admin@engimatch.com",
      password: "123456",
      name: "Super Admin",
      role: "SUPER_ADMIN",
      status: "APPROVED",
    },
    {
      email: "staff@engimatch.com",
      password: "123456",
      name: "Staff User",
      role: "STAFF",
      status: "APPROVED",
    },
    {
      email: "staff2@engimatch.com",
      password: "123456",
      name: "Pending Staff",
      role: "STAFF",
      status: "PENDING",
    },
    {
      email: "student@engimatch.com",
      password: "123456",
      name: "Student User",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "student2@engimatch.com",
      password: "123456",
      name: "Student User 2",
      role: "STUDENT",
      status: "APPROVED",
    },
  ];

  for (const user of users) {
    const passwordHash = await hashPassword(user.password);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        password_hash: passwordHash,
        name: user.name,
        role: user.role,
        status: user.status,
      },
      create: {
        email: user.email,
        password_hash: passwordHash,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  }
}

function loadSeedData() {
  if (!fs.existsSync(seedDataPath)) {
    throw new Error(
      `Missing ${seedDataPath}. Run "npm run db:export-seed" before deploying so the full dataset is committed.`
    );
  }

  const parsed = JSON.parse(fs.readFileSync(seedDataPath, "utf8"));
  return {
    universities: Array.isArray(parsed.universities) ? parsed.universities : [],
    programmes: Array.isArray(parsed.programmes) ? parsed.programmes : [],
    timelineEvents: Array.isArray(parsed.timeline_events) ? parsed.timeline_events : [],
    exportedAt: parsed.exported_at ?? null,
  };
}

function asDateOrNull(value) {
  return value ? new Date(value) : null;
}

function normalizeNestedRecord(record) {
  if (!record) return undefined;

  const {
    id,
    programme_id,
    created_at,
    updated_at,
    programme,
    ...rest
  } = record;

  return rest;
}

function buildProgrammeScalars(programme) {
  return {
    programme_name: programme.programme_name,
    degree_type: programme.degree_type,
    department: programme.department ?? null,
    study_mode: programme.study_mode ?? null,
    duration_text: programme.duration_text ?? null,
    intake_term: programme.intake_term ?? null,
    application_system_type: programme.application_system_type ?? null,
    application_open_date: asDateOrNull(programme.application_open_date),
    application_deadline_visa: asDateOrNull(programme.application_deadline_visa),
    application_deadline_non_visa: asDateOrNull(programme.application_deadline_non_visa),
    tuition_fee_home_gbp: programme.tuition_fee_home_gbp ?? null,
    tuition_fee_overseas_gbp: programme.tuition_fee_overseas_gbp ?? null,
    official_url: programme.official_url,
    source_last_checked_at: asDateOrNull(programme.source_last_checked_at),
    source_page_title: programme.source_page_title ?? null,
    raw_requirement_text: programme.raw_requirement_text ?? null,
    parser_version: programme.parser_version ?? "seed-full-v1",
    human_verified: programme.human_verified ?? true,
    confidence_score: programme.confidence_score ?? 85,
    is_active: programme.is_active ?? true,
  };
}

function buildPrerequisiteCreate(modules) {
  return (Array.isArray(modules) ? modules : []).map((module) => ({
    canonical_module_name: module.canonical_module_name,
    display_text: module.display_text,
    min_grade_rule: module.min_grade_rule ?? null,
    required: module.required === false ? false : true,
  }));
}

function buildProgrammeCreate(programme, universityId) {
  const academicRequirements = normalizeNestedRecord(programme.academic_requirements);
  const languageRequirements = normalizeNestedRecord(programme.language_requirements);
  const documents = normalizeNestedRecord(programme.documents);
  const compliance = normalizeNestedRecord(programme.compliance);
  const prerequisiteModules = buildPrerequisiteCreate(programme.prerequisite_modules);

  return {
    university_id: universityId,
    slug: programme.slug,
    ...buildProgrammeScalars(programme),
    academic_requirements: academicRequirements ? { create: academicRequirements } : undefined,
    language_requirements: languageRequirements ? { create: languageRequirements } : undefined,
    documents: documents ? { create: documents } : undefined,
    compliance: compliance ? { create: compliance } : undefined,
    prerequisite_modules: prerequisiteModules.length
      ? { create: prerequisiteModules }
      : undefined,
  };
}

function buildProgrammeUpdate(programme) {
  const academicRequirements = normalizeNestedRecord(programme.academic_requirements);
  const languageRequirements = normalizeNestedRecord(programme.language_requirements);
  const documents = normalizeNestedRecord(programme.documents);
  const compliance = normalizeNestedRecord(programme.compliance);
  const prerequisiteModules = buildPrerequisiteCreate(programme.prerequisite_modules);

  return {
    ...buildProgrammeScalars(programme),
    academic_requirements: academicRequirements
      ? {
          upsert: {
            create: academicRequirements,
            update: academicRequirements,
          },
        }
      : undefined,
    language_requirements: languageRequirements
      ? {
          upsert: {
            create: languageRequirements,
            update: languageRequirements,
          },
        }
      : undefined,
    documents: documents
      ? {
          upsert: {
            create: documents,
            update: documents,
          },
        }
      : undefined,
    compliance: compliance
      ? {
          upsert: {
            create: compliance,
            update: compliance,
          },
        }
      : undefined,
    prerequisite_modules: {
      deleteMany: {},
      create: prerequisiteModules,
    },
  };
}

async function main() {
  const seedData = loadSeedData();
  console.log(
    `Seeding full dataset from ${path.basename(seedDataPath)}${
      seedData.exportedAt ? ` (exported ${seedData.exportedAt})` : ""
    }...`
  );

  await seedUsers();

  const universities = await Promise.all(
    seedData.universities.map((university) =>
      prisma.university.upsert({
        where: { slug: university.slug },
        update: {
          name: university.name,
          country: university.country ?? "UK",
          official_domain: university.official_domain,
          rank: university.rank,
        },
        create: {
          ...university,
          country: university.country ?? "UK",
        },
      })
    )
  );

  const universityMap = Object.fromEntries(
    universities.map((university) => [university.slug, university])
  );

  let seededProgrammeCount = 0;
  for (const programme of seedData.programmes) {
    const university = universityMap[programme.university_slug];
    if (!university) {
      console.warn(`Skipping programme with unknown university slug: ${programme.university_slug}`);
      continue;
    }

    await prisma.programme.upsert({
      where: {
        university_id_slug: {
          university_id: university.id,
          slug: programme.slug,
        },
      },
      update: buildProgrammeUpdate(programme),
      create: buildProgrammeCreate(programme, university.id),
    });

    seededProgrammeCount++;
  }

  let seededTimelineCount = 0;
  for (const event of seedData.timelineEvents) {
    const existing = await prisma.timelineEvent.findFirst({
      where: {
        title: event.title,
        phase: event.phase,
        month_min: event.month_min,
        month_max: event.month_max,
      },
    });

    if (existing) {
      await prisma.timelineEvent.update({
        where: { id: existing.id },
        data: event,
      });
    } else {
      await prisma.timelineEvent.create({ data: event });
    }

    seededTimelineCount++;
  }

  console.log(
    `Seed complete: ${universities.length} universities, ${seededProgrammeCount} programmes, ${seededTimelineCount} timeline events.`
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
