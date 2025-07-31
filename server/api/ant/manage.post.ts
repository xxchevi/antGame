import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 蚂蚁类型配置
const ANT_CONFIGS = {
  WORKER: {
    name: '工蚁',
    baseCost: { food: 20, water: 10 },
    baseStats: { health: 80, energy: 100, efficiency: 1.0 },
    description: '基础资源收集，建设巢穴'
  },
  SOLDIER: {
    name: '兵蚁',
    baseCost: { food: 30, water: 15 },
    baseStats: { health: 120, energy: 90, efficiency: 1.2 },
    description: '巢穴防御，对外掠夺'
  },
  SCOUT: {
    name: '侦察蚁',
    baseCost: { food: 25, water: 20 },
    baseStats: { health: 60, energy: 120, efficiency: 1.5 },
    description: '探索新区域，收集情报'
  },
  BUILDER: {
    name: '建筑蚁',
    baseCost: { food: 35, mineral: 10 },
    baseStats: { health: 100, energy: 80, efficiency: 1.3 },
    description: '专业建设，扩建巢穴'
  },
  QUEEN: {
    name: '蚁后',
    baseCost: { food: 200, water: 100, honeydew: 50 },
    baseStats: { health: 200, energy: 150, efficiency: 2.0 },
    description: '繁殖蚂蚁，统领蚁群'
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { action, colonyId, antId, antType, targetLevel } = body

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
        ants: true,
        chambers: true
      }
    })

    if (!colony) {
      return {
        success: false,
        message: '殖民地不存在'
      }
    }

    switch (action) {
      case 'recruit': {
        if (!antType || !ANT_CONFIGS[antType]) {
          return {
            success: false,
            message: '无效的蚂蚁类型'
          }
        }

        // 检查蚁后限制
        if (antType === 'QUEEN') {
          const existingQueen = colony.ants.find(ant => ant.type === 'QUEEN')
          if (existingQueen) {
            return {
              success: false,
              message: '每个殖民地只能有一只蚁后'
            }
          }
        }

        // 检查育婴室容量
        const nursery = colony.chambers.find(c => c.type === 'NURSERY')
        if (!nursery && antType !== 'QUEEN') {
          return {
            success: false,
            message: '需要先建造育婴室才能招募蚂蚁'
          }
        }

        const config = ANT_CONFIGS[antType]
        const resourceMap = colony.resources.reduce((map, r) => {
          map[r.type.toLowerCase()] = r.amount
          return map
        }, {})

        // 检查资源是否足够
        for (const [resourceType, cost] of Object.entries(config.baseCost)) {
          const available = resourceMap[resourceType] || 0
          if (available < cost) {
            return {
              success: false,
              message: `资源不足：需要 ${cost} ${resourceType}，当前只有 ${available}`
            }
          }
        }

        // 扣除招募成本
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

        // 创建蚂蚁
        const ant = await prisma.ant.create({
          data: {
            type: antType,
            level: 1,
            experience: 0,
            health: config.baseStats.health,
            energy: config.baseStats.energy,
            efficiency: config.baseStats.efficiency,
            status: 'IDLE',
            colonyId
          }
        })

        // 记录招募事件
        await prisma.gameEvent.create({
          data: {
            colonyId,
            type: 'ANT_RECRUITED',
            title: '蚂蚁招募成功',
            description: `成功招募了一只 ${config.name}`,
            impact: JSON.stringify({ antType, antId: ant.id })
          }
        })

        return {
          success: true,
          message: `成功招募 ${config.name}`,
          data: { ant, costPaid: config.baseCost }
        }
      }

      case 'upgrade': {
        if (!antId) {
          return {
            success: false,
            message: '缺少蚂蚁ID'
          }
        }

        const ant = await prisma.ant.findUnique({
          where: { id: antId }
        })

        if (!ant || ant.colonyId !== colonyId) {
          return {
            success: false,
            message: '蚂蚁不存在或不属于该殖民地'
          }
        }

        const newLevel = targetLevel || ant.level + 1
        const upgradeCost = newLevel * 50 // 升级成本随等级增加

        const foodResource = colony.resources.find(r => r.type === 'FOOD')
        if (!foodResource || foodResource.amount < upgradeCost) {
          return {
            success: false,
            message: `升级需要 ${upgradeCost} 食物，当前只有 ${foodResource?.amount || 0}`
          }
        }

        // 扣除升级成本
        await prisma.resource.updateMany({
          where: {
            colonyId,
            type: 'FOOD'
          },
          data: {
            amount: {
              decrement: upgradeCost
            }
          }
        })

        // 升级蚂蚁
        const upgradedAnt = await prisma.ant.update({
          where: { id: antId },
          data: {
            level: newLevel,
            health: ant.health + 10,
            energy: ant.energy + 5,
            efficiency: ant.efficiency + 0.1
          }
        })

        return {
          success: true,
          message: `蚂蚁升级到 ${newLevel} 级`,
          data: { ant: upgradedAnt, costPaid: { food: upgradeCost } }
        }
      }

      case 'evolve': {
        if (!antId) {
          return {
            success: false,
            message: '缺少蚂蚁ID'
          }
        }

        const ant = await prisma.ant.findUnique({
          where: { id: antId }
        })

        if (!ant || ant.colonyId !== colonyId) {
          return {
            success: false,
            message: '蚂蚁不存在或不属于该殖民地'
          }
        }

        // 查找可用的进化路径
        const evolution = await prisma.antEvolution.findFirst({
          where: {
            fromType: ant.type
          }
        })

        if (!evolution) {
          return {
            success: false,
            message: '该蚂蚁类型暂无进化路径'
          }
        }

        const requirements = JSON.parse(evolution.requirements)
        
        // 检查进化条件
        if (ant.level < requirements.level) {
          return {
            success: false,
            message: `进化需要等级 ${requirements.level}，当前等级 ${ant.level}`
          }
        }

        if (ant.experience < requirements.experience) {
          return {
            success: false,
            message: `进化需要经验 ${requirements.experience}，当前经验 ${ant.experience}`
          }
        }

        // 进化蚂蚁
        const benefits = JSON.parse(evolution.benefits)
        const evolvedAnt = await prisma.ant.update({
          where: { id: antId },
          data: {
            type: evolution.toType,
            efficiency: ant.efficiency * (benefits.efficiency || 1),
            health: Math.floor(ant.health * (benefits.attack || benefits.defense || 1)),
            specialSkill: benefits.specialAbility ? 'EVOLVED_ABILITY' : ant.specialSkill
          }
        })

        // 记录进化事件
        await prisma.gameEvent.create({
          data: {
            colonyId,
            type: 'ANT_EVOLVED',
            title: '蚂蚁进化成功',
            description: `${ant.type} 成功进化为 ${evolution.toType}`,
            impact: JSON.stringify({ fromType: ant.type, toType: evolution.toType })
          }
        })

        return {
          success: true,
          message: `蚂蚁成功进化为 ${evolution.toType}`,
          data: { ant: evolvedAnt, evolution }
        }
      }

      default:
        return {
          success: false,
          message: '无效的操作类型'
        }
    }
  } catch (error) {
    console.error('Ant management failed:', error)
    return {
      success: false,
      message: '蚂蚁管理操作失败',
      error: error.message
    }
  }
})