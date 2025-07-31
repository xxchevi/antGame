import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 蚂蚁类型配置
const ANT_TYPES = {
  WORKER: {
    name: '工蚁',
    unlockLevel: 1,
    eggCost: { FOOD: 20, WATER: 10 },
    baseStats: { health: 80, energy: 100, efficiency: 1.0 }
  },
  SOLDIER: {
    name: '兵蚁',
    unlockLevel: 3,
    eggCost: { FOOD: 40, WATER: 20, MINERAL: 10 },
    baseStats: { health: 150, energy: 120, efficiency: 1.2 }
  },
  SCOUT: {
    name: '侦察蚁',
    unlockLevel: 5,
    eggCost: { FOOD: 30, WATER: 15, HONEYDEW: 5 },
    baseStats: { health: 60, energy: 150, efficiency: 1.5 }
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { action, colonyId, antType, eggId } = body

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
      return { success: false, message: '无权限操作此殖民地' }
    }

    switch (action) {
      case 'lay_egg':
        return await layEgg(colony, antType)
      case 'hatch_egg':
        return await hatchEgg(colony, eggId)
      case 'get_breeding_info':
        return await getBreedingInfo(colony)
      default:
        return { success: false, message: '无效的操作类型' }
    }
  } catch (error) {
    console.error('Breeding operation failed:', error)
    return {
      success: false,
      message: '操作失败',
      error: error.message
    }
  }
})

// 蚁后产卵
async function layEgg(colony: any, antType: string) {
  // 检查蚁后是否存在
  const queen = colony.ants.find((ant: any) => ant.type === 'QUEEN')
  if (!queen) {
    return { success: false, message: '没有蚁后，无法产卵' }
  }

  // 检查蚁后宫殿
  const queenPalace = colony.chambers.find((chamber: any) => chamber.type === 'QUEEN_PALACE')
  if (!queenPalace) {
    return { success: false, message: '需要建造蚁后宫殿才能产卵' }
  }

  // 检查蚂蚁类型是否解锁
  const antConfig = ANT_TYPES[antType]
  if (!antConfig) {
    return { success: false, message: '无效的蚂蚁类型' }
  }

  if (queen.level < antConfig.unlockLevel) {
    return { success: false, message: `蚁后等级不足，需要${antConfig.unlockLevel}级才能产${antConfig.name}卵` }
  }

  // 检查资源是否足够
  for (const [resourceType, cost] of Object.entries(antConfig.eggCost)) {
    const resource = colony.resources.find((r: any) => r.type === resourceType)
    if (!resource || resource.amount < cost) {
      return {
        success: false,
        message: `资源不足：需要 ${cost} ${resourceType}，当前只有 ${resource?.amount || 0}`
      }
    }
  }

  // 扣除资源
  for (const [resourceType, cost] of Object.entries(antConfig.eggCost)) {
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

  // 获取宫殿特殊加成
  const specialBonus = queenPalace.specialBonus ? JSON.parse(queenPalace.specialBonus) : {}
  const eggProductionInterval = specialBonus.eggProductionInterval || 300

  // 创建蚂蚁卵记录
  const egg = await prisma.ant.create({
    data: {
      type: antType,
      level: 1,
      health: 1, // 卵状态
      energy: 0,
      efficiency: 0,
      status: 'EGG',
      colonyId: colony.id,
      specialSkill: JSON.stringify({
        isEgg: true,
        layTime: new Date(),
        expectedHatchTime: new Date(Date.now() + eggProductionInterval * 1000)
      })
    }
  })

  return {
    success: true,
    message: `蚁后成功产下${antConfig.name}卵`,
    data: {
      egg,
      eggProductionInterval,
      cost: antConfig.eggCost
    }
  }
}

// 孵化蚂蚁卵
async function hatchEgg(colony: any, eggId: string) {
  // 查找蚂蚁卵
  const egg = await prisma.ant.findUnique({
    where: { id: eggId }
  })

  if (!egg || egg.colonyId !== colony.id || egg.status !== 'EGG') {
    return { success: false, message: '蚂蚁卵不存在或已孵化' }
  }

  // 检查育婴室
  const nursery = colony.chambers.find((chamber: any) => chamber.type === 'NURSERY')
  if (!nursery) {
    return { success: false, message: '需要建造育婴室才能孵化蚂蚁卵' }
  }

  // 检查育婴室容量
  const nurseryAnts = colony.ants.filter((ant: any) => ant.workingAt === nursery.id)
  const specialBonus = nursery.specialBonus ? JSON.parse(nursery.specialBonus) : {}
  const maxEggs = specialBonus.maxEggs || 5
  
  if (nurseryAnts.length >= maxEggs) {
    return { success: false, message: '育婴室已满，无法孵化更多蚂蚁卵' }
  }

  // 检查孵化时间
  const eggInfo = egg.specialSkill ? JSON.parse(egg.specialSkill) : {}
  const hatchingTime = specialBonus.hatchingTime || 180
  const canHatchTime = new Date(eggInfo.layTime).getTime() + hatchingTime * 1000
  
  if (Date.now() < canHatchTime) {
    const remainingTime = Math.ceil((canHatchTime - Date.now()) / 1000)
    return { 
      success: false, 
      message: `蚂蚁卵还需要 ${remainingTime} 秒才能孵化` 
    }
  }

  // 获取蚂蚁基础属性
  const antConfig = ANT_TYPES[egg.type]
  if (!antConfig) {
    return { success: false, message: '无效的蚂蚁类型' }
  }

  // 孵化蚂蚁
  const hatchedAnt = await prisma.ant.update({
    where: { id: eggId },
    data: {
      health: antConfig.baseStats.health,
      energy: antConfig.baseStats.energy,
      efficiency: antConfig.baseStats.efficiency,
      status: 'IDLE',
      workingAt: nursery.id,
      specialSkill: JSON.stringify({
        hatchTime: new Date(),
        nurseryId: nursery.id
      })
    }
  })

  return {
    success: true,
    message: `${antConfig.name}孵化成功！`,
    data: {
      ant: hatchedAnt,
      hatchingTime
    }
  }
}

// 获取繁殖信息
async function getBreedingInfo(colony: any) {
  const queen = colony.ants.find((ant: any) => ant.type === 'QUEEN')
  const queenPalace = colony.chambers.find((chamber: any) => chamber.type === 'QUEEN_PALACE')
  const nursery = colony.chambers.find((chamber: any) => chamber.type === 'NURSERY')
  
  // 获取所有蚂蚁卵
  const eggs = colony.ants.filter((ant: any) => ant.status === 'EGG')
  
  // 计算可产卵的蚂蚁类型
  const availableAntTypes = Object.entries(ANT_TYPES)
    .filter(([_, config]) => queen && queen.level >= config.unlockLevel)
    .map(([type, config]) => ({
      type,
      name: config.name,
      cost: config.eggCost,
      unlocked: true
    }))

  const queenPalaceBonus = queenPalace?.specialBonus ? JSON.parse(queenPalace.specialBonus) : {}
  const nurseryBonus = nursery?.specialBonus ? JSON.parse(nursery.specialBonus) : {}

  return {
    success: true,
    data: {
      queen: queen ? {
        id: queen.id,
        level: queen.level,
        health: queen.health,
        energy: queen.energy
      } : null,
      queenPalace: queenPalace ? {
        id: queenPalace.id,
        level: queenPalace.level,
        eggProductionInterval: queenPalaceBonus.eggProductionInterval || 300
      } : null,
      nursery: nursery ? {
        id: nursery.id,
        level: nursery.level,
        hatchingTime: nurseryBonus.hatchingTime || 180,
        maxEggs: nurseryBonus.maxEggs || 5,
        currentEggs: eggs.length
      } : null,
      eggs: eggs.map((egg: any) => {
        const eggInfo = egg.specialSkill ? JSON.parse(egg.specialSkill) : {}
        return {
          id: egg.id,
          type: egg.type,
          layTime: eggInfo.layTime,
          canHatch: nursery && Date.now() >= (new Date(eggInfo.layTime).getTime() + (nurseryBonus.hatchingTime || 180) * 1000)
        }
      }),
      availableAntTypes
    }
  }
}