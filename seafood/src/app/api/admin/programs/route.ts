import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProgramSchema = z.object({
  universityName: z.string().min(1),
  programName: z.string().min(1),
  department: z.string().min(1),
  duration: z.string().min(1),
  originalSource: z.string().min(1),
  requirements: z.array(z.object({
    id: z.number().optional(),
    type: z.enum(['GPA', 'IELTS', 'TOEFL', 'PTE', 'PREREQUISITE_MODULE', 'OTHER']),
    minimumValue: z.number().optional(),
    requiredSubjects: z.array(z.string()).default([]),
    englishType: z.enum(['IELTS', 'TOEFL', 'PTE', 'NONE']).optional(),
    englishMinimum: z.record(z.string(), z.number()).optional(),
    description: z.string().min(1),
    isMandatory: z.boolean().default(true)
  }))
})

// 获取所有项目列表
export async function GET() {
  try {
    const programs = await prisma.program.findMany({
      include: { requirements: true },
      orderBy: { universityName: 'asc' }
    })
    return NextResponse.json({ success: true, programs })
  } catch (error) {
    return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 })
  }
}

// 更新项目信息
export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json()
    const validated = updateProgramSchema.parse(data)

    const updatedProgram = await prisma.program.update({
      where: { id: Number(id) },
      data: {
        ...validated,
        requirements: {
          deleteMany: {},
          create: validated.requirements
        }
      },
      include: { requirements: true }
    })

    return NextResponse.json({ success: true, program: updatedProgram })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 400 })
  }
}
