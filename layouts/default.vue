<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-green-800 text-white p-4">
      <h1 class="text-2xl font-bold">🐜 蚂蚁帝国</h1>
    </header>
    
    <main class="container mx-auto p-4">
      <slot />
    </main>
    
    <footer class="bg-gray-800 text-white p-4 text-center">
      <p>&copy; 2024 蚂蚁帝国游戏</p>
    </footer>
  </div>
</template>

<script setup>
// 布局相关的逻辑
</script>

<style scoped>
/* 布局特定样式 */
</style>