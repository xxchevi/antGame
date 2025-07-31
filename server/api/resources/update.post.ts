import { PrismaClient } from '@prisma/client'
import { createError, defineEventHandler, readBody } from 'h3'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { colonyId, resourceType, amount } = body

  if (!colonyId || !resourceType || amount === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields'
    })
  }

  try {
    // 查找现有资源记录
    const existingResource = await prisma.resource.findFirst({
      where: {
        colonyId,
        type: resourceType
      }
    })

    let updatedResource
    if (existingResource) {
      // 更新现有资源
      updatedResource = await prisma.resource.update({
        where: { id: existingResource.id },
        data: {
          amount: Math.max(0, Math.min(existingResource.capacity, existingResource.amount + amount))
        }
      })
    } else {
      // 创建新资源记录
      updatedResource = await prisma.resource.create({
        data: {
          colonyId,
          type: resourceType,
          amount: Math.max(0, amount),
          capacity: 1000 // 默认容量
        }
      })
    }

    return updatedResource
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update resource'
    })
  }
})