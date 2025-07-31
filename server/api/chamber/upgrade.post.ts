import { PrismaClient } from '@prisma/client'
import { createError, defineEventHandler, readBody } from 'h3'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { chamberId, colonyId } = body

  if (!chamberId || !colonyId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Chamber ID and Colony ID are required'
    })
  }

  try {
    // 检查房间是否存在
    const chamber = await prisma.chamber.findUnique({
      where: { id: chamberId }
    })

    if (!chamber || chamber.colonyId !== colonyId) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Chamber not found'
      })
    }

    // 计算升级成本
    const upgradeCost = {
      FOOD: chamber.level * 100,
      MINERAL: chamber.level * 50
    }

    // 检查资源是否足够
    const resources = await prisma.resource.findMany({
      where: {
        colonyId,
        type: { in: ['FOOD', 'MINERAL'] }
      }
    })

    const foodResource = resources.find(r => r.type === 'FOOD')
    const mineralResource = resources.find(r => r.type === 'MINERAL')

    if (!foodResource || foodResource.amount < upgradeCost.FOOD ||
        !mineralResource || mineralResource.amount < upgradeCost.MINERAL) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Insufficient resources for upgrade'
      })
    }

    // 执行升级事务
    const result = await prisma.$transaction(async (tx) => {
      // 扣除资源
      await tx.resource.update({
        where: { id: foodResource.id },
        data: { amount: foodResource.amount - upgradeCost.FOOD }
      })

      await tx.resource.update({
        where: { id: mineralResource.id },
        data: { amount: mineralResource.amount - upgradeCost.MINERAL }
      })

      // 升级房间
      const upgradedChamber = await tx.chamber.update({
        where: { id: chamberId },
        data: {
          level: chamber.level + 1,
          capacity: Math.floor(chamber.capacity * 1.5),
          efficiency: chamber.efficiency * 1.1
        }
      })

      return upgradedChamber
    })

    return result
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to upgrade chamber'
    })
  }
})