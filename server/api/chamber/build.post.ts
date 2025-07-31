import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 房间类型配置
const CHAMBER_CONFIGS = {
  // 核心层 (layer -1) - 只能建蚁后宫殿
  QUEEN_PALACE: { layer: -1, baseCost: { mineral: 200, honeydew: 100 }, baseCapacity: 300, description: '蚁后宫殿，提升繁殖效率' },
  
  // 浅层 (layer 0) - 只能建真菌园
  FUNGUS_GARDEN: { layer: 0, baseCost: { water: 100, mineral: 80 }, baseCapacity: 160, description: '真菌园，培养特殊资源' },
  
  // 第1层 (layer 1) - 只能建储藏室
  STORAGE: { layer: 1, baseCost: { mineral: 80, food: 30 }, baseCapacity: 200, description: '储藏室，存储资源' },
  
  // 中层 (layer 2) - 只能建资源加工室
  RESOURCE_PROCESSING: { layer: 2, baseCost: { mineral: 150, fungus: 80 }, baseCapacity: 180, description: '资源加工室，转换资源' },
  
  // 深层 (layer 3) - 只能建育婴室
  NURSERY: { layer: 3, baseCost: { food: 100, water: 50 }, baseCapacity: 150, description: '育婴室，培育幼虫' }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { colonyId, chamberType, layer } = body

    if (!colonyId || !chamberType) {
      return {
        success: false,
        message: '缺少必要参数：colonyId 和 chamberType'
      }
    }

    // 验证房间类型
    const config = CHAMBER_CONFIGS[chamberType]
    if (!config) {
      return {
        success: false,
        message: '无效的房间类型'
      }
    }

    // 验证层级
    if (layer !== undefined && layer !== config.layer) {
      return {
        success: false,
        message: `${chamberType} 只能建在第 ${config.layer} 层`
      }
    }

    // 检查殖民地是否存在
    const colony = await prisma.colony.findUnique({
      where: { id: colonyId },
      include: {
        resources: true,
        chambers: true
      }
    })

    if (!colony) {
      return {
        success: false,
        message: '殖民地不存在'
      }
    }

    // 检查是否已有相同类型的房间（某些房间类型唯一）
    const uniqueTypes = ['ENTRANCE', 'QUEEN_PALACE']
    if (uniqueTypes.includes(chamberType)) {
      const existingChamber = colony.chambers.find(c => c.type === chamberType)
      if (existingChamber) {
        return {
          success: false,
          message: `${chamberType} 在每个殖民地只能有一个`
        }
      }
    }

    // 检查资源是否足够
    const resourceMap = colony.resources.reduce((map, r) => {
      map[r.type.toLowerCase()] = r.amount
      return map
    }, {})

    for (const [resourceType, cost] of Object.entries(config.baseCost)) {
      const available = resourceMap[resourceType] || 0
      if (available < cost) {
        return {
          success: false,
          message: `资源不足：需要 ${cost} ${resourceType}，当前只有 ${available}`
        }
      }
    }

    // 扣除建造成本
    for (const [resourceType, cost] of Object.entries(config.baseCost)) {
      await prisma.resource.updateMany({
        where: {
          colonyId,
          type: resourceType.toUpperCase()
        },
        data: {
          amount: {
            decrement: cost
          }
        }
      })
    }

    // 创建房间
    const chamber = await prisma.chamber.create({
      data: {
        type: chamberType,
        level: 1,
        layer: config.layer,
        capacity: config.baseCapacity,
        efficiency: 1.0,
        colonyId
      }
    })

    // 记录建造事件
    await prisma.gameEvent.create({
      data: {
        colonyId,
        type: 'CHAMBER_BUILT',
        title: '房间建造完成',
        description: `成功建造了 ${config.description}`,
        impact: JSON.stringify({ chamberType, layer: config.layer })
      }
    })

    // 更新殖民地统计
    await prisma.colonyStats.upsert({
      where: { colonyId },
      update: {
        lastUpdated: new Date()
      },
      create: {
        colonyId,
        totalAnts: 0,
        totalResources: 0,
        defenseRating: chamberType === 'DEFENSE' ? 10 : 0,
        productionRate: 1.0,
        explorationArea: 1
      }
    })

    return {
      success: true,
      message: '房间建造成功',
      data: {
        chamber,
        costPaid: config.baseCost
      }
    }
  } catch (error) {
    console.error('Chamber build failed:', error)
    return {
      success: false,
      message: '房间建造失败',
      error: error.message
    }
  }
})