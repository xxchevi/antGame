import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 真菌类型配置
const FUNGUS_TYPES = {
  BASIC_MUSHROOM: {
    name: '基础蘑菇',
    growthTime: 300, // 5分钟
    cost: { WATER: 10, MINERAL: 5 },
    yield: { FOOD: 30, HONEYDEW: 5 },
    unlockLevel: 1
  },
  HONEY_FUNGUS: {
    name: '蜜露菌',
    growthTime: 600, // 10分钟
    cost: { WATER: 15, MINERAL: 10, FOOD: 5 },
    yield: { HONEYDEW: 20, FOOD: 10 },
    unlockLevel: 3
  },
  PROTEIN_MUSHROOM: {
    name: '蛋白菇',
    growthTime: 900, // 15分钟
    cost: { WATER: 20, MINERAL: 15, HONEYDEW: 10 },
    yield: { FOOD: 60 },
    unlockLevel: 5
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { action, colonyId, fungusGardenId, fungusType, plotId } = body

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
        chambers: true
      }
    })

    if (!colony || colony.playerId !== playerId) {
      return { success: false, message: '无权限操作此殖民地' }
    }

    switch (action) {
      case 'plant_fungus':
        return await plantFungus(colony, fungusGardenId, fungusType, plotId)
      case 'harvest_fungus':
        return await harvestFungus(colony, fungusGardenId, plotId)
      case 'get_garden_info':
        return await getGardenInfo(colony, fungusGardenId)
      default:
        return { success: false, message: '无效的操作类型' }
    }
  } catch (error) {
    console.error('Fungus management failed:', error)
    return {
      success: false,
      message: '操作失败',
      error: error.message
    }
  }
})

// 种植真菌
async function plantFungus(colony: any, fungusGardenId: string, fungusType: string, plotId: number) {
  // 检查真菌园是否存在
  const fungusGarden = colony.chambers.find((chamber: any) => 
    chamber.id === fungusGardenId && chamber.type === 'FUNGUS_GARDEN'
  )
  
  if (!fungusGarden) {
    return { success: false, message: '真菌园不存在' }
  }

  // 检查真菌类型配置
  const fungusConfig = FUNGUS_TYPES[fungusType]
  if (!fungusConfig) {
    return { success: false, message: '无效的真菌类型' }
  }

  // 检查真菌园等级是否足够
  if (fungusGarden.level < fungusConfig.unlockLevel) {
    return { 
      success: false, 
      message: `真菌园等级不足，需要${fungusConfig.unlockLevel}级才能种植${fungusConfig.name}` 
    }
  }

  // 检查资源是否足够
  for (const [resourceType, cost] of Object.entries(fungusConfig.cost)) {
    const resource = colony.resources.find((r: any) => r.type === resourceType)
    if (!resource || resource.amount < cost) {
      return {
        success: false,
        message: `资源不足：需要 ${cost} ${resourceType}，当前只有 ${resource?.amount || 0}`
      }
    }
  }

  // 获取真菌园的种植信息
  const gardenData = fungusGarden.specialSkill ? JSON.parse(fungusGarden.specialSkill) : { plots: {} }
  
  // 检查种植位是否可用
  const maxPlots = Math.min(10, 3 + fungusGarden.level) // 基础3个位置，每级增加1个，最多10个
  if (plotId < 0 || plotId >= maxPlots) {
    return { success: false, message: '无效的种植位置' }
  }

  if (gardenData.plots[plotId] && gardenData.plots[plotId].status === 'growing') {
    return { success: false, message: '该位置已有真菌在生长' }
  }

  // 扣除资源
  for (const [resourceType, cost] of Object.entries(fungusConfig.cost)) {
    await prisma.resource.updateMany({
      where: {
        colonyId: colony.id,
        type: resourceType
      },
      data: {
        amount: {
          decrement: cost
        }
      }
    })
  }

  // 计算生长时间（考虑真菌园等级加成）
  const specialBonus = fungusGarden.specialBonus ? JSON.parse(fungusGarden.specialBonus) : {}
  const growthSpeedMultiplier = specialBonus.growthSpeed || 1.0
  const actualGrowthTime = Math.ceil(fungusConfig.growthTime / growthSpeedMultiplier)

  // 更新种植信息
  gardenData.plots[plotId] = {
    fungusType,
    plantTime: new Date(),
    harvestTime: new Date(Date.now() + actualGrowthTime * 1000),
    status: 'growing'
  }

  // 保存到数据库
  await prisma.chamber.update({
    where: { id: fungusGardenId },
    data: {
      specialSkill: JSON.stringify(gardenData)
    }
  })

  return {
    success: true,
    message: `成功种植${fungusConfig.name}`,
    data: {
      plotId,
      fungusType,
      growthTime: actualGrowthTime,
      harvestTime: gardenData.plots[plotId].harvestTime
    }
  }
}

// 收获真菌
async function harvestFungus(colony: any, fungusGardenId: string, plotId: number) {
  // 检查真菌园是否存在
  const fungusGarden = colony.chambers.find((chamber: any) => 
    chamber.id === fungusGardenId && chamber.type === 'FUNGUS_GARDEN'
  )
  
  if (!fungusGarden) {
    return { success: false, message: '真菌园不存在' }
  }

  // 获取种植信息
  const gardenData = fungusGarden.specialSkill ? JSON.parse(fungusGarden.specialSkill) : { plots: {} }
  const plot = gardenData.plots[plotId]
  
  if (!plot || plot.status !== 'growing') {
    return { success: false, message: '该位置没有可收获的真菌' }
  }

  // 检查是否可以收获
  if (new Date() < new Date(plot.harvestTime)) {
    const remainingTime = Math.ceil((new Date(plot.harvestTime).getTime() - Date.now()) / 1000)
    return { 
      success: false, 
      message: `真菌还需要 ${remainingTime} 秒才能收获` 
    }
  }

  // 获取真菌配置
  const fungusConfig = FUNGUS_TYPES[plot.fungusType]
  if (!fungusConfig) {
    return { success: false, message: '无效的真菌类型' }
  }

  // 计算产量（考虑真菌园等级加成）
  const specialBonus = fungusGarden.specialBonus ? JSON.parse(fungusGarden.specialBonus) : {}
  const fungusProduction = specialBonus.fungusProduction || 0
  
  // 增加资源
  for (const [resourceType, baseYield] of Object.entries(fungusConfig.yield)) {
    const actualYield = baseYield + fungusProduction
    
    await prisma.resource.upsert({
      where: {
        colonyId_type: {
          colonyId: colony.id,
          type: resourceType
        }
      },
      update: {
        amount: {
          increment: actualYield
        }
      },
      create: {
        colonyId: colony.id,
        type: resourceType,
        amount: actualYield
      }
    })
  }

  // 清空种植位
  delete gardenData.plots[plotId]

  // 保存到数据库
  await prisma.chamber.update({
    where: { id: fungusGardenId },
    data: {
      specialSkill: JSON.stringify(gardenData)
    }
  })

  return {
    success: true,
    message: `成功收获${fungusConfig.name}`,
    data: {
      plotId,
      fungusType: plot.fungusType,
      yield: Object.entries(fungusConfig.yield).map(([type, amount]) => ({
        type,
        amount: amount + fungusProduction
      }))
    }
  }
}

// 获取真菌园信息
async function getGardenInfo(colony: any, fungusGardenId: string) {
  const fungusGarden = colony.chambers.find((chamber: any) => 
    chamber.id === fungusGardenId && chamber.type === 'FUNGUS_GARDEN'
  )
  
  if (!fungusGarden) {
    return { success: false, message: '真菌园不存在' }
  }

  const gardenData = fungusGarden.specialSkill ? JSON.parse(fungusGarden.specialSkill) : { plots: {} }
  const maxPlots = Math.min(10, 3 + fungusGarden.level)
  
  // 获取可种植的真菌类型
  const availableFungusTypes = Object.entries(FUNGUS_TYPES)
    .filter(([_, config]) => fungusGarden.level >= config.unlockLevel)
    .map(([type, config]) => ({
      type,
      name: config.name,
      cost: config.cost,
      yield: config.yield,
      growthTime: config.growthTime,
      unlocked: true
    }))

  // 处理种植位信息
  const plots = []
  for (let i = 0; i < maxPlots; i++) {
    const plot = gardenData.plots[i]
    if (plot) {
      const fungusConfig = FUNGUS_TYPES[plot.fungusType]
      plots.push({
        id: i,
        fungusType: plot.fungusType,
        fungusName: fungusConfig?.name || '未知真菌',
        plantTime: plot.plantTime,
        harvestTime: plot.harvestTime,
        status: plot.status,
        canHarvest: new Date() >= new Date(plot.harvestTime)
      })
    } else {
      plots.push({
        id: i,
        status: 'empty'
      })
    }
  }

  return {
    success: true,
    data: {
      garden: {
        id: fungusGarden.id,
        level: fungusGarden.level,
        maxPlots,
        specialBonus: fungusGarden.specialBonus ? JSON.parse(fungusGarden.specialBonus) : {}
      },
      plots,
      availableFungusTypes
    }
  }
}