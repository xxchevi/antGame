import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 升级成本配置
const UPGRADE_COSTS = {
  QUEEN_PALACE: {
    baseCost: { FOOD: 200, MINERAL: 150, HONEYDEW: 100 },
    multiplier: 1.8
  },
  STORAGE: {
    baseCost: { FOOD: 100, MINERAL: 80, WOOD: 30 },
    multiplier: 1.3
  },
  NURSERY: {
    baseCost: { FOOD: 150, WATER: 100, MINERAL: 60 },
    multiplier: 1.4
  },
  RESOURCE_PROCESSING: {
    baseCost: { MINERAL: 120, FUNGUS: 80, FOOD: 60 },
    multiplier: 1.5
  },
  FUNGUS_GARDEN: {
    baseCost: { WATER: 120, MINERAL: 100, FUNGUS: 50 },
    multiplier: 1.4
  }
}

// 升级效果配置
const UPGRADE_EFFECTS = {
  QUEEN_PALACE: (level: number) => ({
    capacity: 300 + level * 50,
    efficiency: 1.0 + level * 0.1,
    specialBonus: {
      eggProductionInterval: Math.max(60, 300 - level * 30), // 产卵间隔，最少60秒
      queenLevel: level,
      eggProductionRate: 1.0 + level * 0.2,
      royalAura: level >= 3 ? true : false, // 3级解锁皇室光环，提升全巢穴效率
      specialEggChance: level * 0.05, // 每级增加5%特殊蚂蚁产卵几率
      queenHealthBonus: level * 20 // 蚁后生命值加成
    }
  }),
  STORAGE: (level: number) => ({
    capacity: 200 + level * 100,
    efficiency: 1.0 + level * 0.05,
    specialBonus: {
      storageBonus: level * 100, // 每级增加100容量
      preservationRate: 0.95 + level * 0.01, // 资源保存率，减少腐败
      autoSorting: level >= 2 ? true : false, // 2级解锁自动分类
      emergencyReserve: level >= 4 ? level * 50 : 0, // 4级解锁紧急储备
      resourceMultiplier: 1.0 + level * 0.03 // 资源收集加成
    }
  }),
  NURSERY: (level: number) => ({
    capacity: 150 + level * 30,
    efficiency: 1.0 + level * 0.15,
    specialBonus: {
      hatchingTime: Math.max(30, 180 - level * 15), // 孵化时间，最少30秒
      hatchingSpeed: 1.0 + level * 0.25,
      maxEggs: 5 + level * 2, // 最大同时孵化数量
      nurturingBonus: level * 0.1, // 幼虫培育加成
      eliteChance: level >= 3 ? level * 0.02 : 0, // 3级解锁精英蚂蚁孵化几率
      massHatching: level >= 5 ? true : false // 5级解锁批量孵化
    }
  }),
  RESOURCE_PROCESSING: (level: number) => ({
    capacity: 120 + level * 25,
    efficiency: 1.0 + level * 0.12,
    specialBonus: {
      processingSpeed: 1.0 + level * 0.18,
      conversionRate: 0.8 + level * 0.05, // 转换效率
      advancedRecipes: level >= 2 ? true : false, // 2级解锁高级配方
      wasteReduction: level * 0.05, // 废料减少
      qualityBonus: level * 0.08, // 产品质量加成
      autoProcessing: level >= 4 ? true : false // 4级解锁自动加工
    }
  }),
  FUNGUS_GARDEN: (level: number) => ({
    capacity: 100 + level * 20,
    efficiency: 1.0 + level * 0.1,
    specialBonus: {
      fungusProduction: level * 2, // 每小时真菌产量
      growthSpeed: 1.0 + level * 0.15,
      plotCount: 3 + level, // 种植位数量
      rareFungusChance: level * 0.03, // 稀有真菌几率
      symbioticBonus: level >= 3 ? level * 0.1 : 0, // 3级解锁共生加成
      harvestMultiplier: 1.0 + level * 0.12 // 收获倍数
    }
  })
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { chamberId } = body

    // 验证用户身份
    const token = getCookie(event, 'auth-token')
    if (!token) {
      return { success: false, message: '请先登录' }
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const playerId = decoded.playerId

    // 查找房间
    const chamber = await prisma.chamber.findUnique({
      where: { id: chamberId },
      include: {
        colony: {
          include: {
            resources: true
          }
        }
      }
    })

    if (!chamber) {
      return { success: false, message: '房间不存在' }
    }

    // 验证房间所有权
    if (chamber.colony.playerId !== playerId) {
      return { success: false, message: '无权限操作此房间' }
    }

    // 检查是否已达到最大等级
    if (chamber.level >= chamber.maxLevel) {
      return { success: false, message: '房间已达到最大等级' }
    }

    // 计算升级成本
    const costConfig = UPGRADE_COSTS[chamber.type]
    if (!costConfig) {
      return { success: false, message: '此房间类型不支持升级' }
    }

    const nextLevel = chamber.level + 1
    const upgradeCost = {}
    
    for (const [resourceType, baseCost] of Object.entries(costConfig.baseCost)) {
      upgradeCost[resourceType] = Math.floor(baseCost * Math.pow(costConfig.multiplier, chamber.level))
    }

    // 检查资源是否足够
    const resources = chamber.colony.resources
    for (const [resourceType, cost] of Object.entries(upgradeCost)) {
      const resource = resources.find(r => r.type === resourceType)
      if (!resource || resource.amount < cost) {
        return {
          success: false,
          message: `资源不足：需要 ${cost} ${resourceType}，当前只有 ${resource?.amount || 0}`
        }
      }
    }

    // 扣除资源
    for (const [resourceType, cost] of Object.entries(upgradeCost)) {
      await prisma.resource.updateMany({
        where: {
          colonyId: chamber.colonyId,
          type: resourceType
        },
        data: {
          amount: {
            decrement: cost
          }
        }
      })
    }

    // 计算升级后的属性
    const effectConfig = UPGRADE_EFFECTS[chamber.type]
    const newEffects = effectConfig ? effectConfig(nextLevel) : {
      capacity: chamber.capacity + 50,
      efficiency: chamber.efficiency + 0.1
    }

    // 升级房间
    const upgradedChamber = await prisma.chamber.update({
      where: { id: chamberId },
      data: {
        level: nextLevel,
        capacity: newEffects.capacity,
        efficiency: newEffects.efficiency,
        specialBonus: newEffects.specialBonus ? JSON.stringify(newEffects.specialBonus) : chamber.specialBonus
      }
    })

    // 如果是蚁后宫殿升级，同时升级蚁后等级
    if (chamber.type === 'QUEEN_PALACE') {
      await prisma.ant.updateMany({
        where: {
          colonyId: chamber.colonyId,
          type: 'QUEEN'
        },
        data: {
          level: nextLevel
        }
      })
    }

    // 如果是储藏室升级，更新对应资源的容量上限
    if (chamber.type === 'STORAGE') {
      const storageBonus = newEffects.specialBonus?.storageBonus || 0
      await prisma.resource.updateMany({
        where: {
          colonyId: chamber.colonyId,
          type: 'FOOD'
        },
        data: {
          capacity: {
            increment: storageBonus
          }
        }
      })
    }

    return {
      success: true,
      message: `${chamber.type} 升级到 ${nextLevel} 级成功！`,
      data: {
        chamber: upgradedChamber,
        upgradeCost,
        newEffects
      }
    }
  } catch (error) {
    console.error('Chamber upgrade failed:', error)
    return {
      success: false,
      message: '升级失败',
      error: error.message
    }
  }
})