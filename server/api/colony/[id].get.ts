import { PrismaClient } from '@prisma/client'
import { createError, defineEventHandler, getRouterParam } from 'h3'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const colonyId = getRouterParam(event, 'id')
  
  if (!colonyId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Colony ID is required'
    })
  }

  try {
    const colony = await prisma.colony.findUnique({
      where: { id: colonyId },
      include: {
        chambers: true,
        ants: true,
        resources: true,
        technologies: true,
        tasks: {
          where: { completed: false }
        }
      }
    })

    if (!colony) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Colony not found'
      })
    }

    return {
      success: true,
      data: colony
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch colony data'
    })
  }
})