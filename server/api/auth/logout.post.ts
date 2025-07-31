export default defineEventHandler(async (event) => {
  try {
    // 清除cookie
    setCookie(event, 'auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0 // 立即过期
    })

    return {
      success: true,
      message: '登出成功'
    }
  } catch (error) {
    console.error('Logout failed:', error)
    return {
      success: false,
      message: '登出失败',
      error: error.message
    }
  }
})