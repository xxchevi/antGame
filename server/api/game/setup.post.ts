import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    // 初始化科技树数据
    const technologies = [
      // 采集技术
      {
        type: 'COLLECTION',
        name: '基础采集',
        level: 0,
        maxLevel: 5,
        researchCost: 50,
        description: '提升工蚁的基础采集效率',
        effects: JSON.stringify({ efficiency: 1.2 }),
        prerequisites: null
      },
      {
        type: 'COLLECTION',
        name: '群体协作',
        level: 0,
        maxLevel: 3,
        researchCost: 150,
        description: '多只蚂蚁协作时效率提升',
        effects: JSON.stringify({ teamBonus: 1.5 }),
        prerequisites: JSON.stringify(['基础采集'])
      },
      // 军事技术
      {
        type: 'MILITARY',
        name: '基础战斗',
        level: 0,
        maxLevel: 5,
        researchCost: 80,
        description: '提升兵蚁的攻击力和防御力',
        effects: JSON.stringify({ attack: 1.3, defense: 1.2 }),
        prerequisites: null
      },
      {
        type: 'MILITARY',
        name: '特殊技能',
        level: 0,
        maxLevel: 3,
        researchCost: 200,
        description: '解锁兵蚁特殊战斗技能',
        effects: JSON.stringify({ specialAbility: true }),
        prerequisites: JSON.stringify(['基础战斗'])
      },
      // 建筑技术
      {
        type: 'CONSTRUCTION',
        name: '建造速度',
        level: 0,
        maxLevel: 5,
        researchCost: 100,
        description: '提升建筑蚂蚁的建造速度',
        effects: JSON.stringify({ buildSpeed: 1.4 }),
        prerequisites: null
      },
      {
        type: 'CONSTRUCTION',
        name: '结构优化',
        level: 0,
        maxLevel: 3,
        researchCost: 250,
        description: '优化巢穴结构，提升容量',
        effects: JSON.stringify({ capacityBonus: 1.5 }),
        prerequisites: JSON.stringify(['建造速度'])
      },
      // 生物技术
      {
        type: 'BIOLOGY',
        name: '繁殖优化',
        level: 0,
        maxLevel: 5,
        researchCost: 120,
        description: '提升蚁后的繁殖效率',
        effects: JSON.stringify({ breedingRate: 1.3 }),
        prerequisites: null
      },
      {
        type: 'BIOLOGY',
        name: '基因改造',
        level: 0,
        maxLevel: 3,
        researchCost: 300,
        description: '基因改造蚂蚁，获得特殊能力',
        effects: JSON.stringify({ geneticBonus: true }),
        prerequisites: JSON.stringify(['繁殖优化'])
      }
    ]

    // 初始化蚂蚁进化路径
    const evolutions = [
      {
        fromType: 'WORKER',
        toType: 'SUPER_WORKER',
        requirements: JSON.stringify({ level: 5, experience: 1000, technology: '群体协作' }),
        benefits: JSON.stringify({ efficiency: 2.0, capacity: 1.5 })
      },
      {
        fromType: 'SOLDIER',
        toType: 'ELITE_SOLDIER',
        requirements: JSON.stringify({ level: 5, experience: 1200, technology: '特殊技能' }),
        benefits: JSON.stringify({ attack: 2.5, defense: 2.0, specialAbility: true })
      },
      {
        fromType: 'SCOUT',
        toType: 'MASTER_SCOUT',
        requirements: JSON.stringify({ level: 4, experience: 800 }),
        benefits: JSON.stringify({ range: 3.0, speed: 2.0, dangerSense: true })
      },
      {
        fromType: 'BUILDER',
        toType: 'ARCHITECT',
        requirements: JSON.stringify({ level: 5, experience: 1000, technology: '结构优化' }),
        benefits: JSON.stringify({ buildSpeed: 3.0, specialRooms: true })
      },
      {
        fromType: 'QUEEN',
        toType: 'EMPRESS',
        requirements: JSON.stringify({ level: 10, experience: 5000, technology: '基因改造' }),
        benefits: JSON.stringify({ breedingRate: 3.0, geneticControl: true })
      }
    ]

    // 初始化成就系统
    const achievements = [
      {
        name: '蚁口普查',
        description: '拥有100只蚂蚁',
        icon: '🐜',
        reward: JSON.stringify({ experience: 500, resources: { food: 1000 } })
      },
      {
        name: '地下王国',
        description: '建造5层巢穴',
        icon: '🏰',
        reward: JSON.stringify({ experience: 800, unlockTech: '结构优化' })
      },
      {
        name: '资源大亨',
        description: '累计收集10万食物',
        icon: '💰',
        reward: JSON.stringify({ experience: 1000, productionBonus: 1.2 })
      },
      {
        name: '无敌防御',
        description: '成功抵御10次入侵',
        icon: '🛡️',
        reward: JSON.stringify({ experience: 1200, defenseBonus: 1.5 })
      },
      {
        name: '科技先锋',
        description: '研究完成所有基础科技',
        icon: '🔬',
        reward: JSON.stringify({ experience: 2000, researchBonus: 1.3 })
      },
      {
        name: '进化大师',
        description: '成功进化5只不同类型的蚂蚁',
        icon: '🧬',
        reward: JSON.stringify({ experience: 1500, evolutionBonus: 1.2 })
      }
    ]

    // 批量创建数据
    await Promise.all([
      // 创建蚂蚁进化路径
      ...evolutions.map(evolution => 
        prisma.antEvolution.upsert({
          where: { id: `${evolution.fromType}_to_${evolution.toType}` },
          update: evolution,
          create: { id: `${evolution.fromType}_to_${evolution.toType}`, ...evolution }
        })
      ),
      // 创建成就
      ...achievements.map(achievement => 
        prisma.achievement.upsert({
          where: { name: achievement.name },
          update: achievement,
          create: achievement
        })
      )
    ])

    return {
      success: true,
      message: '游戏基础数据初始化成功',
      data: {
        technologiesCount: technologies.length,
        evolutionsCount: evolutions.length,
        achievementsCount: achievements.length
      }
    }
  } catch (error) {
    console.error('Game setup failed:', error)
    return {
      success: false,
      message: '游戏基础数据初始化失败',
      error: error.message
    }
  }
})