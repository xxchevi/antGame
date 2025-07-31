<template>
  <div class="p-8 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6 text-center">🐜 蚂蚁帝国 - 简化测试版</h1>
    
    <!-- 游戏状态 -->
    <div class="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 class="text-xl font-semibold mb-4">游戏状态</h2>
      <div class="grid grid-cols-3 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-yellow-600">{{ resources.food }}</div>
          <div class="text-sm text-gray-600">食物</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ resources.water }}</div>
          <div class="text-sm text-gray-600">水源</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ resources.wood }}</div>
          <div class="text-sm text-gray-600">木材</div>
        </div>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 class="text-xl font-semibold mb-4">游戏操作</h2>
      <div class="grid grid-cols-2 gap-4">
        <button 
          @click="collectFood" 
          class="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
        >
          收集食物 (+10)
        </button>
        
        <button 
          @click="collectWater" 
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          收集水源 (+5)
        </button>
        
        <button 
          @click="collectWood" 
          class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
        >
          收集木材 (+3)
        </button>
        
        <button 
          @click="resetResources" 
          class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          重置资源
        </button>
      </div>
    </div>
    
    <!-- 蚂蚁管理 -->
    <div class="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 class="text-xl font-semibold mb-4">蚂蚁管理</h2>
      <div class="mb-4">
        <span class="font-medium">蚂蚁数量: </span>
        <span class="text-lg font-bold">{{ ants.length }}</span>
      </div>
      
      <div class="grid grid-cols-2 gap-4 mb-4">
        <button 
          @click="hatchWorker" 
          class="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
          :disabled="resources.food < 20"
        >
          孵化工蚁 (消耗20食物)
        </button>
        
        <button 
          @click="hatchSoldier" 
          class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
          :disabled="resources.food < 30"
        >
          孵化兵蚁 (消耗30食物)
        </button>
      </div>
      
      <div v-if="ants.length > 0" class="max-h-32 overflow-y-auto">
        <div v-for="ant in ants" :key="ant.id" class="flex justify-between items-center p-2 bg-gray-100 rounded mb-1">
          <span>{{ ant.type === 'worker' ? '🐜' : '⚔️' }} {{ ant.type === 'worker' ? '工蚁' : '兵蚁' }}</span>
          <span class="text-sm text-gray-600">ID: {{ ant.id }}</span>
        </div>
      </div>
    </div>
    
    <!-- 游戏日志 -->
    <div class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4">游戏日志</h2>
      <div class="max-h-40 overflow-y-auto bg-gray-100 p-4 rounded">
        <div v-for="(log, index) in gameLogs" :key="index" class="text-sm mb-1">
          <span class="text-gray-500">{{ log.time }}</span> - {{ log.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// 游戏状态
const resources = reactive({
  food: 50,
  water: 30,
  wood: 20
})

const ants = ref([])
const gameLogs = ref([])

// 添加日志
const addLog = (message) => {
  gameLogs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message
  })
  
  // 保持最多50条日志
  if (gameLogs.value.length > 50) {
    gameLogs.value = gameLogs.value.slice(0, 50)
  }
}

// 资源收集
const collectFood = () => {
  resources.food += 10
  addLog('收集了10单位食物')
}

const collectWater = () => {
  resources.water += 5
  addLog('收集了5单位水源')
}

const collectWood = () => {
  resources.wood += 3
  addLog('收集了3单位木材')
}

const resetResources = () => {
  resources.food = 50
  resources.water = 30
  resources.wood = 20
  addLog('资源已重置')
}

// 蚂蚁孵化
const hatchWorker = () => {
  if (resources.food >= 20) {
    resources.food -= 20
    const newAnt = {
      id: Date.now(),
      type: 'worker',
      hatchTime: new Date()
    }
    ants.value.push(newAnt)
    addLog('孵化了一只工蚁')
  }
}

const hatchSoldier = () => {
  if (resources.food >= 30) {
    resources.food -= 30
    const newAnt = {
      id: Date.now(),
      type: 'soldier',
      hatchTime: new Date()
    }
    ants.value.push(newAnt)
    addLog('孵化了一只兵蚁')
  }
}

// 初始化
addLog('游戏开始！欢迎来到蚂蚁帝国')
</script>