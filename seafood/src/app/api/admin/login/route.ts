import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6)
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = loginSchema.parse(body)

    const admin = await prisma.adminUser.findUnique({
      where: { username }
    })

    if (!admin || !await bcrypt.compare(password, admin.passwordHash)) {
      return NextResponse.json({ success: false, error: '用户名或密码错误' }, { status: 401 })
    }

    // 简单session实现，生产环境建议用next-auth
    return NextResponse.json({
      success: true,
      token: Buffer.from(`${username}:${Date.now()}`).toString('base64')
    })

  } catch (error) {
    return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 })
  }
}
