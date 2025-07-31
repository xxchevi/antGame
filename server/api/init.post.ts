import { PrismaClient } from '@prisma/client'
import { createError, defineEventHandler } from 'h3'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    // 创建测试玩家
    const player = await prisma.player.upsert({
      where: { username: 'testplayer' },
      update: {},
      create: {
        username: 'testplayer',
        email: 'test@example.com'
      }
    })

    // 创建测试殖民地
    const colony = await prisma.colony.upsert({
      where: { id: 'colony1' },
      update: {},
      create: {
        id: 'colony1',
        name: '测试蚂蚁帝国',
        level: 1,
        experience: 0,
        playerId: player.id
      }
    })

    // 创建初始资源
    const resources = [
      { type: 'FOOD', amount: 500, capacity: 1000 },
      { type: 'WATER', amount: 200, capacity: 500 },
      { type: 'MINERAL', amount: 150, capacity: 300 },
      { type: 'HONEYDEW', amount: 20, capacity: 100 },
      { type: 'FUNGUS', amount: 10, capacity: 100 }
    ]

    for (const resource of resources) {
      // 检查是否已存在
      const existingResource = await prisma.resource.findFirst({
        where: {
          colonyId: colony.id,
          type: resource.type
        }
      })
      
      if (!existingResource) {
        await prisma.resource.create({
          data: {
            ...resource,
            colonyId: colony.id
          }
        })
      }
    }

    // 创建初始房间
    await prisma.chamber.upsert({
      where: { id: 'chamber1' },
      update: {},
      create: {
        id: 'chamber1',
        type: 'ENTRANCE',
        level: 1,
        layer: 0,
        capacity: 100,
        efficiency: 1.0,
        colonyId: colony.id
      }
    })

    return {
      success: true,
      message: '数据库初始化成功',
      data: {
        player,
        colony
      }
    }
  } catch (error) {
    console.error('数据库初始化失败:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Database initialization failed'
    })
  }
})