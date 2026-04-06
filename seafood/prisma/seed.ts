import { PrismaClient, RequirementType, EnglishType, EligibilityStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 创建默认管理员账户 账号admin 密码admin123
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedPassword
    }
  })

  // 示例英国工程硕士项目
  const samplePrograms = [
    {
      universityName: "帝国理工学院",
      programName: "MSc Advanced Mechanical Engineering",
      department: "机械工程系",
      degreeType: "MSc",
      duration: "1年",
      originalSource: "一等学位或二等一学位，机械工程相关背景，GPA最低85%（211/985）/90%（双非），雅思总分6.5，单项不低于6.0，要求先修课程：高等数学、工程力学、材料力学",
      requirements: [
        { type: RequirementType.GPA, minimumValue: 85, description: "211/985院校最低85%，双非最低90%", isMandatory: true },
        { type: RequirementType.IELTS, englishType: EnglishType.IELTS, englishMinimum: { overall: 6.5, listening: 6, reading: 6, writing: 6, speaking: 6 }, description: "雅思总分6.5，单项不低于6.0", isMandatory: true },
        { type: RequirementType.PREREQUISITE_MODULE, requiredSubjects: ["高等数学", "工程力学", "材料力学"], description: "要求先修高等数学、工程力学、材料力学", isMandatory: true }
      ]
    },
    {
      universityName: "伦敦大学学院",
      programName: "MSc Civil Engineering",
      department: "土木与环境工程系",
      degreeType: "MSc",
      duration: "1年",
      originalSource: "二等一学位，土木工程相关背景，GPA最低80%（211/985）/85%（双非），雅思总分7.0，单项不低于6.5，要求先修课程：结构力学、土力学",
      requirements: [
        { type: RequirementType.GPA, minimumValue: 80, description: "211/985院校最低80%，双非最低85%", isMandatory: true },
        { type: RequirementType.IELTS, englishType: EnglishType.IELTS, englishMinimum: { overall: 7.0, listening: 6.5, reading: 6.5, writing: 6.5, speaking: 6.5 }, description: "雅思总分7.0，单项不低于6.5", isMandatory: true },
        { type: RequirementType.PREREQUISITE_MODULE, requiredSubjects: ["结构力学", "土力学"], description: "要求先修结构力学、土力学", isMandatory: true }
      ]
    },
    {
      universityName: "曼彻斯特大学",
      programName: "MSc Electrical and Electronic Engineering",
      department: "电气与电子工程系",
      degreeType: "MSc",
      duration: "1年",
      originalSource: "二等一学位，电子工程相关背景，GPA最低78%（211/985）/83%（双非），雅思总分6.5，单项不低于5.5，要求先修课程：电路原理、信号与系统",
      requirements: [
        { type: RequirementType.GPA, minimumValue: 78, description: "211/985院校最低78%，双非最低83%", isMandatory: true },
        { type: RequirementType.IELTS, englishType: EnglishType.IELTS, englishMinimum: { overall: 6.5, listening: 5.5, reading: 5.5, writing: 5.5, speaking: 5.5 }, description: "雅思总分6.5，单项不低于5.5", isMandatory: true },
        { type: RequirementType.PREREQUISITE_MODULE, requiredSubjects: ["电路原理", "信号与系统"], description: "要求先修电路原理、信号与系统", isMandatory: true }
      ]
    }
  ]

  // 插入示例项目
  for (const programData of samplePrograms) {
    const existing = await prisma.program.findFirst({
      where: {
        universityName: programData.universityName,
        programName: programData.programName
      }
    })
    if (!existing) {
      await prisma.program.create({
        data: {
          universityName: programData.universityName,
          programName: programData.programName,
          department: programData.department,
          degreeType: programData.degreeType,
          duration: programData.duration,
          originalSource: programData.originalSource,
          requirements: {
            create: programData.requirements
          }
        }
      })
    }
  }

  console.log('✅ 种子数据插入完成')
  console.log('默认管理员账号: admin / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
