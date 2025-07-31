import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 蚂蚁类型配置
const ANT_TYPES = {
  WORKER: {
    name: '工蚁',
    eggCost: { FOOD: 20, WATER: 10 },
    baseStats: { health: 80, energy: 100, efficiency: 1.0 }
  },
  SOLDIER: {
    name: '兵蚁',
    eggCost: { FOOD: 40, WATER: 20, MINERAL: 10 },
    baseStats: { health: 150, energy: 120, efficiency: 1.2 }
  },
  SCOUT: {
    name: '侦察蚁',
    eggCost: { FOOD: 30, WATER: 15, HONEYDEW: 5 },
    baseStats: { health: 60, energy: 150, efficiency: 1.5 }
  }
}

// 资源生产配置
const PRODUCTION_CONFIGS = {
  STORAGE: {
    baseProduction: {},
    levelBonus: {}
  },
  RESOURCE_PROCESSING: {
    baseProduction: { FOOD: 2, WATER: 3, MINERAL: 1 },
    levelBonus: { FOOD: 0.5, WATER: 0.5, MINERAL: 0.3 }
  },
  FUNGUS_GARDEN: {
    baseProduction: { FUNGUS: 0.3, HONEYDEW: 0.2 },
    levelBonus: { FUNGUS: 0.2, HONEYDEW: 0.1 }
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { action, colonyId } = body

    // 验证用户身份
    const token = getCookie(event, 'auth-token')
    if (!token) {
      return { success: false, message: '请先登录' }
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const playerId = decoded.playerId

    // 验证殖民地所有权
    const colony = await prisma.colony.findUnique({
      where: { id: colonyId },
      include: {
        resources: true,
        chambers: true,
        ants: true
      }
    })

    if (!colony || colony.playerId !== playerId) {
      return { success: false, message: '无效的殖民地' }
    }

    switch (action) {
      case 'auto_process':
        return await processAutomation(colony)
      default:
        return { success: false, message: '无效的操作' }
    }
  } catch (error) {
    console.error('Automation process failed:', error)
    return { success: false, message: '自动化处理失败' }
  }
})

async function processAutomation(colony: any) {
  const results = {
    resourcesProduced: {},
    eggsLaid: 0,
    messages: []
  }

  // 1. 自动资源生产
  await processResourceProduction(colony, results)

  // 2. 自动产卵
  await processAutoEggLaying(colony, results)

  return {
    success: true,
    data: results
  }
}

async function processResourceProduction(colony: any, results: any) {
  const resourceUpdates = {}
  
  // 计算每种资源的生产量
  for (const chamber of colony.chambers) {
    const config = PRODUCTION_CONFIGS[chamber.type]
    if (!config) continue

    // 基础生产 + 等级加成
    for (const [resourceType, baseAmount] of Object.entries(config.baseProduction)) {
      const levelBonus = (config.levelBonus[resourceType] || 0) * chamber.level
      const totalProduction = (baseAmount as number) + levelBonus
      
      if (!resourceUpdates[resourceType]) {
        resourceUpdates[resourceType] = 0
      }
      resourceUpdates[resourceType] += totalProduction
    }
  }

  // 蚂蚁工作加成
  const workingAnts = colony.ants.filter((ant: any) => ant.status === 'WORKING')
  for (const ant of workingAnts) {
    if (ant.workType === 'RESOURCE_GATHERING') {
      const efficiency = ANT_TYPES[ant.type]?.baseStats.efficiency || 1.0
      resourceUpdates['FOOD'] = (resourceUpdates['FOOD'] || 0) + (0.3 * efficiency)
      resourceUpdates['WATER'] = (resourceUpdates['WATER'] || 0) + (0.2 * efficiency)
      resourceUpdates['MINERAL'] = (resourceUpdates['MINERAL'] || 0) + (0.1 * efficiency)
    }
  }

  // 更新资源
  for (const [resourceType, amount] of Object.entries(resourceUpdates)) {
    if ((amount as number) > 0) {
      await prisma.resource.upsert({
        where: {
          colonyId_type: {
            colonyId: colony.id,
            type: resourceType
          }
        },
        update: {
          amount: {
            increment: Math.floor(amount as number)
          }
        },
        create: {
          colonyId: colony.id,
          type: resourceType,
          amount: Math.floor(amount as number)
        }
      })
      
      results.resourcesProduced[resourceType] = Math.floor(amount as number)
    }
  }
}

async function processAutoEggLaying(colony: any, results: any) {
  // 检查是否有蚁后和蚁后宫殿
  const queen = colony.ants.find((ant: any) => ant.type === 'QUEEN')
  const queenPalace = colony.chambers.find((chamber: any) => chamber.type === 'QUEEN_PALACE')
  const nursery = colony.chambers.find((chamber: any) => chamber.type === 'NURSERY')
  
  if (!queen || !queenPalace || !nursery) {
    return
  }

  // 检查育婴室容量
  const currentEggs = await prisma.ant.count({
    where: {
      colonyId: colony.id,
      status: 'EGG'
    }
  })

  const maxEggs = nursery.level * 5 + 10 // 基础10个 + 每级5个
  if (currentEggs >= maxEggs) {
    results.messages.push('育婴室已满，无法产卵')
    return
  }

  // 检查产卵间隔（这里简化处理，实际应该检查上次产卵时间）
  const eggProductionInterval = Math.max(60, 300 - queenPalace.level * 30)
  
  // 优先产工蚁
  const antType = 'WORKER'
  const eggCost = ANT_TYPES[antType].eggCost
  
  // 检查资源是否足够
  let canLayEgg = true
  for (const [resourceType, cost] of Object.entries(eggCost)) {
    const resource = colony.resources.find((r: any) => r.type === resourceType)
    if (!resource || resource.amount < cost) {
      canLayEgg = false
      break
    }
  }

  if (canLayEgg) {
    // 扣除资源
    for (const [resourceType, cost] of Object.entries(eggCost)) {
      await prisma.resource.update({
        where: {
          colonyId_type: {
            colonyId: colony.id,
            type: resourceType
          }
        },
        data: {
          amount: {
            decrement: cost
          }
        }
      })
    }

    // 创建蚂蚁卵
    await prisma.ant.create({
      data: {
        colonyId: colony.id,
        type: antType,
        status: 'EGG',
        health: ANT_TYPES[antType].baseStats.health,
        energy: ANT_TYPES[antType].baseStats.energy,
        layTime: new Date()
      }
    })

    results.eggsLaid = 1
    results.messages.push(`自动产卵成功：${ANT_TYPES[antType].name}卵`)
  } else {
    results.messages.push('资源不足，无法自动产卵')
  }
}