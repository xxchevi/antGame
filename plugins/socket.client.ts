import { io } from 'socket.io-client'

export default defineNuxtPlugin(() => {
  let socket: Socket | null = null
  const isConnected = ref(false)
  const connectionError = ref<string | null>(null)

  // 只在客户端初始化Socket连接
  if (process.client) {
    try {
      // 尝试连接多个端口
      const tryPorts = [3000, 3001, 3002, 3003]
      let connected = false
      
      for (const port of tryPorts) {
        try {
          socket = io(`http://localhost:${port}`, {
            autoConnect: false, // 先不自动连接
            reconnection: true,
            reconnectionAttempts: 3,
            reconnectionDelay: 1000,
            timeout: 2000
          })
          
          // 监听连接成功事件
          socket.on('connect', () => {
            console.log(`🔌 Socket.io连接成功，端口: ${port}`)
            isConnected.value = true
            connectionError.value = null
            connected = true
          })
          
          // 监听连接错误
          socket.on('connect_error', (error) => {
            console.warn(`⚠️ 端口 ${port} 连接失败:`, error?.message || error)
            isConnected.value = false
            if (!connected) {
              socket?.disconnect()
            }
          })
          
          // 监听断开连接
          socket.on('disconnect', (reason) => {
            console.log('Socket连接断开:', reason)
            isConnected.value = false
          })
          
          // 监听资源生产事件
          socket.on('resource_production', (data) => {
            console.log('📦 收到资源生产事件:', data)
            // 这里可以更新前端的资源显示
            // 触发资源更新事件
            if (window.gameEventBus) {
              window.gameEventBus.emit('resourceUpdate', data)
            }
          })
          
          // 启动自动化处理定时器
          startAutomationTimer()
          
          // 尝试连接
          socket.connect()
          break
        } catch (error) {
          console.warn(`⚠️ 端口 ${port} 初始化失败:`, error)
        }
      }
      
      if (!socket) {
        console.warn('⚠️ Socket.io客户端初始化失败，游戏将在离线模式运行')
        connectionError.value = 'Socket连接失败，游戏在离线模式运行'
      }
    } catch (globalError) {
      console.error('❌ Socket.io客户端全局错误:', globalError)
      connectionError.value = '客户端初始化失败'
    }
  }
  
  // 只在客户端且Socket存在时设置事件监听
  if (socket) {
    socket.on('connect', () => {
      console.log('✅ 已连接到游戏服务器')
      isConnected.value = true
      connectionError.value = null
    })
    
    socket.on('disconnect', () => {
      console.log('⚠️ 与游戏服务器断开连接')
      isConnected.value = false
    })
    
    socket.on('connect_error', (error) => {
      console.error('❌ 连接错误:', error)
      connectionError.value = error.message
    })
  }
  
  // 游戏事件处理
  const gameEvents = {
    // 加入游戏
    joinGame: (playerId: string, colonyId: string) => {
      if (socket && socket.connected) {
        socket.emit('join-game', { playerId, colonyId })
        console.log('🎮 加入游戏:', { playerId, colonyId })
      }
    },
    
    // 资源生产
    produceResources: (colonyId: string, resourceType: string, amount: number) => {
      if (socket && socket.connected) {
        socket.emit('produce-resources', { colonyId, resourceType, amount })
        console.log('📦 资源生产:', { resourceType, amount })
      }
    },
    
    // 房间升级
    upgradeChamber: (colonyId: string, chamberId: string, newLevel: number) => {
      if (socket && socket.connected) {
        socket.emit('chamber-upgraded', { colonyId, chamberId, newLevel })
        console.log('⬆️ 房间升级:', { chamberId, newLevel })
      }
    },
    
    // 蚂蚁孵化
    hatchAnt: (colonyId: string, antType: string, antId: string) => {
      if (socket && socket.connected) {
        socket.emit('ant-hatched', { colonyId, antType, antId })
        console.log('🥚 蚂蚁孵化:', { antType, antId })
      }
    },
    
    // 任务完成
    completeTask: (colonyId: string, taskId: string, reward: any) => {
      if (socket && socket.connected) {
        socket.emit('task-completed', { colonyId, taskId, reward })
        console.log('✅ 任务完成:', { taskId, reward })
      }
    },
    
    // 科技研究
    researchTech: (colonyId: string, techType: string, newLevel: number) => {
      if (socket && socket.connected) {
        socket.emit('tech-researched', { colonyId, techType, newLevel })
        console.log('🔬 科技研究:', { techType, newLevel })
      }
    },
    
    // 心跳
    ping: () => {
      if (socket && socket.connected) {
        socket.emit('ping')
      }
    }
  }
  
  // 游戏事件监听器
  const gameListeners = {
    // 监听资源更新
    onResourceUpdate: (callback: (data: any) => void) => {
      if (socket) {
        socket.on('resource-updated', callback)
      }
    },
    
    // 监听房间更新
    onChamberUpdate: (callback: (data: any) => void) => {
      if (socket) {
        socket.on('chamber-update', callback)
      }
    },
    
    // 监听新蚂蚁
    onNewAnt: (callback: (data: any) => void) => {
      if (socket) {
        socket.on('new-ant', callback)
      }
    },
    
    // 监听任务完成
    onTaskComplete: (callback: (data: any) => void) => {
      if (socket) {
        socket.on('task-complete', callback)
      }
    },
    
    // 监听科技更新
    onTechUpdate: (callback: (data: any) => void) => {
      if (socket) {
        socket.on('tech-update', callback)
      }
    },
    
    // 监听自动资源生产
    onAutoResourceProduction: (callback: (data: any) => void) => {
      if (socket) {
        socket.on('auto-resource-production', callback)
      }
    },
    
    // 监听游戏加入确认
    onGameJoined: (callback: (data: any) => void) => {
      if (socket) {
        socket.on('game-joined', callback)
      }
    },
    
    // 监听心跳响应
    onPong: (callback: () => void) => {
      if (socket) {
        socket.on('pong', callback)
      }
    }
  }
  
  // 清理监听器
  const removeListener = (event: string, callback: Function) => {
    if (socket) {
      socket.off(event, callback)
    }
  }
  
  // 自动化处理定时器
  function startAutomationTimer() {
    if (process.client) {
      setInterval(async () => {
        try {
          // 检查是否有登录状态
          const playerInfo = localStorage.getItem('playerInfo')
          if (!playerInfo) return
          
          const player = JSON.parse(playerInfo)
          if (!player.colonyId) return
          
          // 调用自动化处理API
          const response = await $fetch('/api/automation/process', {
            method: 'POST',
            body: {
              action: 'auto_process',
              colonyId: player.colonyId
            }
          })
          
          if (response.success && response.data) {
            // 触发游戏数据更新事件
            if (window.gameEventBus) {
              window.gameEventBus.emit('automationUpdate', response.data)
            }
          }
        } catch (error) {
          // 静默处理错误，避免干扰用户体验
          console.debug('自动化处理错误:', error)
        }
      }, 5000) // 每5秒执行一次
    }
  }

  // 提供给应用使用
  return {
    provide: {
      socket,
      gameSocket: {
        isConnected: readonly(isConnected),
        connectionError: readonly(connectionError),
        events: gameEvents,
        listeners: gameListeners,
        removeListener
      }
    }
  }
})