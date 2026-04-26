"use strict";

require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Simple password hash function for seeding
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + (process.env.PASSWORD_SALT || 'engimatch-salt'));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Test Users ────────────────────────────────────────────────────
async function seedUsers() {
  const users = [
    {
      email: "admin@engimatch.com",
      password: "123456",
      name: "超级管理员",
      role: "SUPER_ADMIN",
      status: "APPROVED",
    },
    {
      email: "staff@engimatch.com",
      password: "123456",
      name: "张老师",
      role: "STAFF",
      status: "APPROVED", // Approved for testing
    },
    {
      email: "staff2@engimatch.com",
      password: "123456",
      name: "李老师",
      role: "STAFF",
      status: "PENDING", // Pending approval for testing
    },
    {
      email: "student@engimatch.com",
      password: "123456",
      name: "王小明",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "student2@engimatch.com",
      password: "123456",
      name: "李小红",
      role: "STUDENT",
      status: "APPROVED",
    },
  ];

  for (const u of users) {
    const passwordHash = await hashPassword(u.password);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        password_hash: passwordHash,
        name: u.name,
        role: u.role,
        status: u.status,
      },
      create: {
        email: u.email,
        password_hash: passwordHash,
        name: u.name,
        role: u.role,
        status: u.status,
      },
    });
    console.log(`✓ User: ${u.email} (${u.role}/${u.status})`);
  }
}

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

// ─── Timeline Events ────────────────────────────────────────────────
const TIMELINE_EVENTS = [
  // Phase 1: 准备阶段
  { title: "确定申请方向与目标院校", title_en: "Define application direction and target universities", description: "根据本科专业、GPA、雅思成绩，确定申请院校层次（冲刺/主申/保底）。建议参考 QS 排名、课程设置和地理位置综合考量。", description_en: "Based on your major, GPA, and IELTS score, determine your application tier (reach/match/safety). Consider QS ranking, course content, and location.", phase: "preparation", phase_order: 1, category: "application", month_min: 2, month_max: 4, is_required: true, icon: "🎯" },
  { title: "开始准备雅思（IELTS）", title_en: "Start preparing for IELTS", description: "雅思有效期为 2 年，9 月入学的同学最晚需在次年 7 月前考出成绩。理工科通常要求 6.5（6.0），部分院校接受 6.0（5.5）。建议提前 6 个月开始系统备考。", description_en: "IELTS validity is 2 years. For September intake, aim to complete IELTS by July. Engineering programmes typically require 6.5 (6.0). Start preparing 6 months in advance.", phase: "preparation", phase_order: 1, category: "language", month_min: 2, month_max: 7, is_required: true, icon: "📝" },
  { title: "准备申请材料", title_en: "Prepare application documents", description: "整理本科成绩单、在读证明、个人陈述（PS）、推荐信、简历等申请材料。PS 建议提前 1-2 个月开始撰写并反复修改。", description_en: "Organize transcripts, degree certificates, personal statement (PS), reference letters, and CV. Start drafting your PS 1-2 months in advance.", phase: "preparation", phase_order: 1, category: "document", month_min: 2, month_max: 5, is_required: true, icon: "📁" },
  { title: "准备资金证明（28天规则）", title_en: "Prepare financial proof (28-day rule)", description: "UKVI 要求资金在银行存满 28 个连续自然日。伦敦地区需约 £13,761/月，外伦敦约 £10,539/月（9个月）。建议尽早将资金存入账户。", description_en: "UKVI requires funds to be held in your account for 28 consecutive days. London: ~£13,761/month; outside London: ~£10,539/month (9 months).", phase: "preparation", phase_order: 1, category: "finance", month_min: 3, month_max: 6, is_required: true, icon: "🏦" },

  // Phase 2: 申请阶段
  { title: "提交申请", title_en: "Submit applications", description: "通过学校官网或 UCAS 提交申请。英国硕士多为滚动录取（Rolling），建议尽早提交以提高录取概率。注意部分学校有明确的申请截止日期。", description_en: "Submit applications via university portals or UCAS. Most UK Master's programmes use rolling admission — apply early. Check for specific deadlines.", phase: "application", phase_order: 2, category: "application", month_min: 4, month_max: 6, is_required: true, icon: "📨" },
  { title: "准备雅思正式考试", title_en: "Take official IELTS exam", description: "如之前未取得满意成绩，需在此阶段完成雅思正式考试。雅思成绩通常 13 个工作日内出分，建议留出足够缓冲时间。", description_en: "Take the official IELTS exam if not yet satisfied with your score. Results typically take 13 business days. Allow buffer time.", phase: "application", phase_order: 2, category: "language", month_min: 5, month_max: 7, is_required: true, icon: "🎓" },
  { title: "等待offer并确认", title_en: "Receive and respond to offers", description: "收到 offer 后仔细核对条件（通常为雅思成绩和最终 GPA）。在 deadline 前接受 offer 并缴纳押金（通常 £2,000–£5,000）。", description_en: "Check offer conditions (usually IELTS and final GPA). Accept your offer and pay the deposit (typically £2,000–£5,000) before the deadline.", phase: "application", phase_order: 2, category: "application", month_min: 5, month_max: 7, is_required: true, icon: "📬" },

  // Phase 3: CAS与签证
  { title: "申请CAS（Confirmation of Acceptance for Studies）", title_en: "Request CAS", description: "在满足所有 offer 条件后，向学校申请 CAS。CAS 有效期为签发后 6 个月，只能使用一次。通常需在课程开始前 3-4 个月申请。", description_en: "After meeting all offer conditions, request your CAS from the university. CAS is valid for 6 months and can only be used once. Typically requested 3-4 months before course start.", phase: "visa", phase_order: 3, category: "visa", month_min: 5, month_max: 7, is_required: true, icon: "📋" },
  { title: "肺结核检测（TB Test）", title_en: "TB test", description: "部分国家（如中国）的学生需前往指定机构完成肺结核检测。检测报告有效期 6 个月，需在递签前完成。", description_en: "Students from certain countries (including China) must take a TB test at an approved clinic. Results are valid for 6 months.", phase: "visa", phase_order: 3, category: "health", month_min: 5, month_max: 8, is_required: false, icon: "🫁" },
  { title: "申请学生签证", title_en: "Apply for Student Visa", description: "持 CAS 申请 Student Visa（学生签证）。签证费约 £524，移民健康附加费（IHS）约 £776/年。可提前 6 个月申请，建议 7 月尽早申请避开 8 月高峰。", description_en: "Apply for Student Visa with your CAS. Visa fee ~£524, IHS ~£776/year. Apply up to 6 months before course start. Apply early in July to avoid August rush.", phase: "visa", phase_order: 3, category: "visa", month_min: 6, month_max: 8, is_required: true, icon: "🛂" },
  { title: "采集生物信息（Biometrics）", title_en: "Biometrics appointment", description: "在 UK Visa Application Centre 预约生物信息采集（指纹和照片）。标准处理时间约 15 个工作日（3 周），可加急（5 工作日/+£500 或 1-2 工作日/+£1,000）。", description_en: "Book a biometrics appointment at a UK Visa Application Centre. Standard processing: 15 working days. Priority: 5 days (+£500). Super Priority: 1-2 days (+£1,000).", phase: "visa", phase_order: 3, category: "visa", month_min: 7, month_max: 8, is_required: true, icon: "🖐️" },
  { title: "等待签证结果", title_en: "Wait for visa decision", description: "等待签证决定。标准处理约 3 周，高峰期（8月）可能延长至 4-5 周。获批后会收到 eVisa 通知，需在 UKVI 账户中确认。", description_en: "Wait for visa decision. Standard processing ~3 weeks, may extend to 4-5 weeks during August peak. Approved visas result in an eVisa notification via your UKVI account.", phase: "visa", phase_order: 3, category: "visa", month_min: 7, month_max: 9, is_required: true, icon: "⏳" },

  // Phase 4: 出行前准备
  { title: "申请大学宿舍/租房", title_en: "Apply for university accommodation or private rent", description: "大学宿舍通常需提前申请，名额有限。若选择校外租房，建议通过正规平台（如 Rightmove、Zoopla、Student.com）查找，注意合同条款和押金保护。", description_en: "University halls fill up quickly — apply early. For private rentals, use reputable platforms (Rightmove, Zoopla, Student.com). Check contracts and deposit protection.", phase: "pre_departure", phase_order: 4, category: "accommodation", month_min: 5, month_max: 8, is_required: true, icon: "🏠" },
  { title: "缴纳学费押金/学费", title_en: "Pay tuition deposit/tuition fees", description: "部分学校在 offer 阶段已缴押金，部分学校需在开学前缴清第一学期或全年学费。使用学校指定支付方式（Flywire/Western Union/银行转账），注意手续费和汇率。", description_en: "Some universities require deposit at offer stage, others before enrolment. Use university-approved payment methods (Flywire, Western Union, bank transfer). Be aware of fees and exchange rates.", phase: "pre_departure", phase_order: 4, category: "finance", month_min: 6, month_max: 9, is_required: true, icon: "💳" },
  { title: "购买机票", title_en: "Book flights", description: "建议在签证获批后再购买机票（除非可退改）。航班选择方面，考虑直飞/转机、行李额度、到达时间。提前 1-2 个月预订通常价格较优。", description_en: "Book flights after visa approval (unless fully refundable). Consider direct vs. connecting flights, baggage allowance, and arrival time. Book 1-2 months ahead for better prices.", phase: "pre_departure", phase_order: 4, category: "travel", month_min: 7, month_max: 9, is_required: false, icon: "✈️" },
  { title: "预约接机服务", title_en: "Book airport transfer", description: "部分大学和宿舍提供免费或付费接机服务。也可提前预约出租车或使用 Uber。确认接机时间和集合地点，提前告知航班信息。", description_en: "Many universities and accommodation providers offer free or paid airport transfers. Pre-book taxis or Uber. Confirm pickup time, location, and provide flight details.", phase: "pre_departure", phase_order: 4, category: "travel", month_min: 8, month_max: 9, is_required: false, icon: "🚗" },
  { title: "整理行李与出发前清单", title_en: "Pack and prepare departure checklist", description: "整理重要文件（护照、签证、CAS、肺结核证明、学历证明、雅思成绩单、住宿确认函）。准备日常生活用品，注意航空公司行李限额（通常 23-32kg）。", description_en: "Organize key documents (passport, visa, CAS, TB certificate, degree documents, IELTS, accommodation confirmation). Pack essentials, noting airline weight limits (usually 23-32kg).", phase: "pre_departure", phase_order: 4, category: "travel", month_min: 8, month_max: 9, is_required: false, icon: "🧳" },

  // Phase 5: 抵达与注册
  { title: "抵达英国", title_en: "Arrive in the UK", description: "可在课程开始前 1 个月内入境英国。建议提前 2-3 天到达以安顿和倒时差。抵达后第一时间确认住宿入住、网络开通等事宜。", description_en: "You can arrive up to 1 month before your course starts. Arrive 2-3 days early to settle in and adjust to the timezone.", phase: "arrival", phase_order: 5, category: "travel", month_min: 9, month_max: 9, is_required: true, icon: "🛬" },
  { title: "大学注册与入学报到", title_en: "University registration", description: "完成线上注册和线下报到（通常需出示护照、签证、CAS、肺结核证明）。参加新生周（Welcome Week）活动，熟悉校园和同学。", description_en: "Complete online registration and in-person enrollment (passport, visa, CAS, TB certificate required). Attend Welcome Week to familiarise yourself with campus.", phase: "arrival", phase_order: 5, category: "registration", month_min: 9, month_max: 9, is_required: true, icon: "🏫" },
  { title: "银行开户", title_en: "Open a UK bank account", description: "到校后尽快开设英国银行账户（如 Barclays、HSBC、Monzo、Starling）。通常需要护照、签证、地址证明（宿舍合同或租赁协议）。", description_en: "Open a UK bank account as soon as possible (Barclays, HSBC, Monzo, Starling). Requirements: passport, visa, proof of address (accommodation contract or tenancy agreement).", phase: "arrival", phase_order: 5, category: "finance", month_min: 9, month_max: 10, is_required: true, icon: "🏦" },
  { title: "GP（全科医生）注册", title_en: "Register with a GP (General Practitioner)", description: "抵达后尽快注册 NHS 全科医生。缴纳 IHS 后可在 NHS 系统享受医疗服务。需要准备护照、签证、地址证明。", description_en: "Register with an NHS GP upon arrival. Having paid the IHS entitles you to NHS healthcare. Prepare passport, visa, and proof of address.", phase: "arrival", phase_order: 5, category: "health", month_min: 9, month_max: 10, is_required: true, icon: "🏥" },
  { title: "熟悉校园与城市", title_en: "Settle in and explore", description: "参加新生周活动，熟悉校园设施、图书馆、教学楼位置。了解城市交通（公交、地铁、自行车）、超市位置、银行网点等生活信息。", description_en: "Attend Welcome Week events. Familiarise yourself with campus facilities, libraries, and buildings. Learn about local transport, supermarkets, and banks.", phase: "arrival", phase_order: 5, category: "other", month_min: 9, month_max: 10, is_required: false, icon: "🗺️" },
];

// ─── Seed Runner ─────────────────────────────────────────────────────
async function main() {
  console.log("Seeding database (canonical schema v0.1)...\n");

  // Users
  console.log("--- Users ---");
  await seedUsers();
  console.log("");

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

  // Timeline events
  let timelineCount = 0;
  for (const event of TIMELINE_EVENTS) {
    const existing = await prisma.timelineEvent.findFirst({
      where: { title: event.title },
    });
    if (!existing) {
      await prisma.timelineEvent.create({ data: event });
      timelineCount++;
    }
  }
  if (timelineCount > 0) {
    console.log(`✓ ${timelineCount} timeline events seeded`);
  } else {
    console.log("✓ Timeline events already exist, skipping");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
