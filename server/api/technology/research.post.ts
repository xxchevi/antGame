import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 科技配置数据
const TECH_CONFIGS = {
  COLLECTION: {
    '基础采集': {
      maxLevel: 5,
      baseCost: 50,
      costMultiplier: 1.5,
      effects: (level) => ({ efficiency: 1 + level * 0.2 }),
      description: '提升工蚁的基础采集效率'
    },
    '群体协作': {
      maxLevel: 3,
      baseCost: 150,
      costMultiplier: 2.0,
      effects: (level) => ({ teamBonus: 1 + level * 0.5 }),
      description: '多只蚂蚁协作时效率提升',
      prerequisites: ['基础采集']
    }
  },
  MILITARY: {
    '基础战斗': {
      maxLevel: 5,
      baseCost: 80,
      costMultiplier: 1.6,
      effects: (level) => ({ attack: 1 + level * 0.3, defense: 1 + level * 0.2 }),
      description: '提升兵蚁的攻击力和防御力'
    },
    '特殊技能': {
      maxLevel: 3,
      baseCost: 200,
      costMultiplier: 2.2,
      effects: (level) => ({ specialAbility: true, abilityPower: level }),
      description: '解锁兵蚁特殊战斗技能',
      prerequisites: ['基础战斗']
    }
  },
  CONSTRUCTION: {
    '建造速度': {
      maxLevel: 5,
      baseCost: 100,
      costMultiplier: 1.4,
      effects: (level) => ({ buildSpeed: 1 + level * 0.4 }),
      description: '提升建筑蚂蚁的建造速度'
    },
    '结构优化': {
      maxLevel: 3,
      baseCost: 250,
      costMultiplier: 1.8,
      effects: (level) => ({ capacityBonus: 1 + level * 0.5 }),
      description: '优化巢穴结构，提升容量',
      prerequisites: ['建造速度']
    }
  },
  BIOLOGY: {
    '繁殖优化': {
      maxLevel: 5,
      baseCost: 120,
      costMultiplier: 1.7,
      effects: (level) => ({ breedingRate: 1 + level * 0.3 }),
      description: '提升蚁后的繁殖效率'
    },
    '基因改造': {
      maxLevel: 3,
      baseCost: 300,
      costMultiplier: 2.5,
      effects: (level) => ({ geneticBonus: true, mutationChance: level * 0.1 }),
      description: '基因改造蚂蚁，获得特殊能力',
      prerequisites: ['繁殖优化']
    }
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { colonyId, techType, techName, action = 'research' } = body

    if (!colonyId || !techType || !techName) {
      return {
        success: false,
        message: '缺少必要参数：colonyId, techType, techName'
      }
    }

    // 验证科技配置
    const techConfig = TECH_CONFIGS[techType]?.[techName]
    if (!techConfig) {
      return {
        success: false,
        message: '无效的科技类型或名称'
      }
    }

    // 检查殖民地是否存在
    const colony = await prisma.colony.findUnique({
      where: { id: colonyId },
      include: {
        resources: true,
        technologies: true
      }
    })

    if (!colony) {
      return {
        success: false,
        message: '殖民地不存在'
      }
    }

    // 查找现有科技
    let existingTech = colony.technologies.find(t => t.name === techName)

    if (action === 'research') {
      // 检查前置科技
      if (techConfig.prerequisites) {
        for (const prereq of techConfig.prerequisites) {
          const prereqTech = colony.technologies.find(t => t.name === prereq && t.level > 0)
          if (!prereqTech) {
            return {
              success: false,
              message: `需要先研究前置科技：${prereq}`
            }
          }
        }
      }

      const currentLevel = existingTech?.level || 0
      const nextLevel = currentLevel + 1

      // 检查是否已达到最大等级
      if (currentLevel >= techConfig.maxLevel) {
        return {
          success: false,
          message: `${techName} 已达到最大等级 ${techConfig.maxLevel}`
        }
      }

      // 计算研究成本
      const researchCost = Math.floor(techConfig.baseCost * Math.pow(techConfig.costMultiplier, currentLevel))
      
      // 检查食物资源（研究消耗食物）
      const foodResource = colony.resources.find(r => r.type === 'FOOD')
      if (!foodResource || foodResource.amount < researchCost) {
        return {
          success: false,
          message: `研究需要 ${researchCost} 食物，当前只有 ${foodResource?.amount || 0}`
        }
      }

      // 扣除研究成本
      await prisma.resource.updateMany({
        where: {
          colonyId,
          type: 'FOOD'
        },
        data: {
          amount: {
            decrement: researchCost
          }
        }
      })

      // 更新或创建科技
      const updatedTech = existingTech
        ? await prisma.technology.update({
            where: { id: existingTech.id },
            data: {
              level: nextLevel,
              effects: JSON.stringify(techConfig.effects(nextLevel))
            }
          })
        : await prisma.technology.create({
            data: {
              type: techType,
              name: techName,
              level: nextLevel,
              maxLevel: techConfig.maxLevel,
              researchCost,
              description: techConfig.description,
              effects: JSON.stringify(techConfig.effects(nextLevel)),
              prerequisites: techConfig.prerequisites ? JSON.stringify(techConfig.prerequisites) : null,
              colonyId
            }
          })

      // 记录研究事件
      await prisma.gameEvent.create({
        data: {
          colonyId,
          type: 'TECH_RESEARCHED',
          title: '科技研究完成',
          description: `${techName} 研究到 ${nextLevel} 级`,
          impact: JSON.stringify({ 
            techType, 
            techName, 
            level: nextLevel, 
            effects: techConfig.effects(nextLevel) 
          })
        }
      })

      // 检查是否解锁成就
      await checkTechAchievements(colonyId, colony.technologies.length + (existingTech ? 0 : 1))

      return {
        success: true,
        message: `${techName} 研究到 ${nextLevel} 级`,
        data: {
          technology: updatedTech,
          costPaid: { food: researchCost },
          effects: techConfig.effects(nextLevel)
        }
      }
    }

    if (action === 'list') {
      // 返回所有可研究的科技
      const availableTechs = []
      
      for (const [type, techs] of Object.entries(TECH_CONFIGS)) {
        for (const [name, config] of Object.entries(techs)) {
          const existing = colony.technologies.find(t => t.name === name)
          const currentLevel = existing?.level || 0
          const canResearch = currentLevel < config.maxLevel
          
          // 检查前置科技
          let prerequisitesMet = true
          if (config.prerequisites) {
            for (const prereq of config.prerequisites) {
              const prereqTech = colony.technologies.find(t => t.name === prereq && t.level > 0)
              if (!prereqTech) {
                prerequisitesMet = false
                break
              }
            }
          }

          availableTechs.push({
            type,
            name,
            currentLevel,
            maxLevel: config.maxLevel,
            canResearch: canResearch && prerequisitesMet,
            nextLevelCost: canResearch ? Math.floor(config.baseCost * Math.pow(config.costMultiplier, currentLevel)) : null,
            description: config.description,
            prerequisites: config.prerequisites || [],
            prerequisitesMet,
            effects: config.effects(currentLevel + 1)
          })
        }
      }

      return {
        success: true,
        data: { technologies: availableTechs }
      }
    }

    return {
      success: false,
      message: '无效的操作类型'
    }
  } catch (error) {
    console.error('Technology research failed:', error)
    return {
      success: false,
      message: '科技研究失败',
      error: error.message
    }
  }
})

// 检查科技相关成就
async function checkTechAchievements(colonyId: string, techCount: number) {
  try {
    // 检查"科技先锋"成就
    if (techCount >= 8) { // 假设有8个基础科技
      const achievement = await prisma.achievement.findUnique({
        where: { name: '科技先锋' }
      })
      
      if (achievement) {
        const colony = await prisma.colony.findUnique({
          where: { id: colonyId },
          include: { player: true }
        })
        
        if (colony) {
          await prisma.playerAchievement.upsert({
            where: {
              playerId_achievementId: {
                playerId: colony.playerId,
                achievementId: achievement.id
              }
            },
            update: {},
            create: {
              playerId: colony.playerId,
              achievementId: achievement.id
            }
          })
        }
      }
    }
  } catch (error) {
    console.error('Achievement check failed:', error)
  }
}