import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { evaluateAllPrograms } from '@/lib/evaluationEngine'
import { EnglishType } from '@prisma/client'

const profileSchema = z.object({
  gpa: z.coerce.number().min(0).max(100),
  major: z.string().min(1),
  university: z.string().min(1),
  englishType: z.nativeEnum(EnglishType),
  englishScores: z.object({
    overall: z.number(),
    listening: z.number(),
    reading: z.number(),
    writing: z.number(),
    speaking: z.number()
  }),
  modules: z.array(z.object({
    name: z.string(),
    score: z.number(),
    credit: z.number()
  }))
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = profileSchema.parse(body)

    // 保存申请人档案
    const profile = await prisma.applicantProfile.create({
      data: validated
    })

    // 获取所有项目及要求
    const programs = await prisma.program.findMany({
      include: { requirements: true }
    })

    // 评估所有项目
    const evaluationResults = await evaluateAllPrograms(profile, programs)

    // 保存评估结果到数据库
    await Promise.all(evaluationResults.map(async result => {
      await prisma.evaluationResult.create({
        data: {
          profileId: profile.id,
          programId: result.program.id,
          status: result.status,
          missingRequirements: result.missingRequirements,
          score: result.score
        }
      })
    }))

    return NextResponse.json({
      success: true,
      profileId: profile.id,
      results: evaluationResults.map(r => ({
        program: {
          id: r.program.id,
          universityName: r.program.universityName,
          programName: r.program.programName,
          department: r.program.department,
          duration: r.program.duration
        },
        status: r.status,
        score: r.score,
        missingRequirements: r.missingRequirements
      }))
    })

  } catch (error) {
    console.error('Evaluation error:', error)
    return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 })
  }
}
