import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { action, colonyId, resourceType, amount } = body

    if (!colonyId || !action) {
      return {
        success: false,
        message: '缺少必要参数：colonyId 和 action'
      }
    }

    // 检查殖民地是否存在
    const colony = await prisma.colony.findUnique({
      where: { id: colonyId },
      include: {
        resources: true
      }
    })

    if (!colony) {
      return {
        success: false,
        message: '殖民地不存在'
      }
    }

    switch (action) {
      case 'add': {
        if (!resourceType || !amount || amount <= 0) {
          return {
            success: false,
            message: '缺少必要参数：resourceType 和 amount'
          }
        }

        // 查找现有资源
        const existingResource = await prisma.resource.findFirst({
          where: {
            colonyId,
            type: resourceType.toUpperCase()
          }
        })

        if (existingResource) {
          // 更新现有资源
          await prisma.resource.update({
            where: { id: existingResource.id },
            data: {
              amount: existingResource.amount + amount
            }
          })
        } else {
          // 创建新资源
          await prisma.resource.create({
            data: {
              type: resourceType.toUpperCase(),
              amount,
              capacity: amount * 2, // 默认容量为添加量的2倍
              colonyId
            }
          })
        }

        return {
          success: true,
          message: `成功添加 ${amount} ${resourceType}`,
          data: { resourceType, amount }
        }
      }

      case 'list': {
        return {
          success: true,
          data: { resources: colony.resources }
        }
      }

      default:
        return {
          success: false,
          message: '无效的操作类型'
        }
    }
  } catch (error) {
    console.error('Resource management failed:', error)
    return {
      success: false,
      message: '资源管理失败',
      error: error.message
    }
  }
})