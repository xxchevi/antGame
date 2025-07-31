<template>
  <div class="min-h-screen bg-gradient-to-br from-amber-50 to-green-100 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- 游戏标题 -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-amber-800 mb-2">🐜 蚂蚁帝国</h1>
        <p class="text-lg text-green-700">建造你的地下王国</p>
      </div>

      <!-- 游戏状态面板 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- 资源面板 -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span class="mr-2">📦</span>资源状况
          </h2>
          <div class="space-y-3">
            <div v-for="resource in resources" :key="resource.type" class="flex justify-between items-center">
              <span class="text-gray-600">{{ getResourceName(resource.type) }}</span>
              <span class="font-semibold text-green-600">{{ resource.amount }}</span>
            </div>
          </div>
          <button 
            @click="addResources" 
            class="mt-4 w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
          >
            添加资源
          </button>
        </div>

        <!-- 巢穴面板 -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span class="mr-2">🏠</span>巢穴建筑
          </h2>
          <div class="space-y-3">
            <div v-for="chamber in chambers" :key="chamber.id" class="flex justify-between items-center">
              <span class="text-gray-600">{{ getChamberName(chamber.type) }}</span>
              <span class="text-sm text-blue-600">Lv.{{ chamber.level }}</span>
            </div>
          </div>
          <div class="mt-4 space-y-2">
            <button 
              @click="buildChamber('STORAGE')" 
              class="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
            >
              建造储藏室
            </button>
            <button 
              @click="buildChamber('NURSERY')" 
              class="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 transition-colors"
            >
              建造育婴室
            </button>
          </div>
        </div>

        <!-- 蚂蚁面板 -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span class="mr-2">🐜</span>蚁群状况
          </h2>
          <div class="space-y-3">
            <div v-for="ant in ants" :key="ant.id" class="flex justify-between items-center">
              <span class="text-gray-600">{{ getAntName(ant.type) }}</span>
              <span class="text-sm" :class="getStatusColor(ant.status)">{{ getStatusName(ant.status) }}</span>
            </div>
          </div>
          <button 
            @click="recruitAnt" 
            class="mt-4 w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 transition-colors"
          >
            招募工蚁
          </button>
        </div>
      </div>

      <!-- 功能面板 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 科技研究 -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span class="mr-2">🔬</span>科技研究
          </h2>
          <div class="space-y-3">
            <div v-for="tech in technologies" :key="tech.id" class="flex justify-between items-center">
              <span class="text-gray-600">{{ tech.name }}</span>
              <span class="text-sm text-green-600">Lv.{{ tech.level }}/{{ tech.maxLevel }}</span>
            </div>
          </div>
          <button 
            @click="researchTech" 
            class="mt-4 w-full bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600 transition-colors"
          >
            研究基础采集
          </button>
        </div>

        <!-- 任务系统 -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span class="mr-2">📋</span>任务系统
          </h2>
          <div class="space-y-3">
            <div v-for="task in tasks" :key="task.id" class="border rounded p-3">
              <div class="font-medium text-gray-800">{{ task.title }}</div>
              <div class="text-sm text-gray-600 mt-1">{{ task.description }}</div>
              <div class="mt-2">
                <div class="bg-gray-200 rounded-full h-2">
                  <div 
                    class="bg-green-500 h-2 rounded-full transition-all duration-300" 
                    :style="{ width: (task.progress / task.target * 100) + '%' }"
                  ></div>
                </div>
                <div class="text-xs text-gray-500 mt-1">{{ task.progress }}/{{ task.target }}</div>
              </div>
            </div>
          </div>
          <button 
            @click="generateTask" 
            class="mt-4 w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition-colors"
          >
            生成日常任务
          </button>
        </div>
      </div>

      <!-- 消息提示 -->
      <div v-if="message" class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const colonyId = 'colony1'
const resources = ref([])
const chambers = ref([])
const ants = ref([])
const technologies = ref([])
const tasks = ref([])
const message = ref('')

// 获取游戏数据
async function fetchGameData() {
  try {
    // 获取殖民地信息
    const colonyResponse = await $fetch(`/api/colony/${colonyId}`)
    if (colonyResponse.success) {
      resources.value = colonyResponse.data.resources
      chambers.value = colonyResponse.data.chambers
      ants.value = colonyResponse.data.ants
      technologies.value = colonyResponse.data.technologies
      tasks.value = colonyResponse.data.tasks
    }
  } catch (error) {
    console.error('获取游戏数据失败:', error)
  }
}

// 添加资源
async function addResources() {
  try {
    await $fetch('/api/resource/manage', {
      method: 'POST',
      body: {
        action: 'add',
        colonyId,
        resourceType: 'FOOD',
        amount: 100
      }
    })
    
    await $fetch('/api/resource/manage', {
      method: 'POST',
      body: {
        action: 'add',
        colonyId,
        resourceType: 'WATER',
        amount: 50
      }
    })
    
    await $fetch('/api/resource/manage', {
      method: 'POST',
      body: {
        action: 'add',
        colonyId,
        resourceType: 'MINERAL',
        amount: 80
      }
    })
    
    showMessage('资源添加成功！')
    await fetchGameData()
  } catch (error) {
    console.error('添加资源失败:', error)
  }
}

// 建造房间
async function buildChamber(chamberType) {
  try {
    const response = await $fetch('/api/chamber/build', {
      method: 'POST',
      body: {
        colonyId,
        chamberType
      }
    })
    
    if (response.success) {
      showMessage(`${getChamberName(chamberType)}建造成功！`)
      await fetchGameData()
    } else {
      showMessage(response.message)
    }
  } catch (error) {
    console.error('建造房间失败:', error)
  }
}

// 招募蚂蚁
async function recruitAnt() {
  try {
    const response = await $fetch('/api/ant/manage', {
      method: 'POST',
      body: {
        action: 'recruit',
        colonyId,
        antType: 'WORKER'
      }
    })
    
    if (response.success) {
      showMessage('工蚁招募成功！')
      await fetchGameData()
    } else {
      showMessage(response.message)
    }
  } catch (error) {
    console.error('招募蚂蚁失败:', error)
  }
}

// 研究科技
async function researchTech() {
  try {
    const response = await $fetch('/api/technology/research', {
      method: 'POST',
      body: {
        action: 'research',
        colonyId,
        techType: 'COLLECTION',
        techName: '基础采集'
      }
    })
    
    if (response.success) {
      showMessage('科技研究成功！')
      await fetchGameData()
    } else {
      showMessage(response.message)
    }
  } catch (error) {
    console.error('科技研究失败:', error)
  }
}

// 生成任务
async function generateTask() {
  try {
    const response = await $fetch('/api/task/manage', {
      method: 'POST',
      body: {
        action: 'generate',
        colonyId,
        taskType: 'DAILY'
      }
    })
    
    if (response.success) {
      showMessage('任务生成成功！')
      await fetchGameData()
    } else {
      showMessage(response.message)
    }
  } catch (error) {
    console.error('生成任务失败:', error)
  }
}

// 显示消息
function showMessage(msg) {
  message.value = msg
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

// 辅助函数
function getResourceName(type) {
  const names = {
    FOOD: '食物',
    WATER: '水源',
    MINERAL: '矿物',
    WOOD: '木材',
    HONEYDEW: '蜜露',
    FUNGUS: '真菌'
  }
  return names[type] || type
}

function getChamberName(type) {
  const names = {
    STORAGE: '储藏室',
    NURSERY: '育婴室',
    QUEEN_PALACE: '蚁后宫殿',
    RESOURCE_PROCESSING: '资源加工室',
    FUNGUS_GARDEN: '真菌园'
  }
  return names[type] || type
}

function getAntName(type) {
  const names = {
    WORKER: '工蚁',
    SOLDIER: '兵蚁',
    BUILDER: '建筑蚁',
    SCOUT: '侦察蚁'
  }
  return names[type] || type
}

function getStatusName(status) {
  const names = {
    IDLE: '空闲',
    WORKING: '工作中',
    RESTING: '休息中'
  }
  return names[status] || status
}

function getStatusColor(status) {
  const colors = {
    IDLE: 'text-gray-500',
    WORKING: 'text-green-600',
    RESTING: 'text-blue-600'
  }
  return colors[status] || 'text-gray-500'
}

// 页面加载时获取数据
onMounted(() => {
  fetchGameData()
})
</script>