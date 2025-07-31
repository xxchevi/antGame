import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export default defineEventHandler(async (event) => {
  try {
    const token = getCookie(event, 'auth-token') || getHeader(event, 'authorization')?.replace('Bearer ', '')

    if (!token) {
      return {
        success: false,
        message: '未登录'
      }
    }

    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // 查找用户
    const player = await prisma.player.findUnique({
      where: { id: decoded.playerId },
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
        message: '用户不存在'
      }
    }

    return {
      success: true,
      data: {
        player: {
          id: player.id,
          username: player.username,
          nickname: player.nickname,
          email: player.email
        },
        colonies: player.colonies
      }
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    return {
      success: false,
      message: '登录已过期',
      error: error.message
    }
  }
})