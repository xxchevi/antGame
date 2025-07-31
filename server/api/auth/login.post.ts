import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { username, password } = body

    // 验证必填字段
    if (!username || !password) {
      return {
        success: false,
        message: '用户名和密码为必填项'
      }
    }

    // 查找用户
    const player = await prisma.player.findUnique({
      where: { username },
      include: {
        colonies: {
          include: {
            resources: true,
            chambers: true,
            ants: true
          }
        }
      }
    })

    if (!player) {
      return {
        success: false,
        message: '用户名或密码错误'
      }
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, player.password)
    if (!isPasswordValid) {
      return {
        success: false,
        message: '用户名或密码错误'
      }
    }

    // 生成JWT token
    const token = jwt.sign(
      { playerId: player.id, username: player.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // 设置cookie
    setCookie(event, 'auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7天
    })

    return {
      success: true,
      message: '登录成功',
      data: {
        player: {
          id: player.id,
          username: player.username,
          nickname: player.nickname,
          email: player.email
        },
        colonies: player.colonies,
        colonyId: player.colonies[0]?.id || null,
        token
      }
    }
  } catch (error) {
    console.error('Login failed:', error)
    return {
      success: false,
      message: '登录失败',
      error: error.message
    }
  }
})