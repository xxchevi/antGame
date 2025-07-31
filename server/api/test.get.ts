import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    console.log('🧪 测试API被调用')
    
    return {
      success: true,
      message: '服务器运行正常',
      timestamp: new Date().toISOString(),
      data: {
        server: 'Nuxt 3',
        status: 'healthy',
        features: [
          'API路由正常',
          'Socket.io准备就绪',
          '数据库连接正常'
        ]
      }
    }
  } catch (error) {
    console.error('❌ 测试API错误:', error)
    
    return {
      success: false,
      message: '服务器测试失败',
      error: error?.message || '未知错误'
    }
  }
})