import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 任务模板配置
const TASK_TEMPLATES = {
  DAILY: [
    {
      title: '日常采集',
      description: '收集 {amount} 单位食物',
      type: 'COLLECT_RESOURCE',
      resourceType: 'FOOD',
      baseTarget: 100,
      reward: { experience: 50, food: 20 }
    },
    {
      title: '水源补给',
      description: '收集 {amount} 单位水源',
      type: 'COLLECT_RESOURCE',
      resourceType: 'WATER',
      baseTarget: 50,
      reward: { experience: 40, water: 10 }
    },
    {
      title: '矿物开采',
      description: '开采 {amount} 单位矿物',
      type: 'COLLECT_RESOURCE',
      resourceType: 'MINERAL',
      baseTarget: 30,
      reward: { experience: 60, mineral: 15 }
    },
    {
      title: '蚂蚁训练',
      description: '训练 {amount} 只蚂蚁',
      type: 'TRAIN_ANTS',
      baseTarget: 3,
      reward: { experience: 80, food: 50 }
    }
  ],
  WEEKLY: [
    {
      title: '巢穴扩建',
      description: '建造 {amount} 个新房间',
      type: 'BUILD_CHAMBERS',
      baseTarget: 2,
      reward: { experience: 200, mineral: 100, food: 100 }
    },
    {
      title: '科技研究',
      description: '完成 {amount} 项科技研究',
      type: 'RESEARCH_TECH',
      baseTarget: 1,
      reward: { experience: 300, food: 200 }
    },
    {
      title: '资源储备',
      description: '累计储存 {amount} 单位各类资源',
      type: 'ACCUMULATE_RESOURCES',
      baseTarget: 1000,
      reward: { experience: 250, honeydew: 50 }
    },
    {
      title: '蚁群壮大',
      description: '蚁群规模达到 {amount} 只',
      type: 'REACH_ANT_COUNT',
      baseTarget: 20,
      reward: { experience: 400, food: 300 }
    }
  ],
  MAIN_STORY: [
    {
      title: '建立王朝',
      description: '将殖民地升级到王国阶段',
      type: 'REACH_EVOLUTION_STAGE',
      target: 'KINGDOM',
      reward: { experience: 1000, unlockFeature: 'TRADE_SYSTEM' }
    },
    {
      title: '科技霸主',
      description: '解锁所有基础科技分支',
      type: 'UNLOCK_ALL_BASIC_TECH',
      target: 8,
      reward: { experience: 1500, unlockFeature: 'ADVANCED_TECH' }
    },
    {
      title: '地下帝国',
      description: '建造完整的四层巢穴结构',
      type: 'BUILD_COMPLETE_NEST',
      target: 4,
      reward: { experience: 2000, unlockFeature: 'DEEP_EXPLORATION' }
    }
  ]
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { action, colonyId, taskId, taskType } = body

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
        tasks: true,
        resources: true,
        ants: true,
        chambers: true,
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
      case 'generate': {
        if (!taskType || !TASK_TEMPLATES[taskType]) {
          return {
            success: false,
            message: '无效的任务类型'
          }
        }

        // 检查是否已有未完成的同类型任务
        const existingTask = colony.tasks.find(t => t.type === taskType && !t.completed)
        if (existingTask) {
          return {
            success: false,
            message: `已有未完成的${taskType}任务`
          }
        }

        // 随机选择任务模板
        const templates = TASK_TEMPLATES[taskType]
        const template = templates[Math.floor(Math.random() * templates.length)]
        
        // 根据殖民地等级调整任务难度
        const difficultyMultiplier = 1 + (colony.level - 1) * 0.2
        const target = Math.floor((template.baseTarget || template.target) * difficultyMultiplier)
        
        // 创建任务
        const task = await prisma.task.create({
          data: {
            type: taskType,
            title: template.title,
            description: template.description.replace('{amount}', target.toString()),
            reward: JSON.stringify(template.reward),
            progress: 0,
            target,
            completed: false,
            colonyId
          }
        })

        // 记录任务生成事件
        await prisma.gameEvent.create({
          data: {
            colonyId,
            type: 'TASK_GENERATED',
            title: '新任务生成',
            description: `生成了新的${taskType}任务：${template.title}`,
            impact: JSON.stringify({ taskType, taskId: task.id })
          }
        })

        return {
          success: true,
          message: '任务生成成功',
          data: { task }
        }
      }

      case 'check_progress': {
        // 检查所有未完成任务的进度
        const incompleteTasks = colony.tasks.filter(t => !t.completed)
        const updatedTasks = []

        for (const task of incompleteTasks) {
          let newProgress = task.progress
          let completed = false

          // 根据任务类型检查进度
          switch (task.type) {
            case 'DAILY':
            case 'WEEKLY': {
              // 解析任务描述以确定具体类型
              if (task.description.includes('食物')) {
                const foodResource = colony.resources.find(r => r.type === 'FOOD')
                newProgress = Math.min(foodResource?.amount || 0, task.target)
              } else if (task.description.includes('水源')) {
                const waterResource = colony.resources.find(r => r.type === 'WATER')
                newProgress = Math.min(waterResource?.amount || 0, task.target)
              } else if (task.description.includes('矿物')) {
                const mineralResource = colony.resources.find(r => r.type === 'MINERAL')
                newProgress = Math.min(mineralResource?.amount || 0, task.target)
              } else if (task.description.includes('蚂蚁')) {
                newProgress = Math.min(colony.ants.length, task.target)
              } else if (task.description.includes('房间')) {
                newProgress = Math.min(colony.chambers.length, task.target)
              } else if (task.description.includes('科技')) {
                newProgress = Math.min(colony.technologies.filter(t => t.level > 0).length, task.target)
              }
              break
            }
            case 'MAIN_STORY': {
              if (task.description.includes('王国阶段')) {
                newProgress = colony.evolutionStage === 'KINGDOM' ? 1 : 0
              } else if (task.description.includes('科技分支')) {
                newProgress = colony.technologies.filter(t => t.level > 0).length
              } else if (task.description.includes('四层巢穴')) {
                const layers = new Set(colony.chambers.map(c => c.layer))
                newProgress = layers.size
              }
              break
            }
          }

          completed = newProgress >= task.target

          if (newProgress !== task.progress || completed) {
            const updatedTask = await prisma.task.update({
              where: { id: task.id },
              data: {
                progress: newProgress,
                completed
              }
            })

            updatedTasks.push(updatedTask)

            // 如果任务完成，发放奖励
            if (completed && !task.completed) {
              await completeTask(task, colonyId)
            }
          }
        }

        return {
          success: true,
          message: '任务进度检查完成',
          data: { updatedTasks }
        }
      }

      case 'complete': {
        if (!taskId) {
          return {
            success: false,
            message: '缺少任务ID'
          }
        }

        const task = colony.tasks.find(t => t.id === taskId)
        if (!task) {
          return {
            success: false,
            message: '任务不存在'
          }
        }

        if (task.completed) {
          return {
            success: false,
            message: '任务已完成'
          }
        }

        if (task.progress < task.target) {
          return {
            success: false,
            message: `任务进度不足：${task.progress}/${task.target}`
          }
        }

        await completeTask(task, colonyId)

        return {
          success: true,
          message: '任务完成，奖励已发放',
          data: { task }
        }
      }

      case 'list': {
        return {
          success: true,
          data: {
            tasks: colony.tasks,
            availableTypes: Object.keys(TASK_TEMPLATES)
          }
        }
      }

      default:
        return {
          success: false,
          message: '无效的操作类型'
        }
    }
  } catch (error) {
    console.error('Task management failed:', error)
    return {
      success: false,
      message: '任务管理失败',
      error: error.message
    }
  }
})

// 完成任务并发放奖励
async function completeTask(task: any, colonyId: string) {
  try {
    const reward = JSON.parse(task.reward)
    
    // 标记任务为完成
    await prisma.task.update({
      where: { id: task.id },
      data: { completed: true }
    })

    // 发放经验奖励
    if (reward.experience) {
      await prisma.colony.update({
        where: { id: colonyId },
        data: {
          experience: {
            increment: reward.experience
          }
        }
      })
    }

    // 发放资源奖励
    for (const [resourceType, amount] of Object.entries(reward)) {
      if (resourceType !== 'experience' && resourceType !== 'unlockFeature' && typeof amount === 'number') {
        await prisma.resource.updateMany({
          where: {
            colonyId,
            type: resourceType.toUpperCase()
          },
          data: {
            amount: {
              increment: amount
            }
          }
        })
      }
    }

    // 记录任务完成事件
    await prisma.gameEvent.create({
      data: {
        colonyId,
        type: 'TASK_COMPLETED',
        title: '任务完成',
        description: `完成任务：${task.title}`,
        impact: JSON.stringify({ taskId: task.id, reward })
      }
    })

    // 检查相关成就
    await checkTaskAchievements(colonyId)
  } catch (error) {
    console.error('Task completion failed:', error)
  }
}

// 检查任务相关成就
async function checkTaskAchievements(colonyId: string) {
  try {
    const colony = await prisma.colony.findUnique({
      where: { id: colonyId },
      include: {
        tasks: true,
        player: true
      }
    })

    if (!colony) return

    const completedTasks = colony.tasks.filter(t => t.completed)
    
    // 检查各种成就条件
    const achievements = await prisma.achievement.findMany()
    
    for (const achievement of achievements) {
      const existing = await prisma.playerAchievement.findUnique({
        where: {
          playerId_achievementId: {
            playerId: colony.playerId,
            achievementId: achievement.id
          }
        }
      })

      if (existing) continue // 已获得的成就跳过

      let shouldUnlock = false

      // 根据成就名称检查条件
      switch (achievement.name) {
        case '任务达人':
          shouldUnlock = completedTasks.length >= 10
          break
        case '日常专家':
          shouldUnlock = completedTasks.filter(t => t.type === 'DAILY').length >= 20
          break
        case '周常冠军':
          shouldUnlock = completedTasks.filter(t => t.type === 'WEEKLY').length >= 5
          break
      }

      if (shouldUnlock) {
        await prisma.playerAchievement.create({
          data: {
            playerId: colony.playerId,
            achievementId: achievement.id
          }
        })
      }
    }
  } catch (error) {
    console.error('Achievement check failed:', error)
  }
}