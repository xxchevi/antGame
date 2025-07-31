import { Server } from 'socket.io'

export default defineNuxtPlugin(async (nuxtApp) => {
  // 只在服务器端运行
  if (process.client) {
    return
  }
  
  // 只在生产环境或开发环境中启动Socket服务器
  if (!nuxtApp || typeof nuxtApp !== 'object') {
    console.warn('⚠️ NuxtApp未正确初始化，跳过Socket.io服务器启动')
    return
  }
  
  let io: Server
  
  try {
    // 尝试多个端口，找到可用的端口
    const tryPorts = [3002, 3003, 3004, 3005]
    let serverStarted = false
    
    for (const port of tryPorts) {
      try {
        io = new Server(port, {
          cors: {
            origin: "*",
            methods: ["GET", "POST"]
          }
        })
        console.log(`🚀 Socket.io 服务器启动成功，端口: ${port}`)
        serverStarted = true
        break
      } catch (error) {
        console.warn(`⚠️ 端口 ${port} 被占用，尝试下一个端口`)
      }
    }
    
    if (!serverStarted) {
      console.warn('⚠️ 所有端口都被占用，Socket.io 服务器启动失败，游戏将在离线模式运行')
      return
    }
  } catch (globalError) {
    console.error('❌ Socket.io 服务器初始化失败:', globalError)
    return
  }

  // 游戏状态管理
  const gameState = new Map()
  
  io.on('connection', (socket) => {
    console.log('玩家连接:', socket.id)

    // 玩家加入游戏
    socket.on('join-game', (data) => {
      const { playerId, colonyId } = data
      socket.join(`colony-${colonyId}`)
      
      // 初始化玩家状态
      gameState.set(socket.id, {
        playerId,
        colonyId,
        lastActivity: Date.now()
      })

      socket.emit('game-joined', { success: true })
    })

    // 资源生产事件
    socket.on('produce-resources', (data) => {
      const { colonyId, resourceType, amount } = data
      
      // 广播资源更新给同一巢穴的所有玩家
      socket.to(`colony-${colonyId}`).emit('resource-updated', {
        resourceType,
        amount,
        timestamp: Date.now()
      })
    })

    // 房间升级事件
    socket.on('chamber-upgraded', (data) => {
      const { colonyId, chamberId, newLevel } = data
      
      socket.to(`colony-${colonyId}`).emit('chamber-update', {
        chamberId,
        newLevel,
        timestamp: Date.now()
      })
    })

    // 蚂蚁孵化事件
    socket.on('ant-hatched', (data) => {
      const { colonyId, antType, antId } = data
      
      socket.to(`colony-${colonyId}`).emit('new-ant', {
        antType,
        antId,
        timestamp: Date.now()
      })
    })

    // 任务完成事件
    socket.on('task-completed', (data) => {
      const { colonyId, taskId, reward } = data
      
      socket.to(`colony-${colonyId}`).emit('task-complete', {
        taskId,
        reward,
        timestamp: Date.now()
      })
    })

    // 科技研究完成
    socket.on('tech-researched', (data) => {
      const { colonyId, techType, newLevel } = data
      
      socket.to(`colony-${colonyId}`).emit('tech-update', {
        techType,
        newLevel,
        timestamp: Date.now()
      })
    })

    // 玩家断开连接
    socket.on('disconnect', () => {
      console.log('玩家断开连接:', socket.id)
      gameState.delete(socket.id)
    })

    // 心跳检测
    socket.on('ping', () => {
      const playerState = gameState.get(socket.id)
      if (playerState) {
        playerState.lastActivity = Date.now()
        gameState.set(socket.id, playerState)
      }
      socket.emit('pong')
    })
  })

  // 定时任务：资源自动生产
  setInterval(() => {
    gameState.forEach((playerState, socketId) => {
      const socket = io.sockets.sockets.get(socketId)
      if (socket) {
        // 模拟资源自动生产
        const resourceProduction = {
          FOOD: Math.floor(Math.random() * 10) + 5,
          WATER: Math.floor(Math.random() * 5) + 2,
          MINERAL: Math.floor(Math.random() * 3) + 1
        }

        socket.emit('auto-resource-production', {
          resources: resourceProduction,
          timestamp: Date.now()
        })
      }
    })
  }, 30000) // 每30秒自动生产资源

  // 清理非活跃连接
  setInterval(() => {
    const now = Date.now()
    gameState.forEach((playerState, socketId) => {
      if (now - playerState.lastActivity > 300000) { // 5分钟无活动
        const socket = io.sockets.sockets.get(socketId)
        if (socket) {
          socket.disconnect()
        }
        gameState.delete(socketId)
      }
    })
  }, 60000) // 每分钟检查一次

  console.log('Socket.io 服务器启动在端口 3001')
})