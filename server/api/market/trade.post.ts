import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 资源基础价格配置（以食物为基础货币）
const RESOURCE_BASE_PRICES = {
  WATER: 2,      // 1水源 = 2食物
  MINERAL: 3,    // 1矿物 = 3食物
  HONEYDEW: 5,   // 1蜜露 = 5食物
  FUNGUS: 4      // 1真菌 = 4食物
}

// 市场价格波动范围
const PRICE_FLUCTUATION = 0.3 // ±30%

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { action, colonyId, itemId, resourceType, quantity, price } = body

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
        resources: true,
        player: true
      }
    })

    if (!colony) {
      return {
        success: false,
        message: '殖民地不存在'
      }
    }

    switch (action) {
      case 'sell': {
        if (!resourceType || !quantity || quantity <= 0) {
          return {
            success: false,
            message: '缺少必要参数：resourceType 和 quantity'
          }
        }

        // 检查是否有足够的资源
        const resource = colony.resources.find(r => r.type === resourceType.toUpperCase())
        if (!resource || resource.amount < quantity) {
          return {
            success: false,
            message: `资源不足：需要 ${quantity} ${resourceType}，当前只有 ${resource?.amount || 0}`
          }
        }

        // 计算市场价格（如果没有指定价格）
        let sellPrice = price
        if (!sellPrice) {
          const basePrice = RESOURCE_BASE_PRICES[resourceType.toUpperCase()] || 1
          const fluctuation = (Math.random() - 0.5) * 2 * PRICE_FLUCTUATION
          sellPrice = Math.max(1, Math.floor(basePrice * (1 + fluctuation)))
        }

        // 扣除资源
        await prisma.resource.updateMany({
          where: {
            colonyId,
            type: resourceType.toUpperCase()
          },
          data: {
            amount: {
              decrement: quantity
            }
          }
        })

        // 创建市场物品
        const marketItem = await prisma.marketItem.create({
          data: {
            resourceType: resourceType.toUpperCase(),
            quantity,
            price: sellPrice,
            sellerId: colony.playerId,
            status: 'AVAILABLE'
          }
        })

        // 记录交易事件
        await prisma.gameEvent.create({
          data: {
            colonyId,
            type: 'MARKET_SELL',
            title: '资源上架',
            description: `上架了 ${quantity} ${resourceType}，单价 ${sellPrice} 食物`,
            impact: JSON.stringify({ resourceType, quantity, price: sellPrice })
          }
        })

        return {
          success: true,
          message: '资源上架成功',
          data: { marketItem }
        }
      }

      case 'buy': {
        if (!itemId) {
          return {
            success: false,
            message: '缺少市场物品ID'
          }
        }

        // 查找市场物品
        const marketItem = await prisma.marketItem.findUnique({
          where: { id: itemId }
        })

        if (!marketItem || marketItem.status !== 'AVAILABLE') {
          return {
            success: false,
            message: '市场物品不存在或已售出'
          }
        }

        // 不能购买自己的物品
        if (marketItem.sellerId === colony.playerId) {
          return {
            success: false,
            message: '不能购买自己的物品'
          }
        }

        const totalCost = marketItem.price * marketItem.quantity

        // 检查食物是否足够
        const foodResource = colony.resources.find(r => r.type === 'FOOD')
        if (!foodResource || foodResource.amount < totalCost) {
          return {
            success: false,
            message: `食物不足：需要 ${totalCost} 食物，当前只有 ${foodResource?.amount || 0}`
          }
        }

        // 扣除食物
        await prisma.resource.updateMany({
          where: {
            colonyId,
            type: 'FOOD'
          },
          data: {
            amount: {
              decrement: totalCost
            }
          }
        })

        // 增加购买的资源
        await prisma.resource.upsert({
          where: {
            colonyId_type: {
              colonyId,
              type: marketItem.resourceType
            }
          },
          update: {
            amount: {
              increment: marketItem.quantity
            }
          },
          create: {
            type: marketItem.resourceType,
            amount: marketItem.quantity,
            colonyId
          }
        })

        // 给卖家增加食物收入
        const sellerColony = await prisma.colony.findFirst({
          where: { playerId: marketItem.sellerId }
        })

        if (sellerColony) {
          await prisma.resource.upsert({
            where: {
              colonyId_type: {
                colonyId: sellerColony.id,
                type: 'FOOD'
              }
            },
            update: {
              amount: {
                increment: totalCost
              }
            },
            create: {
              type: 'FOOD',
              amount: totalCost,
              colonyId: sellerColony.id
            }
          })

          // 给卖家记录销售事件
          await prisma.gameEvent.create({
            data: {
              colonyId: sellerColony.id,
              type: 'MARKET_SOLD',
              title: '资源售出',
              description: `售出了 ${marketItem.quantity} ${marketItem.resourceType}，获得 ${totalCost} 食物`,
              impact: JSON.stringify({ resourceType: marketItem.resourceType, quantity: marketItem.quantity, income: totalCost })
            }
          })
        }

        // 更新市场物品状态
        await prisma.marketItem.update({
          where: { id: itemId },
          data: {
            status: 'SOLD',
            buyerId: colony.playerId
          }
        })

        // 记录购买事件
        await prisma.gameEvent.create({
          data: {
            colonyId,
            type: 'MARKET_BUY',
            title: '资源购买',
            description: `购买了 ${marketItem.quantity} ${marketItem.resourceType}，花费 ${totalCost} 食物`,
            impact: JSON.stringify({ resourceType: marketItem.resourceType, quantity: marketItem.quantity, cost: totalCost })
          }
        })

        return {
          success: true,
          message: '购买成功',
          data: {
            item: marketItem,
            totalCost
          }
        }
      }

      case 'list': {
        // 获取市场物品列表
        const marketItems = await prisma.marketItem.findMany({
          where: {
            status: 'AVAILABLE'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 50 // 限制返回数量
        })

        // 获取当前市场价格
        const currentPrices = {}
        for (const [resourceType, basePrice] of Object.entries(RESOURCE_BASE_PRICES)) {
          const fluctuation = (Math.random() - 0.5) * 2 * PRICE_FLUCTUATION
          currentPrices[resourceType] = Math.max(1, Math.floor(basePrice * (1 + fluctuation)))
        }

        return {
          success: true,
          data: {
            marketItems,
            currentPrices,
            basePrices: RESOURCE_BASE_PRICES
          }
        }
      }

      case 'my_items': {
        // 获取玩家的市场物品
        const myItems = await prisma.marketItem.findMany({
          where: {
            sellerId: colony.playerId
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        return {
          success: true,
          data: { myItems }
        }
      }

      case 'cancel': {
        if (!itemId) {
          return {
            success: false,
            message: '缺少市场物品ID'
          }
        }

        const marketItem = await prisma.marketItem.findUnique({
          where: { id: itemId }
        })

        if (!marketItem || marketItem.sellerId !== colony.playerId) {
          return {
            success: false,
            message: '市场物品不存在或不属于您'
          }
        }

        if (marketItem.status !== 'AVAILABLE') {
          return {
            success: false,
            message: '物品已售出，无法取消'
          }
        }

        // 退还资源
        await prisma.resource.upsert({
          where: {
            colonyId_type: {
              colonyId,
              type: marketItem.resourceType
            }
          },
          update: {
            amount: {
              increment: marketItem.quantity
            }
          },
          create: {
            type: marketItem.resourceType,
            amount: marketItem.quantity,
            colonyId
          }
        })

        // 删除市场物品
        await prisma.marketItem.delete({
          where: { id: itemId }
        })

        return {
          success: true,
          message: '取消上架成功，资源已退还'
        }
      }

      default:
        return {
          success: false,
          message: '无效的操作类型'
        }
    }
  } catch (error) {
    console.error('Market trade failed:', error)
    return {
      success: false,
      message: '交易操作失败',
      error: error.message
    }
  }
})

// 定期清理过期的市场物品（可以通过定时任务调用）
export async function cleanupExpiredItems() {
  try {
    const expiredTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7天前
    
    const expiredItems = await prisma.marketItem.findMany({
      where: {
        status: 'AVAILABLE',
        createdAt: {
          lt: expiredTime
        }
      }
    })

    // 退还过期物品的资源
    for (const item of expiredItems) {
      const sellerColony = await prisma.colony.findFirst({
        where: { playerId: item.sellerId }
      })

      if (sellerColony) {
        await prisma.resource.upsert({
          where: {
            colonyId_type: {
              colonyId: sellerColony.id,
              type: item.resourceType
            }
          },
          update: {
            amount: {
              increment: item.quantity
            }
          },
          create: {
            type: item.resourceType,
            amount: item.quantity,
            colonyId: sellerColony.id
          }
        })
      }
    }

    // 标记为过期
    await prisma.marketItem.updateMany({
      where: {
        status: 'AVAILABLE',
        createdAt: {
          lt: expiredTime
        }
      },
      data: {
        status: 'EXPIRED'
      }
    })

    return expiredItems.length
  } catch (error) {
    console.error('Cleanup expired items failed:', error)
    return 0
  }
}