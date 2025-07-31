import { defineEventHandler, getQuery } from 'h3'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export default defineEventHandler(async (event) => {
  try {
    // 验证用户身份
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        statusMessage: '未授权访问'
      })
    }

    const token = authHeader.substring(7)
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any
    } catch (error) {
      throw createError({
        statusCode: 401,
        statusMessage: '无效的访问令牌'
      })
    }

    const playerId = decoded.playerId

    // 获取玩家的殖民地
    const colony = await prisma.colony.findFirst({
      where: { playerId },
      include: {
        player: {
          include: {
            achievements: {
              include: {
                achievement: true
              }
            }
          }
        }
      }
    })

    if (!colony) {
      throw createError({
        statusCode: 404,
        statusMessage: '未找到殖民地'
      })
    }

    // 获取所有成就
    const allAchievements = await prisma.achievement.findMany()
    
    // 构建成就数据，包含完成状态
    const achievements = allAchievements.map(achievement => {
      const playerAchievement = colony.player.achievements.find(
        pa => pa.achievementId === achievement.id
      )
      
      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        reward: achievement.reward,
        completed: !!playerAchievement?.completed,
        progress: playerAchievement?.progress || 0,
        target: achievement.target || 1,
        completedAt: playerAchievement?.completedAt
      }
    })

    return {
      success: true,
      achievements
    }
  } catch (error) {
    console.error('获取成就失败:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '服务器内部错误'
    })
  }
})