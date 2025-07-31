import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { username, password, nickname, email } = body

    // 验证必填字段
    if (!username || !password || !nickname) {
      return {
        success: false,
        message: '用户名、密码和昵称为必填项'
      }
    }

    // 检查用户名是否已存在
    const existingUser = await prisma.player.findUnique({
      where: { username }
    })

    if (existingUser) {
      return {
        success: false,
        message: '用户名已存在'
      }
    }

    // 检查邮箱是否已存在（如果提供了邮箱）
    if (email) {
      const existingEmail = await prisma.player.findUnique({
        where: { email }
      })

      if (existingEmail) {
        return {
          success: false,
          message: '邮箱已被使用'
        }
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    const player = await prisma.player.create({
      data: {
        username,
        password: hashedPassword,
        nickname,
        email: email || null
      }
    })

    // 初始化游戏数据 - 创建殖民地
    const colony = await prisma.colony.create({
      data: {
        name: `${nickname}的蚁穴`,
        playerId: player.id
      }
    })

    // 创建初始资源
    const initialResources = [
      { type: 'FOOD', amount: 100, capacity: 200 },
      { type: 'WATER', amount: 50, capacity: 100 },
      { type: 'MINERAL', amount: 80, capacity: 150 },
      { type: 'WOOD', amount: 25, capacity: 100 },
      { type: 'HONEYDEW', amount: 10, capacity: 50 },
      { type: 'FUNGUS', amount: 5, capacity: 30 }
    ]

    for (const resource of initialResources) {
      await prisma.resource.create({
        data: {
          ...resource,
          colonyId: colony.id
        }
      })
    }

    // 创建初始蚁后宫殿
    await prisma.chamber.create({
      data: {
        type: 'QUEEN_PALACE',
        level: 1,
        layer: 2, // 中层
        capacity: 300,
        efficiency: 1.0,
        maxLevel: 20,
        isUnique: true,
        specialBonus: JSON.stringify({ eggProductionRate: 1.0, queenLevel: 1 }),
        colonyId: colony.id
      }
    })

    // 创建初始入口
    await prisma.chamber.create({
      data: {
        type: 'ENTRANCE',
        level: 1,
        layer: 0, // 地表层
        capacity: 100,
        efficiency: 1.0,
        maxLevel: 5,
        isUnique: true,
        colonyId: colony.id
      }
    })

    // 创建初始蚁后
    await prisma.ant.create({
      data: {
        type: 'QUEEN',
        level: 1,
        health: 200,
        energy: 100,
        efficiency: 1.0,
        status: 'WORKING',
        colonyId: colony.id
      }
    })

    // 生成JWT token
    const token = jwt.sign(
      { playerId: player.id, username: player.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // 设置cookie
    setCookie(event, 'auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7天
    })

    return {
      success: true,
      message: '注册成功',
      data: {
        player: {
          id: player.id,
          username: player.username,
          nickname: player.nickname,
          email: player.email
        },
        colony: {
          id: colony.id,
          name: colony.name
        },
        token
      }
    }
  } catch (error) {
    console.error('Registration failed:', error)
    return {
      success: false,
      message: '注册失败',
      error: error.message
    }
  }
})