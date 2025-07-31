import { ref, computed, readonly } from 'vue'

export const useGame = () => {
  // 游戏状态
  const colony = ref(null)
  const resources = ref([])
  const chambers = ref([])
  const ants = ref([])
  const technologies = ref([])
  const tasks = ref([])
  const achievements = ref([])
  
  // 加载状态
  const isLoading = ref(false)
  const error = ref(null)
  
  // Socket连接
  let $gameSocket = null
  if (process.client) {
    try {
      const nuxtApp = useNuxtApp()
      $gameSocket = nuxtApp.$gameSocket
    } catch (err) {
      console.warn('⚠️ Socket未初始化:', err)
    }
  }
  
  // 初始化游戏
  const initGame = async (playerId: string, colonyId: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      console.log('🎮 初始化游戏，玩家ID:', playerId, '殖民地ID:', colonyId)
      
      // 加载巢穴数据
      const { data } = await $fetch(`/api/colony/${colonyId}`)
      
      colony.value = data
      resources.value = data.resources || []
      chambers.value = data.chambers || []
      ants.value = data.ants || []
      technologies.value = data.technologies || []
      tasks.value = data.tasks || []
      
      console.log('✅ 殖民地数据加载成功:', data)
      
      // 连接Socket
      if ($gameSocket && $gameSocket.emit) {
        $gameSocket.emit('join-game', { playerId, colonyId })
        console.log('🔌 Socket连接成功，已加入游戏房间')
        
        // 设置事件监听
        setupSocketListeners()
      } else {
        console.warn('⚠️ Socket未连接，无法加入游戏房间')
      }
      
    } catch (err) {
      let errorMessage = '游戏初始化失败'
      
      if (err) {
        if (typeof err === 'string') {
          errorMessage = err
        } else if (typeof err === 'object' && err.message) {
          errorMessage = err.message
        }
      }
      
      error.value = errorMessage
      console.error('❌ 游戏初始化失败:', errorMessage)
      console.error('原始错误:', err)
    } finally {
      isLoading.value = false
    }
  }
  
  // 设置Socket事件监听
  const setupSocketListeners = () => {
    if (!$gameSocket || !$gameSocket.on) {
      console.warn('⚠️ Socket监听器未初始化')
      return
    }
    
    console.log('🔧 设置Socket事件监听器')
    
    // 监听资源更新
    $gameSocket.on('resource-update', (data) => {
      console.log('📦 收到资源更新:', data)
      updateResource(data.resourceType, data.amount)
    })
    
    // 监听房间更新
    $gameSocket.on('chamber-update', (data) => {
      console.log('🏠 收到房间更新:', data)
      updateChamber(data.chamberId, { level: data.newLevel })
    })
    
    // 监听新蚂蚁
    $gameSocket.on('new-ant', (data) => {
      console.log('🐜 收到新蚂蚁:', data)
      addAnt(data.antType, data.antId)
    })
    
    // 监听任务完成
    $gameSocket.on('task-complete', (data) => {
      console.log('✅ 收到任务完成:', data)
      completeTask(data.taskId, data.reward)
    })
    
    // 监听科技更新
    $gameSocket.on('tech-update', (data) => {
      console.log('🔬 收到科技更新:', data)
      updateTechnology(data.techType, data.newLevel)
    })
    
    // 监听自动资源生产
    $gameSocket.on('auto-resource-production', (data) => {
      console.log('⚡ 收到自动资源生产:', data)
      Object.entries(data.resources).forEach(([type, amount]) => {
        updateResource(type, amount as number)
      })
    })
  }
  
  // 资源管理
  const updateResource = (resourceType: string, amount: number) => {
    const resource = resources.value.find(r => r.type === resourceType)
    if (resource) {
      resource.amount = Math.max(0, Math.min(resource.capacity, resource.amount + amount))
    }
    
    // 通知其他玩家
    if ($gameSocket && $gameSocket.emit) {
      $gameSocket.emit('produce-resources', {
        colonyId: colony.value?.id,
        resourceType,
        amount
      })
    }
  }
  
  const getResource = (resourceType: string) => {
    return resources.value.find(r => r.type === resourceType)
  }
  
  const hasEnoughResources = (costs: Record<string, number>) => {
    return Object.entries(costs).every(([type, amount]) => {
      const resource = getResource(type)
      return resource && resource.amount >= amount
    })
  }
  
  // 房间管理
  const updateChamber = (chamberId: string, updates: any) => {
    const chamber = chambers.value.find(c => c.id === chamberId)
    if (chamber) {
      Object.assign(chamber, updates)
    }
  }
  
  const upgradeChamber = async (chamberId: string) => {
    try {
      const { data } = await $fetch('/api/chamber/upgrade', {
        method: 'POST',
        body: {
          chamberId,
          colonyId: colony.value?.id
        }
      })
      
      updateChamber(chamberId, data)
      
      // 通知其他玩家
      if ($gameSocket && $gameSocket.emit) {
        $gameSocket.emit('upgrade-chamber', {
          colonyId: colony.value?.id,
          chamberId,
          level: data.level
        })
      }
      
      return data
    } catch (err) {
      const errorMessage = (err && typeof err === 'object' && 'message' in err) ? err.message : '房间升级失败'
      error.value = errorMessage
      throw err
    }
  }
  
  // 蚂蚁管理
  const addAnt = (antType: string, antId?: string) => {
    const newAnt = {
      id: antId || generateId(),
      type: antType,
      level: 1,
      experience: 0,
      health: 100,
      energy: 100,
      efficiency: 1.0,
      colonyId: colony.value?.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    ants.value.push(newAnt)
    
    // 通知其他玩家
    if ($gameSocket && $gameSocket.emit) {
      $gameSocket.emit('hatch-ant', {
        colonyId: colony.value?.id,
        antType,
        antId: newAnt.id
      })
    }
    
    return newAnt
  }
  
  const getAntsByType = (antType: string) => {
    return ants.value.filter(ant => ant.type === antType)
  }
  
  const getTotalAnts = () => {
    return ants.value.length
  }
  
  // 科技管理
  const updateTechnology = (techType: string, newLevel: number) => {
    const tech = technologies.value.find(t => t.type === techType)
    if (tech) {
      tech.level = newLevel
    } else {
      technologies.value.push({
        id: generateId(),
        type: techType,
        level: newLevel,
        colonyId: colony.value?.id,
        unlockedAt: new Date()
      })
    }
  }
  
  const researchTechnology = async (techType: string) => {
    const tech = technologies.value.find(t => t.type === techType)
    const currentLevel = tech ? tech.level : 0
    const newLevel = currentLevel + 1
    
    // 计算研究成本
    const researchCost = {
      FOOD: newLevel * 200,
      MINERAL: newLevel * 100
    }
    
    if (!hasEnoughResources(researchCost)) {
      throw new Error('资源不足，无法研究科技')
    }
    
    // 扣除资源
    Object.entries(researchCost).forEach(([type, amount]) => {
      updateResource(type, -amount)
    })
    
    // 更新科技
    updateTechnology(techType, newLevel)
    
    // 通知其他玩家
    if ($gameSocket && $gameSocket.emit) {
      $gameSocket.emit('research-tech', {
        colonyId: colony.value?.id,
        techType,
        level: newLevel
      })
    }
    
    return newLevel
  }
  
  // 任务管理
  const updateTaskProgress = (taskId: string, progress: number) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.progress = Math.min(task.target, progress)
      if (task.progress >= task.target && !task.completed) {
        completeTask(taskId, task.reward)
      }
    }
  }
  
  const completeTask = (taskId: string, reward: any) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.completed = true
      
      // 处理奖励
      if (typeof reward === 'object') {
        Object.entries(reward).forEach(([type, amount]) => {
          updateResource(type, amount as number)
        })
      }
      
      // 通知其他玩家
      if ($gameSocket && $gameSocket.emit) {
        $gameSocket.emit('complete-task', {
          colonyId: colony.value?.id,
          taskId,
          reward
        })
      }
    }
  }
  
  // 工具函数
  const generateId = () => {
    return Math.random().toString(36).substr(2, 9)
  }
  
  // 计算属性
  const colonyLevel = computed(() => colony.value?.level || 1)
  const totalAnts = computed(() => getTotalAnts())
  const activeTasks = computed(() => tasks.value.filter(t => !t.completed))
  const completedTasks = computed(() => tasks.value.filter(t => t.completed))
  
  // 按层级分组的房间
  const chambersByLayer = computed(() => {
    return {
      surface: chambers.value.filter(c => c.layer === 0),
      upper: chambers.value.filter(c => c.layer === 1),
      middle: chambers.value.filter(c => c.layer === 2),
      deep: chambers.value.filter(c => c.layer === 3)
    }
  })
  
  // 按类型分组的蚂蚁
  const antsByType = computed(() => {
    const grouped = {}
    ants.value.forEach(ant => {
      if (!grouped[ant.type]) {
        grouped[ant.type] = []
      }
      grouped[ant.type].push(ant)
    })
    return grouped
  })
  
  return {
    // 状态
    colony: readonly(colony),
    resources: readonly(resources),
    chambers: readonly(chambers),
    ants: readonly(ants),
    technologies: readonly(technologies),
    tasks: readonly(tasks),
    achievements: readonly(achievements),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // 计算属性
    colonyLevel,
    totalAnts,
    activeTasks,
    completedTasks,
    chambersByLayer,
    antsByType,
    
    // 方法
    initGame,
    updateResource,
    getResource,
    hasEnoughResources,
    upgradeChamber,
    addAnt,
    getAntsByType,
    researchTechnology,
    updateTaskProgress,
    completeTask
  }
}