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
    // ── 管理员 ──
    {
      email: "admin@engimatch.com",
      password: "EngiMatch2026",
      name: "陈管理员",
      role: "SUPER_ADMIN",
      status: "APPROVED",
    },

    // ── 老师 / 顾问（STAFF）──
    {
      email: "zhang.wei@engimatch.com",
      password: "EngiMatch2026",
      name: "张伟",
      role: "STAFF",
      status: "APPROVED",
    },
    {
      email: "li.na@engimatch.com",
      password: "EngiMatch2026",
      name: "李娜",
      role: "STAFF",
      status: "APPROVED",
    },
    {
      email: "wang.qiang@engimatch.com",
      password: "EngiMatch2026",
      name: "王强",
      role: "STAFF",
      status: "PENDING",
    },
    {
      email: "chen.jing@engimatch.com",
      password: "EngiMatch2026",
      name: "陈静",
      role: "STAFF",
      status: "APPROVED",
    },
    {
      email: "liu.fang@engimatch.com",
      password: "EngiMatch2026",
      name: "刘芳",
      role: "STAFF",
      status: "PENDING",
    },

    // ── 国内学生（两字+三字名）──
    {
      email: "liu.yang2022@bjtu.edu.cn",
      password: "EngiMatch2026",
      name: "刘洋",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "zhao.min2021@tongji.edu.cn",
      password: "EngiMatch2026",
      name: "赵敏",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "sun.jie2022@hust.edu.cn",
      password: "EngiMatch2026",
      name: "孙杰",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "zhou.fang2021@zju.edu.cn",
      password: "EngiMatch2026",
      name: "周芳",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "wu.lei2022@seu.edu.cn",
      password: "EngiMatch2026",
      name: "吴磊",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "zheng.li2021@xjtu.edu.cn",
      password: "EngiMatch2026",
      name: "郑丽",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "huang.tao2022@tju.edu.cn",
      password: "EngiMatch2026",
      name: "黄涛",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "he.juan2021@dlut.edu.cn",
      password: "EngiMatch2026",
      name: "何娟",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "lin.hao2022@uestc.edu.cn",
      password: "EngiMatch2026",
      name: "林浩",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "xie.xin2021@ecust.edu.cn",
      password: "EngiMatch2026",
      name: "谢欣",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "yang.bo2020@hit.edu.cn",
      password: "EngiMatch2026",
      name: "杨波",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "cheng.yue2022@nwpu.edu.cn",
      password: "EngiMatch2026",
      name: "程悦",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "tang.wei2021@scut.edu.cn",
      password: "EngiMatch2026",
      name: "唐伟",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "pan.shuang2023@csu.edu.cn",
      password: "EngiMatch2026",
      name: "潘爽",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "xiao.peng2020@bit.edu.cn",
      password: "EngiMatch2026",
      name: "肖鹏",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "cao.xue2022@nuaa.edu.cn",
      password: "EngiMatch2026",
      name: "曹雪",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "dong.hui2021@cqu.edu.cn",
      password: "EngiMatch2026",
      name: "董慧",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "han.yu2023@nwpu.edu.cn",
      password: "EngiMatch2026",
      name: "韩宇",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "luo.nan2020@sdu.edu.cn",
      password: "EngiMatch2026",
      name: "罗楠",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "deng.fei2022@npu.edu.cn",
      password: "EngiMatch2026",
      name: "邓飞",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "ma.ling2021@uestc.edu.cn",
      password: "EngiMatch2026",
      name: "马玲",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "xiong.jun2023@hust.edu.cn",
      password: "EngiMatch2026",
      name: "熊俊",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "feng.ying2020@tongji.edu.cn",
      password: "EngiMatch2026",
      name: "冯颖",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "yan.zhe2022@dlut.edu.cn",
      password: "EngiMatch2026",
      name: "严哲",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "jiang.tao2021@zju.edu.cn",
      password: "EngiMatch2026",
      name: "姜涛",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "lei.qi2023@seu.edu.cn",
      password: "EngiMatch2026",
      name: "雷琪",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "qian.rui2020@xjtu.edu.cn",
      password: "EngiMatch2026",
      name: "钱睿",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "guo.xin2022@tju.edu.cn",
      password: "EngiMatch2026",
      name: "郭鑫",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "qiu.lan2021@ecust.edu.cn",
      password: "EngiMatch2026",
      name: "邱兰",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "shi.peng2023@bjtu.edu.cn",
      password: "EngiMatch2026",
      name: "施鹏",
      role: "STUDENT",
      status: "APPROVED",
    },

    // ── 国际学生 / 三字中文名 ──
    {
      email: "james.chen2022@umich.edu",
      password: "EngiMatch2026",
      name: "James Chen",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "priya.sharma2021@iitb.ac.in",
      password: "EngiMatch2026",
      name: "Priya Sharma",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "kim.minjae2023@snu.ac.kr",
      password: "EngiMatch2026",
      name: "金敏在",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "alexander.mueller2020@tum.de",
      password: "EngiMatch2026",
      name: "Alexander Müller",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "nakamura.yuki2022@tokyo.ac.jp",
      password: "EngiMatch2026",
      name: "中村悠树",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "nguyen.thanh2021@hust.edu.vn",
      password: "EngiMatch2026",
      name: "Nguyen Thanh",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "olivia.wong2023@nus.edu.sg",
      password: "EngiMatch2026",
      name: "Olivia Wong",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "zhang.xiaolong2020@hust.edu.cn",
      password: "EngiMatch2026",
      name: "张小龙",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "li.siwei2022@zju.edu.cn",
      password: "EngiMatch2026",
      name: "李思薇",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "wang.zixuan2021@seu.edu.cn",
      password: "EngiMatch2026",
      name: "王子轩",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "chen.jiayu2023@tongji.edu.cn",
      password: "EngiMatch2026",
      name: "陈嘉宇",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "liu.yaqi2020@dlut.edu.cn",
      password: "EngiMatch2026",
      name: "刘雅琪",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "zhao.yuchen2022@xjtu.edu.cn",
      password: "EngiMatch2026",
      name: "赵雨辰",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "sun.yitong2021@npu.edu.cn",
      password: "EngiMatch2026",
      name: "孙艺桐",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "zhou.jiayang2023@bit.edu.cn",
      password: "EngiMatch2026",
      name: "周嘉扬",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "emma.thompson2022@bristol.ac.uk",
      password: "EngiMatch2026",
      name: "Emma Thompson",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "raj.patel2021@warwick.ac.uk",
      password: "EngiMatch2026",
      name: "Raj Patel",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "satou.haruka2020@kyoto.ac.jp",
      password: "EngiMatch2026",
      name: "佐藤遥香",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "park.junho2023@kaist.ac.kr",
      password: "EngiMatch2026",
      name: "朴俊昊",
      role: "STUDENT",
      status: "APPROVED",
    },
    {
      email: "marco.rossi2022@polimi.it",
      password: "EngiMatch2026",
      name: "Marco Rossi",
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
