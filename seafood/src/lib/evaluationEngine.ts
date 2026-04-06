import { Program, Requirement, ApplicantProfile, EligibilityStatus } from '@prisma/client'

interface Module {
  name: string
  score: number
  credit: number
}

interface EvaluationResult {
  status: EligibilityStatus
  missingRequirements: string[]
  score: number
}

// 判断院校层级 简化版本：是否是211/985
function isTopUniversity(universityName: string): boolean {
  const topUnis = ['985', '211', '双一流', '清华大学', '北京大学', '复旦大学', '上海交通大学', '浙江大学', '南京大学', '中国科学技术大学', '哈尔滨工业大学', '西安交通大学']
  return topUnis.some(uni => universityName.includes(uni))
}

// 评估单个项目
export function evaluateProgram(
  profile: ApplicantProfile,
  program: Program & { requirements: Requirement[] }
): EvaluationResult {
  const missingRequirements: string[] = []
  let score = 100
  const isTopUni = isTopUniversity(profile.university)

  for (const req of program.requirements) {
    switch (req.type) {
      case 'GPA': {
        const requiredGpa = isTopUni ? req.minimumValue! : (req.minimumValue! + 5) // 双非要求高5分
        if (profile.gpa < requiredGpa) {
          const gap = requiredGpa - profile.gpa
          if (gap <= 3) {
            // 差3分以内算borderline
            missingRequirements.push(`GPA要求${requiredGpa}%，您的${profile.gpa}%，相差较小，有机会尝试`)
            score -= gap * 5
          } else {
            missingRequirements.push(`GPA未达到最低要求${requiredGpa}%，您的成绩为${profile.gpa}%`)
            score -= 20
          }
        }
        break
      }

      case 'IELTS':
      case 'TOEFL':
      case 'PTE': {
        if (profile.englishType !== req.englishType) {
          missingRequirements.push(`需要${req.englishType}成绩，您提交的是${profile.englishType}`)
          score -= 15
          break
        }
        const reqScores = req.englishMinimum as Record<string, number>
        const userScores = profile.englishScores as Record<string, number>
        
        // 检查总分
        if (userScores.overall < reqScores.overall) {
          missingRequirements.push(`${req.englishType}总分要求${reqScores.overall}，您的${userScores.overall}`)
          score -= 10
        }
        // 检查单项
        for (const section of ['listening', 'reading', 'writing', 'speaking']) {
          if (reqScores[section] && userScores[section] < reqScores[section]) {
            missingRequirements.push(`${req.englishType}${section === 'listening' ? '听力' : section === 'reading' ? '阅读' : section === 'writing' ? '写作' : '口语'}要求${reqScores[section]}，您的${userScores[section]}`)
            score -= 5
          }
        }
        break
      }

      case 'PREREQUISITE_MODULE': {
        const userModules = profile.modules as Module[]
        const userModuleNames = userModules.map(m => m.name)
        const missingModules = req.requiredSubjects.filter(subject => 
          !userModuleNames.some(name => name.includes(subject) || subject.includes(name))
        )
        if (missingModules.length > 0) {
          missingRequirements.push(`缺少先修课程：${missingModules.join('、')}`)
          score -= missingModules.length * 10
        }
        break
      }
    }
  }

  // 确定最终状态
  let status: EligibilityStatus
  if (score >= 80 && missingRequirements.every(req => req.includes('有机会尝试'))) {
    status = EligibilityStatus.ELIGIBLE
  } else if (score >= 60) {
    status = EligibilityStatus.BORDERLINE
  } else {
    status = EligibilityStatus.NOT_ELIGIBLE
  }

  return {
    status,
    missingRequirements,
    score: Math.max(0, Math.round(score))
  }
}

// 批量评估所有项目
export async function evaluateAllPrograms(
  profile: ApplicantProfile,
  programs: (Program & { requirements: Requirement[] })[]
) {
  return Promise.all(programs.map(async program => {
    const result = evaluateProgram(profile, program)
    return {
      program,
      ...result
    }
  }))
}
