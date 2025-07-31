import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 房间类型的资源生产配置
const PRODUCTION_CONFIGS = {
  STORAGE: {
    baseProduction: { FOOD: 5 },
    productionInterval: 60000, // 1分钟
    description: '储藏室定期整理，减少食物损耗'
  },
  NURSERY: {
    baseProduction: { WATER: 3 },
    productionInterval: 90000, // 1.5分钟
    description: '育婴室收集露水'
  },
  QUEEN_PALACE: {
    baseProduction: { HONEYDEW: 2 },
    productionInterval: 120000, // 2分钟
    description: '蚁后宫殿培养蚜虫产蜜露'
  },
  RESOURCE_PROCESSING: {
    baseProduction: { MINERAL: 4, FUNGUS: 2 },
    productionInterval: 180000, // 3分钟
    description: '资源加工室处理原材料'
  },
  FUNGUS_GARDEN: {
    baseProduction: { FUNGUS: 6 },
    productionInterval: 150000, // 2.5分钟
    description: '真菌园培养真菌'
  }
}

// 蚂蚁工作的生产加成
const ANT_WORK_BONUS = {
  WORKER: {
    FOOD: 1.5,
    WATER: 1.3,
    MINERAL: 1.4
  },
  BUILDER: {
    MINERAL: 1.8,
    FUNGUS: 1.2
  },
  SCOUT: {
    WATER: 1.6,
    HONEYDEW: 1.3
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { action, colonyId, antId, chamberId } = body

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
        chambers: true,
        ants: true,
        technologies: true
      }
    })

    if (!colony) {
      return {
        success: false,
        message: '殖民地不存在'
      }
    }

    switch (action) {
      case 'auto_produce': {
        // 自动生产资源
        const productionResults = []
        const currentTime = new Date()

        for (const chamber of colony.chambers) {
          const config = PRODUCTION_CONFIGS[chamber.type]
          if (!config) continue

          // 检查是否到了生产时间
          const timeSinceUpdate = currentTime.getTime() - chamber.updatedAt.getTime()
          if (timeSinceUpdate < config.productionInterval) continue

          // 计算生产周期数
          const cycles = Math.floor(timeSinceUpdate / config.productionInterval)
          if (cycles === 0) continue

          // 计算基础生产量
          const baseEfficiency = chamber.efficiency
          const levelBonus = 1 + (chamber.level - 1) * 0.2
          
          // 科技加成
          let techBonus = 1.0
          const collectionTech = colony.technologies.find(t => t.name === '基础采集')
          if (collectionTech && collectionTech.level > 0) {
            const effects = JSON.parse(collectionTech.effects || '{}')
            techBonus *= effects.efficiency || 1.0
          }

          // 计算工作蚂蚁加成
          const workingAnts = colony.ants.filter(ant => 
            ant.workingAt === chamber.id && ant.status === 'WORKING'
          )
          
          let antBonus = 1.0
          for (const ant of workingAnts) {
            const antEfficiency = ant.efficiency
            antBonus += (antEfficiency - 1.0) * 0.5 // 蚂蚁效率加成
          }

          // 生产资源
          for (const [resourceType, baseAmount] of Object.entries(config.baseProduction)) {
            const totalProduction = Math.floor(
              baseAmount * cycles * baseEfficiency * levelBonus * techBonus * antBonus
            )

            if (totalProduction > 0) {
              // 更新资源
              await prisma.resource.upsert({
                where: {
                  colonyId_type: {
                    colonyId,
                    type: resourceType
                  }
                },
                update: {
                  amount: {
                    increment: totalProduction
                  }
                },
                create: {
                  type: resourceType,
                  amount: totalProduction,
                  colonyId
                }
              })

              productionResults.push({
                chamberId: chamber.id,
                chamberType: chamber.type,
                resourceType,
                amount: totalProduction,
                cycles
              })
            }
          }

          // 更新房间的最后更新时间
          await prisma.chamber.update({
            where: { id: chamber.id },
            data: { updatedAt: currentTime }
          })
        }

        // 记录生产事件
        if (productionResults.length > 0) {
          await prisma.gameEvent.create({
            data: {
              colonyId,
              type: 'RESOURCE_PRODUCED',
              title: '资源自动生产',
              description: `巢穴自动生产了各种资源`,
              impact: JSON.stringify({ productions: productionResults })
            }
          })
        }

        return {
          success: true,
          message: '自动生产完成',
          data: { productionResults }
        }
      }

      case 'assign_work': {
        if (!antId || !chamberId) {
          return {
            success: false,
            message: '缺少必要参数：antId 和 chamberId'
          }
        }

        const ant = colony.ants.find(a => a.id === antId)
        const chamber = colony.chambers.find(c => c.id === chamberId)

        if (!ant) {
          return {
            success: false,
            message: '蚂蚁不存在'
          }
        }

        if (!chamber) {
          return {
            success: false,
            message: '房间不存在'
          }
        }

        // 检查房间是否支持工作
        if (!PRODUCTION_CONFIGS[chamber.type]) {
          return {
            success: false,
            message: '该房间类型不支持蚂蚁工作'
          }
        }

        // 检查房间容量
        const workingAnts = colony.ants.filter(a => a.workingAt === chamberId)
        const maxWorkers = Math.floor(chamber.capacity / 50) // 每50容量支持1只蚂蚁工作
        
        if (workingAnts.length >= maxWorkers) {
          return {
            success: false,
            message: `房间工作位已满，最多支持 ${maxWorkers} 只蚂蚁工作`
          }
        }

        // 分配工作
        await prisma.ant.update({
          where: { id: antId },
          data: {
            workingAt: chamberId,
            status: 'WORKING'
          }
        })

        return {
          success: true,
          message: `${ant.type} 已分配到 ${chamber.type} 工作`,
          data: { ant, chamber }
        }
      }

      case 'remove_work': {
        if (!antId) {
          return {
            success: false,
            message: '缺少蚂蚁ID'
          }
        }

        const ant = colony.ants.find(a => a.id === antId)
        if (!ant) {
          return {
            success: false,
            message: '蚂蚁不存在'
          }
        }

        // 移除工作分配
        await prisma.ant.update({
          where: { id: antId },
          data: {
            workingAt: null,
            status: 'IDLE'
          }
        })

        return {
          success: true,
          message: '蚂蚁已停止工作',
          data: { ant }
        }
      }

      case 'production_info': {
        // 获取生产信息
        const productionInfo = []

        for (const chamber of colony.chambers) {
          const config = PRODUCTION_CONFIGS[chamber.type]
          if (!config) continue

          const workingAnts = colony.ants.filter(ant => 
            ant.workingAt === chamber.id && ant.status === 'WORKING'
          )

          // 计算生产效率
          const baseEfficiency = chamber.efficiency
          const levelBonus = 1 + (chamber.level - 1) * 0.2
          
          let techBonus = 1.0
          const collectionTech = colony.technologies.find(t => t.name === '基础采集')
          if (collectionTech && collectionTech.level > 0) {
            const effects = JSON.parse(collectionTech.effects || '{}')
            techBonus *= effects.efficiency || 1.0
          }

          let antBonus = 1.0
          for (const ant of workingAnts) {
            antBonus += (ant.efficiency - 1.0) * 0.5
          }

          const totalEfficiency = baseEfficiency * levelBonus * techBonus * antBonus

          productionInfo.push({
            chamberId: chamber.id,
            chamberType: chamber.type,
            level: chamber.level,
            baseProduction: config.baseProduction,
            productionInterval: config.productionInterval,
            totalEfficiency,
            workingAnts: workingAnts.length,
            maxWorkers: Math.floor(chamber.capacity / 50),
            nextProductionTime: new Date(chamber.updatedAt.getTime() + config.productionInterval)
          })
        }

        return {
          success: true,
          data: { productionInfo }
        }
      }

      default:
        return {
          success: false,
          message: '无效的操作类型'
        }
    }
  } catch (error) {
    console.error('Resource production failed:', error)
    return {
      success: false,
      message: '资源生产操作失败',
      error: error.message
    }
  }
})

// 全局自动生产函数（可以通过定时任务调用）
export async function globalAutoProduction() {
  try {
    const colonies = await prisma.colony.findMany({
      include: {
        chambers: true,
        ants: true,
        technologies: true
      }
    })

    let totalProductions = 0

    for (const colony of colonies) {
      const currentTime = new Date()
      
      for (const chamber of colony.chambers) {
        const config = PRODUCTION_CONFIGS[chamber.type]
        if (!config) continue

        const timeSinceUpdate = currentTime.getTime() - chamber.updatedAt.getTime()
        if (timeSinceUpdate < config.productionInterval) continue

        const cycles = Math.floor(timeSinceUpdate / config.productionInterval)
        if (cycles === 0) continue

        // 计算生产效率
        const baseEfficiency = chamber.efficiency
        const levelBonus = 1 + (chamber.level - 1) * 0.2
        
        let techBonus = 1.0
        const collectionTech = colony.technologies.find(t => t.name === '基础采集')
        if (collectionTech && collectionTech.level > 0) {
          const effects = JSON.parse(collectionTech.effects || '{}')
          techBonus *= effects.efficiency || 1.0
        }

        const workingAnts = colony.ants.filter(ant => 
          ant.workingAt === chamber.id && ant.status === 'WORKING'
        )
        
        let antBonus = 1.0
        for (const ant of workingAnts) {
          antBonus += (ant.efficiency - 1.0) * 0.5
        }

        // 生产资源
        for (const [resourceType, baseAmount] of Object.entries(config.baseProduction)) {
          const totalProduction = Math.floor(
            baseAmount * cycles * baseEfficiency * levelBonus * techBonus * antBonus
          )

          if (totalProduction > 0) {
            await prisma.resource.upsert({
              where: {
                colonyId_type: {
                  colonyId: colony.id,
                  type: resourceType
                }
              },
              update: {
                amount: {
                  increment: totalProduction
                }
              },
              create: {
                type: resourceType,
                amount: totalProduction,
                colonyId: colony.id
              }
            })

            totalProductions++
          }
        }

        // 更新房间时间
        await prisma.chamber.update({
          where: { id: chamber.id },
          data: { updatedAt: currentTime }
        })
      }
    }

    return totalProductions
  } catch (error) {
    console.error('Global auto production failed:', error)
    return 0
  }
}