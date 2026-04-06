"use strict";

require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── First 8 Universities ───────────────────────────────────────────
const UNI_DATA = [
  { name: "Imperial College London", slug: "imperial-college-london", official_domain: "imperial.ac.uk", rank: 6, country: "UK" },
  { name: "University of Cambridge", slug: "university-of-cambridge", official_domain: "cam.ac.uk", rank: 3, country: "UK" },
  { name: "University of Oxford", slug: "university-of-oxford", official_domain: "ox.ac.uk", rank: 2, country: "UK" },
  { name: "University College London", slug: "ucl", official_domain: "ucl.ac.uk", rank: 9, country: "UK" },
  { name: "University of Manchester", slug: "university-of-manchester", official_domain: "manchester.ac.uk", rank: 32, country: "UK" },
  { name: "University of Southampton", slug: "university-of-southampton", official_domain: "soton.ac.uk", rank: 82, country: "UK" },
  { name: "University of Sheffield", slug: "university-of-sheffield", official_domain: "sheffield.ac.uk", rank: 105, country: "UK" },
  { name: "University of Bristol", slug: "university-of-bristol", official_domain: "bristol.ac.uk", rank: 78, country: "UK" },
];

// ─── Programme Data (canonical schema) ────────────────────────────────
const PROGRAMME_DATA = [
  // UCL — Power Systems Engineering MSc
  {
    university_slug: "ucl",
    programme_name: "MSc Power Systems Engineering",
    slug: "ucl-power-systems-msc",
    degree_type: "MSc",
    department: "Department of Electronic and Electrical Engineering",
    study_mode: "full-time",
    duration_text: "1 year",
    intake_term: "2026-09",
    application_system_type: "university_portal",
    official_url: "https://www.ucl.ac.uk/prospective-students/graduate/taught-degrees/power-systems-engineering-msc",
    tuition_fee_overseas_gbp: 37500,
    academic_requirements: {
      min_degree_level: "bachelor",
      min_uk_classification: "2:1",
      accepted_backgrounds: ["electrical_engineering", "mechanical_engineering", "mechatronics", "electronic_engineering"],
      prerequisite_module_logic: "ALL",
      work_experience_considered: false,
      interview_possible: true,
      cv_required: false,
      portfolio_required: false,
    },
    language_requirements: {
      english_requirement_level: "good",
      ielts_overall: 6.5,
      ielts_lrw_min: 6.0,
      toefl_total: 92,
      validity_window_months: 24,
    },
    documents: {
      transcript_required: true,
      personal_statement_required: true,
      references_required_count: 2,
      reference_type_academic_min: 2,
      cv_resume_required: false,
      additional_documents: [],
    },
    compliance: {
      atas_possible: true,
      atas_rule_text: "Check CAH3 code in offer if applicable — this programme may involve study of sensitive technology",
    },
    prerequisite_modules: [
      { canonical_module_name: "applied_electricity", display_text: "basic knowledge of applied electricity", required: true },
      { canonical_module_name: "circuits", display_text: "circuit analysis or electronics", required: true },
      { canonical_module_name: "power_systems", display_text: "introduction to power systems", required: false },
    ],
    raw_requirement_text: "Entry Requirements:\nA minimum of an upper second-class UK Bachelor's degree (2:1 or equivalent) in Electrical, Mechanical, Mechatronics or Electronic Engineering or a related discipline.\nFor Chinese applicants: a minimum of 80% from a recognised university.\nEnglish language: IELTS 6.5 (6.0 in each band) or TOEFL 92.\nPrerequisites: It is expected that applicants have a basic knowledge of applied electricity and circuit analysis.",
  },
  // UCL — Mechanical Engineering MSc
  {
    university_slug: "ucl",
    programme_name: "MSc Mechanical Engineering",
    slug: "ucl-mechanical-eng-msc",
    degree_type: "MSc",
    department: "Department of Mechanical Engineering",
    study_mode: "full-time",
    duration_text: "1 year",
    intake_term: "2026-09",
    application_system_type: "university_portal",
    official_url: "https://www.ucl.ac.uk/prospective-students/graduate/taught-degrees/mechanical-engineering-msc",
    tuition_fee_overseas_gbp: 35000,
    academic_requirements: {
      min_degree_level: "bachelor",
      min_uk_classification: "2:1",
      accepted_backgrounds: ["mechanical_engineering", "materials_engineering", "aerospace_engineering"],
      prerequisite_module_logic: "ALL",
      work_experience_considered: false,
      interview_possible: false,
      cv_required: false,
      portfolio_required: false,
    },
    language_requirements: {
      english_requirement_level: "good",
      ielts_overall: 6.5,
      ielts_lrw_min: 6.0,
      toefl_total: 92,
      validity_window_months: 24,
    },
    documents: {
      transcript_required: true,
      personal_statement_required: true,
      references_required_count: 2,
      reference_type_academic_min: 2,
      cv_resume_required: false,
      additional_documents: [],
    },
    compliance: { atas_possible: false },
    prerequisite_modules: [
      { canonical_module_name: "solid_mechanics", display_text: "solid mechanics or strength of materials", required: true },
      { canonical_module_name: "mathematics", display_text: "mathematics for engineering", required: true },
      { canonical_module_name: "fluid_dynamics", display_text: "fluid dynamics or thermodynamics", required: false },
    ],
    raw_requirement_text: "Entry Requirements:\nA minimum of an upper second-class UK Bachelor's degree (2:1 or equivalent) in Mechanical Engineering or related discipline.\nChinese applicants: 80% average from a recognised university.\nEnglish: IELTS 6.5 (6.0 each) or TOEFL 92.",
  },
  // Imperial — Advanced Aeronautical Engineering MSc
  {
    university_slug: "imperial-college-london",
    programme_name: "MSc Advanced Aeronautical Engineering",
    slug: "imperial-aeronautical-msc",
    degree_type: "MSc",
    department: "Department of Aeronautics",
    study_mode: "full-time",
    duration_text: "1 year",
    intake_term: "2026-10",
    application_system_type: "university_portal",
    official_url: "https://www.imperial.ac.uk/aeronautics/postgraduate/taught-programmes/advanced-aeronautical-engineering/",
    tuition_fee_overseas_gbp: 37900,
    academic_requirements: {
      min_degree_level: "bachelor",
      min_uk_classification: "2:1",
      accepted_backgrounds: ["aerospace_engineering", "mechanical_engineering", "materials_engineering"],
      prerequisite_module_logic: "ALL",
      work_experience_considered: true,
      interview_possible: true,
      cv_required: true,
      portfolio_required: false,
    },
    language_requirements: {
      english_requirement_level: "good",
      ielts_overall: 6.5,
      ielts_lrw_min: 6.0,
      toefl_total: 92,
      validity_window_months: 24,
    },
    documents: {
      transcript_required: true,
      personal_statement_required: true,
      references_required_count: 2,
      reference_type_academic_min: 2,
      cv_resume_required: true,
      additional_documents: [],
    },
    compliance: { atas_possible: true, atas_rule_text: "This programme requires ATAS clearance. CAH3 code will be provided in offer letter." },
    prerequisite_modules: [
      { canonical_module_name: "fluid_dynamics", display_text: "fluid dynamics or aerodynamics", required: true },
      { canonical_module_name: "structural_dynamics", display_text: "structural dynamics or solid mechanics", required: true },
      { canonical_module_name: "mathematics", display_text: "mathematics (calculus, linear algebra)", required: true },
    ],
    raw_requirement_text: "Entry Requirements:\nA minimum of an upper second-class Bachelor's degree (2:1 or equivalent) in Aerospace Engineering, Mechanical Engineering or a related discipline.\nNormally requiring at least 2:1 in Aeronautics or related engineering discipline. Preferably First Class.\nPrerequisite knowledge: fluid dynamics, structural dynamics, mathematics.\nEnglish: IELTS 6.5 (6.0 each) or TOEFL 92.",
  },
  // Imperial — Advanced Mechanical Engineering MSc
  {
    university_slug: "imperial-college-london",
    programme_name: "MSc Advanced Mechanical Engineering",
    slug: "imperial-adv-mech-msc",
    degree_type: "MSc",
    department: "Department of Mechanical Engineering",
    study_mode: "full-time",
    duration_text: "1 year",
    intake_term: "2026-10",
    application_system_type: "university_portal",
    official_url: "https://www.imperial.ac.uk/mechanical-engineering/postgraduate/taught-programmes/",
    tuition_fee_overseas_gbp: 37900,
    academic_requirements: {
      min_degree_level: "bachelor",
      min_uk_classification: "2:1",
      accepted_backgrounds: ["mechanical_engineering", "mechatronics", "materials_engineering"],
      prerequisite_module_logic: "ALL",
      work_experience_considered: true,
      interview_possible: false,
      cv_required: false,
      portfolio_required: false,
    },
    language_requirements: {
      english_requirement_level: "good",
      ielts_overall: 6.5,
      ielts_lrw_min: 6.0,
      toefl_total: 92,
      validity_window_months: 24,
    },
    documents: {
      transcript_required: true,
      personal_statement_required: true,
      references_required_count: 2,
      reference_type_academic_min: 2,
      cv_resume_required: false,
      additional_documents: [],
    },
    compliance: { atas_possible: false },
    prerequisite_modules: [
      { canonical_module_name: "thermodynamics", display_text: "thermodynamics or heat transfer", required: true },
      { canonical_module_name: "fluid_dynamics", display_text: "fluid mechanics", required: true },
      { canonical_module_name: "solid_mechanics", display_text: "solid mechanics or structural analysis", required: true },
    ],
    raw_requirement_text: "Entry Requirements:\nA good honours degree (2:1 or equivalent) in Mechanical Engineering or a related discipline.\nEnglish: IELTS 6.5 (6.0 each) or TOEFL 92.\nRequired modules: thermodynamics or heat transfer, fluid mechanics, solid mechanics or structural analysis.",
  },
  // Manchester — Aerospace Engineering MSc
  {
    university_slug: "university-of-manchester",
    programme_name: "MSc Aerospace Engineering",
    slug: "manchester-aerospace-msc",
    degree_type: "MSc",
    department: "Department of Mechanical, Aerospace and Civil Engineering",
    study_mode: "full-time",
    duration_text: "1 year",
    intake_term: "2026-09",
    application_system_type: "university_portal",
    official_url: "https://www.manchester.ac.uk/study/masters/taught-courses/aerospace-engineering-msc/",
    tuition_fee_overseas_gbp: 31000,
    academic_requirements: {
      min_degree_level: "bachelor",
      min_uk_classification: "2:1",
      accepted_backgrounds: ["aerospace_engineering", "mechanical_engineering", "materials_engineering"],
      prerequisite_module_logic: "ALL",
      work_experience_considered: false,
      interview_possible: false,
      cv_required: false,
      portfolio_required: false,
    },
    language_requirements: {
      english_requirement_level: "standard",
      ielts_overall: 6.5,
      ielts_lrw_min: 6.0,
      toefl_total: 90,
      validity_window_months: 24,
    },
    documents: {
      transcript_required: true,
      personal_statement_required: true,
      references_required_count: 2,
      reference_type_academic_min: 1,
      cv_resume_required: false,
      additional_documents: [],
    },
    compliance: { atas_possible: true, atas_rule_text: "ATAS may be required — check CAH3 code if applicable" },
    prerequisite_modules: [
      { canonical_module_name: "mathematics", display_text: "mathematics for engineering", required: true },
      { canonical_module_name: "fluid_dynamics", display_text: "fluid dynamics or aerodynamics", required: true },
      { canonical_module_name: "solid_mechanics", display_text: "solid mechanics or strength of materials", required: true },
    ],
    raw_requirement_text: "Entry Requirements:\nA good honours degree (2:1 or equivalent) in Aerospace Engineering or a relevant discipline.\nChinese applicants: 75% average from a prestigious university.\nEnglish: IELTS 6.5 (6.0 each) or TOEFL 90.\nWe look at key relevant modules — mathematics, fluid dynamics, solid mechanics are particularly important.",
  },
  // Manchester — Electrical Power Systems MSc
  {
    university_slug: "university-of-manchester",
    programme_name: "MSc Electrical Power Systems Engineering",
    slug: "manchester-power-systems-msc",
    degree_type: "MSc",
    department: "Department of Electrical and Electronic Engineering",
    study_mode: "full-time",
    duration_text: "1 year",
    intake_term: "2026-09",
    application_system_type: "university_portal",
    official_url: "https://www.manchester.ac.uk/study/masters/taught-courses/electrical-power-systems-engineering-msc/",
    tuition_fee_overseas_gbp: 31000,
    academic_requirements: {
      min_degree_level: "bachelor",
      min_uk_classification: "2:1",
      accepted_backgrounds: ["electrical_engineering", "electronic_engineering", "control_engineering"],
      prerequisite_module_logic: "ALL",
      work_experience_considered: false,
      interview_possible: false,
      cv_required: false,
      portfolio_required: false,
    },
    language_requirements: {
      english_requirement_level: "standard",
      ielts_overall: 6.5,
      ielts_lrw_min: 6.0,
      toefl_total: 90,
      validity_window_months: 24,
    },
    documents: {
      transcript_required: true,
      personal_statement_required: true,
      references_required_count: 2,
      reference_type_academic_min: 1,
      cv_resume_required: false,
      additional_documents: [],
    },
    compliance: { atas_possible: true, atas_rule_text: "ATAS may be required — confirm CAH3 code if offer received" },
    prerequisite_modules: [
      { canonical_module_name: "power_systems", display_text: "power systems or electrical machines", required: true },
      { canonical_module_name: "circuits", display_text: "circuit analysis", required: true },
      { canonical_module_name: "mathematics", display_text: "mathematics", required: true },
    ],
    raw_requirement_text: "Entry Requirements:\nA good honours degree (2:1 or equivalent) in Electrical or Electronic Engineering.\nChinese applicants: 75% average.\nEnglish: IELTS 6.5 (6.0 each) or TOEFL 90.\nRequired: power systems or electrical machines, circuit analysis, mathematics.",
  },
  // Southampton — Mechanical Engineering MSc
  {
    university_slug: "university-of-southampton",
    programme_name: "MSc Mechanical Engineering",
    slug: "southampton-mech-msc",
    degree_type: "MSc",
    department: "School of Engineering",
    study_mode: "full-time",
    duration_text: "1 year",
    intake_term: "2026-09",
    application_system_type: "university_portal",
    official_url: "https://www.southampton.ac.uk/courses/mechanical-engineering-masters",
    tuition_fee_overseas_gbp: 29200,
    academic_requirements: {
      min_degree_level: "bachelor",
      min_uk_classification: "2:1",
      accepted_backgrounds: ["mechanical_engineering", "aerospace_engineering", "materials_engineering", "energy_engineering"],
      prerequisite_module_logic: "ALL",
      work_experience_considered: true,
      interview_possible: true,
      cv_required: false,
      portfolio_required: false,
    },
    language_requirements: {
      english_requirement_level: "standard",
      ielts_overall: 6.5,
      ielts_lrw_min: 5.5,
      toefl_total: 92,
      validity_window_months: 24,
    },
    documents: {
      transcript_required: true,
      personal_statement_required: true,
      references_required_count: 2,
      reference_type_academic_min: 1,
      cv_resume_required: false,
      additional_documents: [],
    },
    compliance: { atas_possible: false },
    prerequisite_modules: [
      { canonical_module_name: "mathematics", display_text: "mathematics", required: true },
      { canonical_module_name: "solid_mechanics", display_text: "solid mechanics or mechanics of materials", required: true },
      { canonical_module_name: "thermodynamics", display_text: "thermodynamics or heat transfer", required: false },
    ],
    raw_requirement_text: "Entry Requirements:\nA 2:1 classification in Mechanical Engineering or a closely related subject.\nChinese applicants: 80% from a 211 university.\nEnglish: IELTS 6.5 (5.5 each) or TOEFL 92.\nSouthampton uses its own online application system. Prerequisite: mathematics and solid mechanics.",
  },
  // Sheffield — Electronic and Electrical Engineering MSc
  {
    university_slug: "university-of-sheffield",
    programme_name: "MSc Electronic and Electrical Engineering",
    slug: "sheffield-eee-msc",
    degree_type: "MSc",
    department: "Department of Electronic and Electrical Engineering",
    study_mode: "full-time",
    duration_text: "1 year",
    intake_term: "2026-09",
    application_system_type: "university_portal",
    official_url: "https://www.sheffield.ac.uk/postgraduate/taught/courses/electronic-electrical-engineering-msc",
    tuition_fee_overseas_gbp: 26950,
    academic_requirements: {
      min_degree_level: "bachelor",
      min_uk_classification: "2:2",
      accepted_backgrounds: ["electrical_engineering", "electronic_engineering", "computer_engineering", "control_engineering"],
      prerequisite_module_logic: "ALL",
      work_experience_considered: false,
      interview_possible: false,
      cv_required: false,
      portfolio_required: false,
    },
    language_requirements: {
      english_requirement_level: "standard",
      ielts_overall: 6.0,
      ielts_lrw_min: 5.5,
      toefl_total: 80,
      validity_window_months: 24,
    },
    documents: {
      transcript_required: true,
      personal_statement_required: true,
      references_required_count: 2,
      reference_type_academic_min: 0,
      cv_resume_required: false,
      additional_documents: [],
    },
    compliance: { atas_possible: false },
    prerequisite_modules: [
      { canonical_module_name: "circuits", display_text: "circuit analysis or electronics", required: true },
      { canonical_module_name: "mathematics", display_text: "mathematics for engineering", required: true },
    ],
    raw_requirement_text: "Entry Requirements:\nMinimum 2:2 honours degree (or equivalent) in Electrical Engineering, Electronics, Physics or related.\nChinese applicants: average 70% or above.\nEnglish: IELTS 6.0 (5.5) or TOEFL 80.\nRequired: circuit analysis or electronics, mathematics for engineering.",
  },
];

// ─── Seed Runner ─────────────────────────────────────────────────────
async function main() {
  console.log("Seeding database (canonical schema v0.1)...\n");

  // Universities
  const universities = await Promise.all(
    UNI_DATA.map((u) =>
      prisma.university.upsert({
        where: { slug: u.slug },
        update: { official_domain: u.official_domain, rank: u.rank },
        create: u,
      })
    )
  );
  console.log(`✓ ${universities.length} universities seeded`);

  const uniMap = Object.fromEntries(universities.map((u) => [u.slug, u]));

  // Programme data rows with embedded nested objects
  for (const pd of PROGRAMME_DATA) {
    const uni = uniMap[pd.university_slug];
    if (!uni) { console.warn(`University not found: ${pd.university_slug}`); continue; }

    const { university_slug, prerequisite_modules, ...rest } = pd;

    await prisma.programme.upsert({
      where: { university_id_slug: { university_id: uni.id, slug: pd.slug } },
      update: { is_active: true },
      create: {
        university_id: uni.id,
        slug: pd.slug,
        programme_name: pd.programme_name,
        degree_type: pd.degree_type,
        department: pd.department,
        study_mode: pd.study_mode,
        duration_text: pd.duration_text,
        intake_term: pd.intake_term,
        application_system_type: pd.application_system_type,
        official_url: pd.official_url,
        tuition_fee_overseas_gbp: pd.tuition_fee_overseas_gbp,
        raw_requirement_text: pd.raw_requirement_text,
        parser_version: "v0.1",
        human_verified: true, // seed data is manually verified
        confidence_score: 85,
        academic_requirements: { create: pd.academic_requirements },
        language_requirements: { create: pd.language_requirements },
        documents: { create: pd.documents },
        compliance: { create: pd.compliance },
        prerequisite_modules: prerequisite_modules
          ? {
              create: prerequisite_modules.map((m) => ({
                canonical_module_name: m.canonical_module_name,
                display_text: m.display_text,
                required: m.required,
              })),
            }
          : undefined,
      },
    });

    console.log(`  ✓ ${pd.programme_name} (${uni.name})`);
  }

  console.log("\n✓ Seed complete. 8 universities, 8 programmes seeded.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
