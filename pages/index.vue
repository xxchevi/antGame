<template>
  <div class="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-green-100 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- 登录注册界面 -->
      <div v-if="!isLoggedIn" class="auth-container">
        <div class="auth-panel bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <h1 class="text-4xl font-bold text-amber-800 mb-6 text-center">🐜 蚂蚁帝国</h1>
          <div class="auth-tabs flex mb-6">
            <button @click="authMode = 'login'" :class="{ 'bg-amber-500 text-white': authMode === 'login', 'bg-gray-200': authMode !== 'login' }" class="flex-1 py-2 px-4 rounded-l">登录</button>
            <button @click="authMode = 'register'" :class="{ 'bg-amber-500 text-white': authMode === 'register', 'bg-gray-200': authMode !== 'register' }" class="flex-1 py-2 px-4 rounded-r">注册</button>
          </div>
          
          <!-- 登录表单 -->
          <form v-if="authMode === 'login'" @submit.prevent="login" class="auth-form space-y-4">
            <input v-model="loginForm.username" type="text" placeholder="用户名" required class="w-full p-3 border rounded">
            <input v-model="loginForm.password" type="password" placeholder="密码" required class="w-full p-3 border rounded">
            <button type="submit" class="w-full bg-amber-500 text-white py-3 rounded hover:bg-amber-600">登录</button>
          </form>
          
          <!-- 注册表单 -->
          <form v-if="authMode === 'register'" @submit.prevent="register" class="auth-form space-y-4">
            <input v-model="registerForm.username" type="text" placeholder="用户名" required class="w-full p-3 border rounded">
            <input v-model="registerForm.password" type="password" placeholder="密码" required class="w-full p-3 border rounded">
            <input v-model="registerForm.nickname" type="text" placeholder="昵称" required class="w-full p-3 border rounded">
            <input v-model="registerForm.email" type="email" placeholder="邮箱（选填）" class="w-full p-3 border rounded">
            <button type="submit" class="w-full bg-amber-500 text-white py-3 rounded hover:bg-amber-600">注册</button>
          </form>
          
          <div v-if="authMessage" class="auth-message mt-4 p-3 rounded" :class="{ 'bg-red-100 text-red-700': authError, 'bg-green-100 text-green-700': !authError }">{{ authMessage }}</div>
        </div>
      </div>

      <!-- 游戏主界面 -->
      <div v-else class="game-main flex h-screen bg-gradient-to-br from-amber-50 to-green-100">
        <!-- 侧边栏菜单 -->
        <div class="sidebar w-64 bg-gradient-to-b from-amber-900 via-amber-800 to-amber-700 text-white shadow-2xl border-r border-amber-600">
          <div class="sidebar-header p-6 border-b border-amber-700">
            <h1 class="text-2xl font-bold flex items-center">
              🐜 <span class="ml-2">蚂蚁帝国</span>
            </h1>
            <p class="text-amber-200 text-sm mt-1">{{ playerInfo?.nickname }}的蚁穴</p>
          </div>
          
          <nav class="sidebar-nav p-4">
            <div class="space-y-2">
              <button 
                v-for="tab in menuTabs" 
                :key="tab.id"
                @click="activeTab = tab.id"
                :class="{
                  'bg-amber-600 text-white shadow-lg': activeTab === tab.id,
                  'text-amber-200 hover:bg-amber-700 hover:text-white': activeTab !== tab.id
                }"
                class="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center"
              >
                <span class="text-xl mr-3">{{ tab.icon }}</span>
                <span class="font-medium">{{ tab.name }}</span>
              </button>
            </div>
            
            <!-- 登出按钮移到菜单下方 -->
            <div class="mt-6 pt-4 border-t border-amber-700">
              <button @click="logout" class="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors">
                🚪 登出
              </button>
            </div>
          </nav>
        </div>
        
        <!-- 主内容区域 -->
        <div class="main-content flex-1 overflow-y-auto">
          <div class="content-header bg-gradient-to-r from-white to-gray-50 shadow-lg p-6 border-b border-gray-200">
            <h2 class="text-3xl font-bold text-gray-800 flex items-center">
              <span class="text-3xl mr-4 p-2 bg-amber-100 rounded-lg">{{ getCurrentTabIcon() }}</span>
              <div>
                <div class="text-2xl">{{ getCurrentTabName() }}</div>
                <p class="text-gray-600 text-sm mt-1">{{ getCurrentTabDescription() }}</p>
              </div>
            </h2>
          </div>
          
          <div class="content-body p-6">
            <!-- 资源总览模块 -->
            <div v-if="activeTab === 'overview'" class="tab-content">
              <h3 class="text-xl font-bold text-gray-800 mb-6">🏠 巢穴总览</h3>
              
        <!-- 游戏状态面板 -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- 资源面板 -->
        <div class="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-xl p-6 border border-blue-100">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span class="mr-3 text-2xl p-2 bg-blue-100 rounded-lg">📦</span>
            <span class="text-blue-800">资源状况</span>
          </h2>
          <div class="space-y-3">
            <div v-for="resource in resources" :key="resource.type" class="resource-item">
              <div class="flex justify-between items-center mb-1">
                <span class="text-gray-600">{{ getResourceName(resource.type) }}</span>
                <span class="font-semibold text-green-600">{{ resource.amount }}/{{ getResourceLimit(resource.type) }}</span>
              </div>
              <div class="flex justify-between items-center text-xs text-gray-500">
                <span>获取速度: +{{ getResourceProductionRate(resource.type) }}/秒</span>
                <div class="w-24 bg-gray-200 rounded-full h-1.5">
                  <div class="bg-green-500 h-1.5 rounded-full" :style="{ width: Math.min(100, (resource.amount / getResourceLimit(resource.type)) * 100) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div class="flex items-center text-sm text-blue-800">
              <span class="mr-2">⚡</span>
              <span>资源自动生产中，基于巢穴建筑和蚂蚁工作效率</span>
            </div>
          </div>
        </div>

        </div>
            </div>
            
            <!-- 建设模块 -->
            <div v-if="activeTab === 'building'" class="tab-content">
              <h3 class="text-xl font-bold text-gray-800 mb-6">🏗️ 蚂蚁巢穴地图</h3>
              
        <!-- 蚂蚁巢穴地下视图 -->
        <div class="bg-gradient-to-b from-sky-100 via-amber-50 to-amber-100 rounded-xl shadow-xl p-6 border border-amber-200 relative overflow-hidden">
          <!-- 地面线 -->
          <div class="absolute top-0 left-0 right-0 h-1 bg-green-400 shadow-sm"></div>
          <div class="absolute top-1 left-0 right-0 h-8 bg-gradient-to-b from-green-300 to-amber-200 flex items-center justify-center">
            <span class="text-xs text-green-800 font-medium">🌱 地面 🌱</span>
          </div>
          
          <h2 class="text-xl font-semibold text-gray-800 mb-6 mt-8 flex items-center justify-center">
            <span class="mr-3 text-2xl p-2 bg-amber-100 rounded-full shadow-md">🐜</span>
            <span class="text-amber-800">蚂蚁巢穴结构图</span>
          </h2>
          
          <div class="nest-layers space-y-4" @click="showBuildMenuFor = null">
             <div v-for="(layer, index) in layers" :key="layer.id" class="layer-section relative" @click.stop>
              <!-- 层级深度指示器 -->
              <div class="absolute left-0 top-0 bottom-0 w-8 flex flex-col items-center">
                <div class="w-1 flex-1 bg-gradient-to-b from-amber-300 to-amber-600"></div>
                <div class="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold shadow-md">
                  {{ layer.id === -1 ? 'C' : layer.id }}
                </div>
              </div>
              
              <!-- 层级内容 -->
              <div class="ml-12 p-4 rounded-lg shadow-lg" :class="getLayerStyle(layer.id)">
                <h3 class="layer-title text-lg font-bold mb-2 flex items-center">
                  <span class="mr-2 text-2xl">{{ layer.icon }}</span>
                  <span>{{ layer.name }}</span>
                  <span class="ml-2 text-xs bg-black bg-opacity-20 px-2 py-1 rounded-full text-white">深度 {{ Math.abs(layer.id) * 2 }}m</span>
                </h3>
                <p class="text-sm opacity-80 mb-4">{{ layer.description }}</p>
                
                <!-- 房间网格 - 蜂窝状布局 -->
                <div class="chambers-honeycomb flex flex-wrap gap-3 justify-center">
                <!-- 现有房间 - 六边形设计 -->
                 <div v-for="chamber in getChambersByLayer(layer.id)" :key="chamber.id" 
                      class="chamber-hexagon relative w-32 h-32 cursor-pointer transform hover:scale-110 transition-all duration-300"
                      :class="getChamberStyle(chamber.type)"
                      @click="selectChamber(chamber)"
                      :title="`${getChamberName(chamber.type)} - 等级 ${chamber.level}`">
                   
                   <!-- 六边形背景 -->
                   <div class="absolute inset-0 chamber-hex-bg rounded-lg shadow-lg border-2" :class="getChamberBorderStyle(chamber.type)"></div>
                   
                   <!-- 房间图标和信息 -->
                   <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                     <div class="text-2xl mb-1">{{ getChamberIcon(chamber.type) }}</div>
                     <div class="text-xs font-bold text-gray-800 leading-tight">{{ getChamberName(chamber.type) }}</div>
                     <div class="text-xs text-gray-600 mt-1">Lv.{{ chamber.level }}</div>
                     
                     <!-- 效率指示器 -->
                     <div class="absolute top-1 right-1 w-3 h-3 rounded-full" :class="getEfficiencyColor(chamber.efficiency)"></div>
                     
                     <!-- 升级可用指示 -->
                     <div v-if="chamber.level < chamber.maxLevel" class="absolute bottom-1 left-1 text-xs">⬆️</div>
                     <div v-else class="absolute bottom-1 left-1 text-xs">✅</div>
                   </div>
                   
                   <!-- 悬浮信息 -->
                   <div class="chamber-tooltip absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white text-xs p-2 rounded opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                     <div>{{ getChamberName(chamber.type) }}</div>
                     <div>等级: {{ chamber.level }}/{{ chamber.maxLevel }}</div>
                     <div>效率: {{ chamber.efficiency.toFixed(1) }}</div>
                   </div>
                 </div>
                
                <!-- 建造新房间槽位 -->
                 <div v-if="canBuildInLayer(layer.id)" 
                      class="build-slot relative w-32 h-32 cursor-pointer transform hover:scale-105 transition-all duration-300">
                   
                   <!-- 空槽位背景 -->
                   <div class="absolute inset-0 border-2 border-dashed border-amber-400 rounded-lg bg-amber-50 bg-opacity-50 shadow-inner"></div>
                   
                   <!-- 建造图标和文字 -->
                   <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-2" @click="showBuildMenu(layer.id)">
                     <div class="text-3xl mb-1 text-amber-600">➕</div>
                     <div class="text-xs font-bold text-amber-700 leading-tight">建造房间</div>
                     <div class="text-xs text-amber-600 mt-1">点击选择</div>
                   </div>
                   
                   <!-- 建造菜单 -->
                   <div v-if="showBuildMenuFor === layer.id" class="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-20 min-w-48">
                     <h5 class="text-sm font-bold text-gray-700 mb-2">选择房间类型</h5>
                     <div class="space-y-2">
                       <div v-for="type in getAvailableChamberTypes(layer.id)" :key="type.value" 
                            class="p-2 border rounded hover:bg-gray-50 cursor-pointer text-sm"
                            @click="buildChamberOfType(layer.id, type.value)">
                         <div class="flex items-center">
                           <span class="mr-2">{{ getChamberIcon(type.value) }}</span>
                           <div>
                             <div class="font-medium">{{ type.label }}</div>
                             <div class="text-xs text-gray-500">{{ type.description }}</div>
                           </div>
                         </div>
                       </div>
                     </div>
                     <button @click="showBuildMenuFor = null" class="mt-2 w-full text-xs text-gray-500 hover:text-gray-700">取消</button>
                   </div>
                 </div>
               </div>
            </div>
          </div>
          
          <!-- 房间详情管理面板 -->
          <div v-if="selectedChamber" class="chamber-details bg-gray-50 p-4 rounded mt-4">
            <h4 class="text-lg font-medium text-gray-700 mb-3">{{ getChamberName(selectedChamber.type) }} 详情</h4>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span class="text-sm text-gray-600">等级:</span>
                <span class="font-medium ml-2">{{ selectedChamber.level }}</span>
              </div>
              <div>
                <span class="text-sm text-gray-600">容量:</span>
                <span class="font-medium ml-2">{{ selectedChamber.capacity }}</span>
              </div>
              <div>
                <span class="text-sm text-gray-600">效率:</span>
                <span class="font-medium ml-2">{{ selectedChamber.efficiency.toFixed(2) }}</span>
              </div>
              <div>
                <span class="text-sm text-gray-600">层级:</span>
                <span class="font-medium ml-2">{{ getLayerName(selectedChamber.layer) }}</span>
              </div>
            </div>
            
            <div v-if="selectedChamber.specialBonus" class="mb-4">
              <span class="text-sm text-gray-600">特殊加成:</span>
              <p class="text-sm text-green-600 mt-1">{{ getSpecialBonusText(selectedChamber) }}</p>
            </div>
            
            <!-- 真菌园管理 -->
            <div v-if="selectedChamber.type === 'FUNGUS_GARDEN'" class="fungus-garden-management mb-4">
              <h5 class="text-md font-medium text-gray-700 mb-3">🍄 真菌园管理</h5>
              <div v-if="fungusGardenInfo" class="space-y-4">
                <!-- 种植位网格 -->
                <div class="plots-grid grid grid-cols-5 gap-2">
                  <div 
                    v-for="plot in fungusGardenInfo.plots" 
                    :key="plot.id" 
                    class="plot border-2 rounded p-2 text-center cursor-pointer"
                    :class="{
                      'border-green-500 bg-green-50': plot.status === 'growing',
                      'border-yellow-500 bg-yellow-50': plot.status === 'growing' && plot.canHarvest,
                      'border-gray-300 bg-gray-50': plot.status === 'empty'
                    }"
                    @click="handlePlotClick(plot)"
                  >
                    <div v-if="plot.status === 'empty'" class="text-gray-400 text-xs">
                      空地<br>{{ plot.id + 1 }}
                    </div>
                    <div v-else class="text-xs">
                      <div class="font-medium">{{ plot.fungusName }}</div>
                      <div class="text-gray-500">{{ plot.canHarvest ? '可收获' : '生长中' }}</div>
                    </div>
                  </div>
                </div>
                
                <!-- 种植选择 -->
                <div v-if="showPlantingOptions" class="planting-options bg-white border rounded p-3">
                  <h6 class="text-sm font-medium mb-2">选择要种植的真菌:</h6>
                  <div class="space-y-2">
                    <div 
                      v-for="fungusType in fungusGardenInfo.availableFungusTypes" 
                      :key="fungusType.type"
                      class="fungus-option flex justify-between items-center p-2 border rounded hover:bg-gray-50"
                    >
                      <div>
                        <div class="font-medium text-sm">{{ fungusType.name }}</div>
                        <div class="text-xs text-gray-500">
                            成本: 
                            <span v-for="[resource, cost] in Object.entries(fungusType.cost)" :key="resource" class="mr-2">
                              {{ resource }}: {{ cost }}
                            </span>
                          </div>
                          <div class="text-xs text-green-600">
                            产出: 
                            <span v-for="[resource, yieldAmount] in Object.entries(fungusType.yield)" :key="resource" class="mr-2">
                              {{ resource }}: {{ yieldAmount }}
                            </span>
                          </div>
                        <div class="text-xs text-blue-600">生长时间: {{ Math.ceil(fungusType.growthTime / 60) }}分钟</div>
                      </div>
                      <button 
                        @click="plantFungus(selectedPlotId, fungusType.type)"
                        class="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600"
                        :disabled="!canPlantFungus(fungusType)"
                      >
                        种植
                      </button>
                    </div>
                  </div>
                  <button @click="showPlantingOptions = false" class="mt-2 bg-gray-500 text-white px-3 py-1 rounded text-xs">
                    取消
                  </button>
                </div>
              </div>
              
              <button @click="loadFungusGardenInfo(selectedChamber.id)" class="bg-purple-500 text-white py-1 px-3 rounded text-xs hover:bg-purple-600">
                刷新真菌园信息
              </button>
            </div>
            
            <div class="flex space-x-2">
              <button 
                @click="upgradeChamber(selectedChamber.id)" 
                class="bg-blue-500 text-white py-2 px-4 rounded text-sm hover:bg-blue-600"
                :disabled="selectedChamber.level >= 10"
              >
                升级房间
              </button>
              <button 
                @click="selectedChamber = null" 
                class="bg-gray-500 text-white py-2 px-4 rounded text-sm hover:bg-gray-600"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
            </div>
            </div>
            <!-- 蚂蚁管理模块 -->
            <div v-if="activeTab === 'ants'" class="tab-content">
              <h3 class="text-xl font-bold text-gray-800 mb-6">🐜 蚂蚁管理</h3>

              <!-- 蚂蚁面板 -->
              <div class="bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span class="mr-2">🐜</span>蚁群状况
                </h2>
                
                <!-- 繁殖系统 -->
                <div class="breeding-section mb-6">
                  <h3 class="text-lg font-medium text-gray-700 mb-3 flex items-center">
                    <span class="mr-2">🥚</span>繁殖系统
                  </h3>
                  <div class="breeding-info" v-if="breedingInfo">
                    <div class="queen-info mb-3" v-if="breedingInfo.queen">
                      <h4 class="text-md font-medium text-gray-600 mb-2">👑 蚁后状态</h4>
                      <p class="text-sm text-gray-600">等级: {{ breedingInfo.queen.level }} | 生命值: {{ breedingInfo.queen.health }} | 能量: {{ breedingInfo.queen.energy }}</p>
                      <p v-if="breedingInfo.queenPalace" class="text-sm text-gray-600">产卵间隔: {{ breedingInfo.queenPalace.eggProductionInterval }}秒</p>
                    </div>
                    
                    <div class="nursery-info mb-3" v-if="breedingInfo.nursery">
                      <h4 class="text-md font-medium text-gray-600 mb-2">🏠 育婴室状态</h4>
                      <p class="text-sm text-gray-600">等级: {{ breedingInfo.nursery.level }} | 孵化时间: {{ breedingInfo.nursery.hatchingTime }}秒</p>
                      <p class="text-sm text-gray-600">容量: {{ breedingInfo.nursery.currentEggs }}/{{ breedingInfo.nursery.maxEggs }}</p>
                    </div>
                    
                    <!-- 自动产卵状态 -->
                    <div class="auto-laying mb-3">
                      <h4 class="text-md font-medium text-gray-600 mb-2">🥚 自动产卵系统</h4>
                      <div class="auto-laying-status p-3 bg-green-50 border border-green-200 rounded">
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-sm font-medium text-green-800">✅ 自动产卵已启用</span>
                          <span class="text-xs text-green-600">每 {{ breedingInfo.queenPalace?.eggProductionInterval || 300 }} 秒产卵一次</span>
                        </div>
                        <div class="text-xs text-gray-600">
                          <p>蚁后会根据资源情况自动产卵，优先产生工蚁</p>
                          <p>当前育婴室容量: {{ breedingInfo.nursery ? breedingInfo.nursery.currentEggs : 0 }}/{{ breedingInfo.nursery ? breedingInfo.nursery.maxEggs : 0 }}</p>
                        </div>
                      </div>
                    </div>
                    
                    <!-- 蚂蚁卵列表 -->
                    <div class="eggs-section mb-3" v-if="breedingInfo.eggs.length > 0">
                      <h4 class="text-md font-medium text-gray-600 mb-2">🥚 蚂蚁卵</h4>
                      <div class="eggs-grid space-y-2">
                        <div v-for="egg in breedingInfo.eggs" :key="egg.id" class="egg-card flex justify-between items-center p-2 border rounded">
                          <div class="egg-info">
                            <span class="egg-type font-medium">{{ getAntName(egg.type) }}卵</span>
                            <span class="egg-time text-xs text-gray-500 block">产卵时间: {{ formatTime(egg.layTime) }}</span>
                          </div>
                          <button 
                            @click="hatchEgg(egg.id)" 
                            class="hatch-btn px-3 py-1 rounded text-sm" 
                            :disabled="!egg.canHatch"
                            :class="egg.canHatch ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500'"
                          >
                            {{ egg.canHatch ? '孵化' : '孵化中...' }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button @click="loadBreedingInfo" class="refresh-btn bg-purple-500 text-white py-2 px-4 rounded text-sm hover:bg-purple-600 mb-4">
                    刷新繁殖信息
                  </button>
                </div>
                
                <!-- 蚂蚁列表 -->
                <div class="space-y-3">
                  <div v-for="ant in ants.filter(a => a.status !== 'EGG')" :key="ant.id" class="border rounded p-3">
                    <div class="flex justify-between items-start mb-2">
                      <span class="font-medium text-gray-700">{{ getAntName(ant.type) }}</span>
                      <span class="text-sm" :class="getStatusColor(ant.status)">{{ getStatusName(ant.status) }}</span>
                    </div>
                    <div class="text-sm text-gray-600 space-y-1">
                      <p>等级: {{ ant.level }}</p>
                      <p>健康: {{ ant.health }}</p>
                      <p>能量: {{ ant.energy }}</p>
                      <p v-if="ant.workingAt" class="text-blue-600">工作地点: {{ getChamberName(ant.workingAt) }}</p>
                    </div>
                    
                    <!-- 蚂蚁操作按钮 -->
                    <div class="mt-2 flex space-x-2">
                      <!-- 蚁后不需要分配工作 -->
                      <button 
                        v-if="ant.type !== 'QUEEN'"
                        @click="assignAntWork(ant.id)" 
                        class="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                      >
                        分配工作
                      </button>
                      <button 
                        @click="upgradeAnt(ant.id)" 
                        class="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                      >
                        升级
                      </button>
                      <button 
                        @click="restAnt(ant.id)" 
                        class="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                      >
                        休息
                      </button>
                    </div>
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
            
            <!-- 科技研究模块 -->
            <div v-if="activeTab === 'technology'" class="tab-content">
              <h3 class="text-xl font-bold text-gray-800 mb-6">🔬 科技研究</h3>
              
        <!-- 科技研究面板 -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span class="mr-2">🔬</span>科技研究
          </h2>
          <div class="space-y-3">
            <div v-for="tech in technologies" :key="tech.id" class="flex justify-between items-center p-2 border rounded">
              <div>
                <span class="text-gray-700 font-medium">{{ tech.name }}</span>
                <div class="text-xs text-gray-500">{{ tech.description }}</div>
              </div>
              <div class="text-right">
                <span class="text-sm text-green-600">Lv.{{ tech.level }}/{{ tech.maxLevel }}</span>
                <button 
                  @click="researchSpecificTech(tech.category, tech.name)" 
                  :disabled="tech.level >= tech.maxLevel"
                  class="ml-2 bg-indigo-500 text-white px-2 py-1 rounded text-xs hover:bg-indigo-600 disabled:bg-gray-300"
                >
                  {{ tech.level >= tech.maxLevel ? '已满级' : '研究' }}
                </button>
              </div>
            </div>
          </div>
          
          <!-- 科技选择 -->
          <div class="mt-4 space-y-2">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">科技类别</label>
              <select v-model="selectedTechCategory" class="w-full p-2 border rounded text-sm">
                <option value="">选择科技类别</option>
                <option value="COLLECTION">采集技术</option>
                <option value="CONSTRUCTION">建造技术</option>
                <option value="BIOLOGY">生物技术</option>
                <option value="MILITARY">军事技术</option>
              </select>
            </div>
            
            <div v-if="selectedTechCategory">
              <label class="block text-sm font-medium text-gray-600 mb-1">具体科技</label>
              <select v-model="selectedTechName" class="w-full p-2 border rounded text-sm">
                <option value="">选择科技</option>
                <option v-for="techName in getAvailableTechs(selectedTechCategory)" :key="techName" :value="techName">
                  {{ techName }}
                </option>
              </select>
            </div>
            
            <button 
              @click="researchSelectedTech" 
              :disabled="!selectedTechCategory || !selectedTechName"
              class="w-full bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600 disabled:bg-gray-300 transition-colors"
            >
              研究选中科技
            </button>
          </div>
        </div>
            </div>
            
            <!-- 市场交易模块 -->
            <div v-if="activeTab === 'market'" class="tab-content">
              <h3 class="text-xl font-bold text-gray-800 mb-6">🏪 资源市场</h3>
              
        <!-- 市场交易面板 -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span class="mr-2">🏪</span>资源市场
          </h2>
          
          <!-- 市场价格 -->
          <div class="mb-4">
            <h3 class="text-sm font-medium text-gray-600 mb-2">当前价格</h3>
            <div class="space-y-1 text-xs">
              <div v-for="(price, resource) in marketPrices" :key="resource" class="flex justify-between">
                <span>{{ getResourceName(resource) }}</span>
                <span class="text-green-600">{{ price }} 食物</span>
              </div>
            </div>
          </div>

          <!-- 交易操作 -->
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">交易资源</label>
              <select v-model="selectedTradeResource" class="w-full p-2 border rounded text-sm">
                <option value="">选择资源</option>
                <option value="MINERAL">矿物</option>
                <option value="WATER">水</option>
                <option value="HONEYDEW">蜜露</option>
                <option value="FUNGUS">真菌</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">数量</label>
              <input v-model.number="tradeQuantity" type="number" min="1" class="w-full p-2 border rounded text-sm" placeholder="输入数量">
            </div>
            
            <div class="flex space-x-2">
              <button 
                @click="sellResource" 
                :disabled="!selectedTradeResource || !tradeQuantity"
                class="flex-1 bg-red-500 text-white py-2 px-3 rounded text-sm hover:bg-red-600 disabled:bg-gray-300 transition-colors"
              >
                出售
              </button>
              <button 
                @click="buyResource" 
                :disabled="!selectedTradeResource || !tradeQuantity"
                class="flex-1 bg-green-500 text-white py-2 px-3 rounded text-sm hover:bg-green-600 disabled:bg-gray-300 transition-colors"
              >
                购买
              </button>
            </div>
          </div>
          
          <button 
            @click="refreshMarketPrices" 
            class="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded text-sm hover:bg-blue-600 transition-colors"
          >
            刷新价格
          </button>
        </div>
            </div>
            
            <!-- 成就系统模块 -->
            <div v-if="activeTab === 'achievements'" class="tab-content">
              <h3 class="text-xl font-bold text-gray-800 mb-6">🏆 成就系统</h3>
              
        <!-- 成就系统面板 -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span class="mr-2">🏆</span>成就系统
          </h2>
          
          <!-- 成就列表 -->
          <div class="space-y-3 max-h-64 overflow-y-auto">
            <div v-for="achievement in achievements" :key="achievement.id" class="border rounded p-3">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-medium text-gray-800">{{ achievement.name }}</h3>
                  <p class="text-sm text-gray-600 mt-1">{{ achievement.description }}</p>
                  <div class="text-xs text-green-600 mt-1" v-if="achievement.completed">
                    ✅ 已完成 - 获得奖励: {{ formatReward(achievement.reward) }}
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs px-2 py-1 rounded" :class="achievement.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'">
                    {{ achievement.completed ? '已完成' : '进行中' }}
                  </span>
                </div>
              </div>
              
              <!-- 进度条 -->
              <div v-if="!achievement.completed && achievement.progress !== undefined" class="mt-2">
                <div class="bg-gray-200 rounded-full h-2">
                  <div 
                    class="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    :style="{ width: Math.min(100, (achievement.progress / achievement.target * 100)) + '%' }"
                  ></div>
                </div>
                <div class="text-xs text-gray-500 mt-1">{{ achievement.progress || 0 }}/{{ achievement.target }}</div>
              </div>
            </div>
            
            <div v-if="achievements.length === 0" class="text-center text-gray-500 py-4">
              暂无成就数据
            </div>
          </div>
          
          <button 
            @click="refreshAchievements" 
            class="mt-4 w-full bg-purple-500 text-white py-2 px-4 rounded text-sm hover:bg-purple-600 transition-colors"
          >
            刷新成就
          </button>
        </div>
            </div>
            
            <!-- 任务系统模块 -->
            <div v-if="activeTab === 'tasks'" class="tab-content">
              <h3 class="text-xl font-bold text-gray-800 mb-6">📋 任务管理</h3>
              
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
                
                <div v-if="tasks.length === 0" class="text-center text-gray-500 py-4">
                  暂无任务数据
                </div>
                
                <button 
                  @click="generateTask" 
                  class="mt-4 w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition-colors"
                >
                  生成日常任务
                </button>
              </div>
            </div>
            
            <!-- 蚂蚁管理模块 -->
            <div v-if="activeTab === 'ants'" class="tab-content">
              <h3 class="text-xl font-bold text-gray-800 mb-6">🐜 蚂蚁管理</h3>
              
              <!-- 工蚁工作分配面板 -->
              <div class="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-xl p-6 mb-6 border border-green-100">
                <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span class="mr-3 text-xl p-2 bg-green-100 rounded-lg">👷</span>
                  <span class="text-green-800">工蚁工作分配</span>
                </h4>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <!-- 可用工蚁列表 -->
                  <div>
                    <h5 class="text-md font-medium text-gray-700 mb-3">可分配工蚁</h5>
                    <div class="space-y-2 max-h-64 overflow-y-auto">
                      <div 
                        v-for="ant in getAvailableWorkers()" 
                        :key="ant.id"
                        class="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        :class="{
                          'border-blue-500 bg-blue-50': selectedWorkerAnt?.id === ant.id
                        }"
                        @click="selectedWorkerAnt = ant"
                      >
                        <div class="flex justify-between items-center">
                          <div>
                            <span class="font-medium">{{ getAntTypeName(ant.type) }}</span>
                            <span class="text-sm text-gray-500 ml-2">等级 {{ ant.level }}</span>
                          </div>
                          <div class="text-sm">
                            <span v-if="ant.workingAt" class="text-blue-600">工作中</span>
                            <span v-else class="text-green-600">空闲</span>
                          </div>
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                          健康: {{ ant.health }} | 能量: {{ ant.energy }}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 可分配房间列表 -->
                  <div>
                    <h5 class="text-md font-medium text-gray-700 mb-3">可分配房间</h5>
                    <div class="space-y-2 max-h-64 overflow-y-auto">
                      <div 
                        v-for="chamber in getWorkableChambers()" 
                        :key="chamber.id"
                        class="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        :class="{
                          'border-green-500 bg-green-50': selectedWorkChamber?.id === chamber.id
                        }"
                        @click="selectedWorkChamber = chamber"
                      >
                        <div class="flex justify-between items-center">
                          <div>
                            <span class="font-medium">{{ getChamberName(chamber.type) }}</span>
                            <span class="text-sm text-gray-500 ml-2">等级 {{ chamber.level }}</span>
                          </div>
                          <div class="text-sm text-gray-600">
                            {{ getWorkerCount(chamber.id) }}/{{ getMaxWorkers(chamber) }} 工蚁
                          </div>
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                          {{ getChamberDescription(chamber.type) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 分配操作按钮 -->
                <div class="mt-6 flex justify-center space-x-4">
                  <button 
                    @click="assignWorkerToRoom()"
                    :disabled="!selectedWorkerAnt || !selectedWorkChamber"
                    class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    🔧 分配工作
                  </button>
                  <button 
                    @click="clearWorkerSelection()"
                    class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    🔄 清除选择
                  </button>
                </div>
              </div>
              
              <!-- 蚂蚁状态总览 -->
              <div class="bg-white rounded-xl shadow-lg p-6">
                <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  📊 蚂蚁状态总览
                </h4>
                
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div class="text-center p-4 bg-blue-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">{{ getAntCountByType('WORKER') }}</div>
                    <div class="text-sm text-gray-600">工蚁</div>
                  </div>
                  <div class="text-center p-4 bg-red-50 rounded-lg">
                    <div class="text-2xl font-bold text-red-600">{{ getAntCountByType('SOLDIER') }}</div>
                    <div class="text-sm text-gray-600">兵蚁</div>
                  </div>
                  <div class="text-center p-4 bg-green-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">{{ getAntCountByType('SCOUT') }}</div>
                    <div class="text-sm text-gray-600">侦察蚁</div>
                  </div>
                  <div class="text-center p-4 bg-purple-50 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600">{{ getWorkingAntsCount() }}</div>
                    <div class="text-sm text-gray-600">工作中</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 科技研究模块 -->
            <div v-if="activeTab === 'research'" class="tab-content">
              <h3 class="text-xl font-bold text-gray-800 mb-6">🔬 科技研究</h3>
              
              <!-- 科技研究面板 -->
              <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  🧪 研究新技术
                </h4>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <!-- 科技类别选择 -->
                  <div>
                    <h5 class="text-md font-medium text-gray-700 mb-3">选择研究类别</h5>
                    <div class="space-y-2">
                      <div 
                        v-for="category in techCategories" 
                        :key="category.id"
                        class="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        :class="{
                          'border-blue-500 bg-blue-50': selectedTechCategory === category.id
                        }"
                        @click="selectedTechCategory = category.id"
                      >
                        <div class="flex items-center">
                          <span class="text-xl mr-3">{{ category.icon }}</span>
                          <div>
                            <div class="font-medium">{{ category.name }}</div>
                            <div class="text-sm text-gray-500">{{ category.description }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 具体技术选择 -->
                  <div>
                    <h5 class="text-md font-medium text-gray-700 mb-3">选择具体技术</h5>
                    <div class="space-y-2">
                      <div v-if="!selectedTechCategory" class="text-gray-500 text-center py-8">
                        请先选择研究类别
                      </div>
                      <div 
                        v-else
                        v-for="tech in getAvailableTechs(selectedTechCategory)" 
                        :key="tech"
                        class="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        :class="{
                          'border-green-500 bg-green-50': selectedTechName === tech
                        }"
                        @click="selectedTechName = tech"
                      >
                        <div class="flex justify-between items-center">
                          <div>
                            <div class="font-medium">{{ tech }}</div>
                            <div class="text-sm text-gray-500">{{ getTechDescription(tech) }}</div>
                          </div>
                          <div class="text-sm text-blue-600">
                            {{ getTechCost(tech) }} 科技点
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 研究按钮 -->
                <div class="mt-6 flex justify-center space-x-4">
                  <button 
                    @click="researchSelectedTech()"
                    :disabled="!selectedTechCategory || !selectedTechName"
                    class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    🔬 开始研究
                  </button>
                  <button 
                    @click="clearTechSelection()"
                    class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    🔄 清除选择
                  </button>
                </div>
              </div>
              
              <!-- 已研究技术列表 -->
              <div class="bg-white rounded-xl shadow-lg p-6">
                <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  📚 已研究技术
                </h4>
                
                <div v-if="technologies.length === 0" class="text-gray-500 text-center py-8">
                  还没有研究任何技术
                </div>
                
                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div 
                    v-for="tech in technologies" 
                    :key="tech.id"
                    class="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-blue-50"
                  >
                    <div class="flex justify-between items-start mb-2">
                      <div class="font-medium text-gray-800">{{ tech.name }}</div>
                      <div class="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                        等级 {{ tech.level }}
                      </div>
                    </div>
                    <div class="text-sm text-gray-600 mb-2">{{ tech.type }}</div>
                    <div class="text-xs text-gray-500">
                      研究时间: {{ formatDate(tech.researchedAt) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            

          </div>
        </div>

        <!-- 消息提示 -->
        <div v-if="message" class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {{ message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 认证相关状态
const isLoggedIn = ref(false)
const authMode = ref('login')
const authMessage = ref('')
const authError = ref(false)
const playerInfo = ref(null)
const globalMessage = ref('')
const globalMessageType = ref('info') // 'success', 'error', 'info'

// 市场交易相关
const marketPrices = ref({})
const selectedTradeResource = ref('')
const tradeQuantity = ref(1)

// 科技研究相关
let selectedTechCategory = ref('')
let selectedTechName = ref('')

// 成就系统相关
const achievements = ref([])

// 登录表单
const loginForm = ref({
  username: '',
  password: ''
})

// 注册表单
const registerForm = ref({
  username: '',
  password: '',
  nickname: '',
  email: ''
})

// 游戏状态
const colonyId = ref('')
const resources = ref([])
const chambers = ref([])
const ants = ref([])
const technologies = ref([])
const tasks = ref([])
const message = ref('')
const selectedChamberType = ref('')

// UI状态
const activeTab = ref('overview')
const menuTabs = ref([
  { id: 'overview', name: '总览', icon: '🏠', description: '查看巢穴整体状况和资源情况' },
  { id: 'building', name: '建设', icon: '🏗️', description: '建造和升级巢穴房间' },
  { id: 'ants', name: '蚂蚁', icon: '🐜', description: '管理蚂蚁和分配工作' },
  { id: 'research', name: '科技', icon: '🔬', description: '研究新技术提升巢穴能力' },
  { id: 'market', name: '市场', icon: '💰', description: '进行资源交易' },
  { id: 'achievements', name: '成就', icon: '🏆', description: '查看获得的成就' },
  { id: 'tasks', name: '任务', icon: '📋', description: '查看和管理任务' }
])
const breedingInfo = ref(null)
const selectedChamber = ref(null)
const fungusGardenInfo = ref(null)
const showPlantingOptions = ref(false)
const selectedPlotId = ref(null)

// 工蚁工作分配相关
const selectedWorkerAnt = ref(null)
const selectedWorkChamber = ref(null)

// 巢穴建设UI相关
const showBuildMenuFor = ref(null)

// 科技研究数据
const techCategories = ref([
  { id: 'COLLECTION', name: '资源采集', icon: '⛏️', description: '提升资源收集效率' },
  { id: 'MILITARY', name: '军事技术', icon: '⚔️', description: '增强战斗能力' },
  { id: 'CONSTRUCTION', name: '建造技术', icon: '🏗️', description: '提升建造速度和质量' },
  { id: 'BIOLOGY', name: '生物技术', icon: '🧬', description: '优化繁殖和基因' }
])

// 巢穴层级定义
const layers = ref([
  { id: -1, name: '核心层', icon: '👑', description: '只能建造蚁后宫殿' },
  { id: 0, name: '浅层', icon: '🍄', description: '只能建造真菌园' },
  { id: 1, name: '第1层', icon: '📦', description: '只能建造储藏室' },
  { id: 2, name: '中层', icon: '🏭', description: '只能建造资源加工室' },
  { id: 3, name: '深层', icon: '🥚', description: '只能建造育婴室' }
])

// 获取游戏数据
async function fetchGameData() {
  if (!colonyId.value) return
  
  try {
    // 获取殖民地信息
    const colonyResponse = await $fetch(`/api/colony/${colonyId.value}`)
    if (colonyResponse.success) {
      resources.value = colonyResponse.data.resources
      chambers.value = colonyResponse.data.chambers
      ants.value = colonyResponse.data.ants
      technologies.value = colonyResponse.data.technologies
      tasks.value = colonyResponse.data.tasks
      
      // 保存登录状态
      if (playerInfo.value) {
        localStorage.setItem('playerInfo', JSON.stringify({
          ...playerInfo.value,
          colonyId: colonyId.value
        }))
      }
    }
    
    // 获取市场价格
    await refreshMarketPrices()
  } catch (error) {
    console.error('获取游戏数据失败:', error)
  }
}

// 资源现在通过自动化系统生产，无需手动添加

// 建造房间
async function buildChamber(layerId) {
  if (!selectedChamberType.value) return
  
  try {
    const response = await $fetch('/api/chamber/build', {
      method: 'POST',
      body: {
        colonyId: colonyId.value,
        chamberType: selectedChamberType.value,
        layer: layerId
      }
    })
    
    if (response.success) {
      showMessage(`${getChamberName(selectedChamberType.value)}建造成功！`)
      selectedChamberType.value = ''
      await fetchGameData()
    } else {
      showMessage(response.message)
    }
  } catch (error) {
    console.error('建造房间失败:', error)
  }
}

// 显示建造菜单
function showBuildMenu(layerId) {
  showBuildMenuFor.value = showBuildMenuFor.value === layerId ? null : layerId
}

// 建造指定类型的房间
async function buildChamberOfType(layerId, chamberType) {
  showBuildMenuFor.value = null
  
  try {
    const response = await $fetch('/api/chamber/build', {
      method: 'POST',
      body: {
        colonyId: colonyId.value,
        chamberType: chamberType,
        layer: layerId
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
    showMessage('建造失败，请稍后重试')
  }
}

// 招募蚂蚁
async function recruitAnt() {
  try {
    const response = await $fetch('/api/ant/manage', {
      method: 'POST',
      body: {
        action: 'recruit',
        colonyId: colonyId.value,
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
        colonyId: colonyId.value,
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
        colonyId: colonyId.value,
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

// 市场交易功能
async function refreshMarketPrices() {
  try {
    const response = await $fetch('/api/market/trade', {
      method: 'POST',
      body: {
        action: 'get_prices',
        colonyId: colonyId.value
      }
    })
    
    if (response.success) {
      marketPrices.value = response.prices
      showMessage('市场价格已更新')
    } else {
      showMessage(response.message)
    }
  } catch (error) {
    console.error('获取市场价格失败:', error)
  }
}

async function sellResource() {
  if (!selectedTradeResource.value || !tradeQuantity.value) return
  
  try {
    const response = await $fetch('/api/market/trade', {
      method: 'POST',
      body: {
        action: 'sell',
        colonyId: colonyId.value,
        resourceType: selectedTradeResource.value,
        quantity: tradeQuantity.value
      }
    })
    
    if (response.success) {
      showMessage(`成功出售 ${tradeQuantity.value} ${getResourceName(selectedTradeResource.value)}`)
      selectedTradeResource.value = ''
      tradeQuantity.value = 1
      await fetchGameData()
    await refreshMarketPrices()
    await refreshAchievements()
    } else {
      showMessage(response.message)
    }
  } catch (error) {
    console.error('出售资源失败:', error)
  }
}

async function buyResource() {
  if (!selectedTradeResource.value || !tradeQuantity.value) return
  
  try {
    const response = await $fetch('/api/market/trade', {
      method: 'POST',
      body: {
        action: 'buy',
        colonyId: colonyId.value,
        resourceType: selectedTradeResource.value,
        quantity: tradeQuantity.value
      }
    })
    
    if (response.success) {
      showMessage(`成功购买 ${tradeQuantity.value} ${getResourceName(selectedTradeResource.value)}`)
      selectedTradeResource.value = ''
      tradeQuantity.value = 1
      await fetchGameData()
      await refreshMarketPrices()
    } else {
      showMessage(response.message)
    }
  } catch (error) {
    console.error('购买资源失败:', error)
  }
}

// 蚂蚁管理功能
async function assignAntWork(antId) {
  try {
    const response = await $fetch('/api/ant/manage', {
      method: 'POST',
      body: {
        action: 'assign_work',
        colonyId: colonyId.value,
        antId: antId,
        chamberId: chambers.value[0]?.id // 分配到第一个房间
      }
    })
    
    if (response.success) {
      showMessage('蚂蚁工作分配成功！')
      await fetchGameData()
    } else {
      showMessage(response.message)
    }
  } catch (error) {
    console.error('分配蚂蚁工作失败:', error)
  }
}

async function upgradeAnt(antId) {
  try {
    const response = await $fetch('/api/ant/manage', {
      method: 'POST',
      body: {
        action: 'upgrade',
        colonyId: colonyId.value,
        antId: antId
      }
    })
    
    if (response.success) {
      showMessage('蚂蚁升级成功！')
      await fetchGameData()
    } else {
      showMessage(response.message)
    }
  } catch (error) {
    console.error('升级蚂蚁失败:', error)
  }
}

async function restAnt(antId) {
  try {
    const response = await $fetch('/api/ant/manage', {
      method: 'POST',
      body: {
        action: 'rest',
        colonyId: colonyId.value,
        antId: antId
      }
    })
    
    if (response.success) {
      showMessage('蚂蚁开始休息！')
      await fetchGameData()
    } else {
      showMessage(response.message)
    }
  } catch (error) {
    console.error('蚂蚁休息失败:', error)
  }
}

// 科技研究功能
function getAvailableTechs(category) {
  const techsByCategory = {
    COLLECTION: ['基础采集', '群体协作'],
    MILITARY: ['基础战斗', '特殊技能'],
    CONSTRUCTION: ['建造速度', '结构优化'],
    BIOLOGY: ['繁殖优化', '基因改造']
  }
  return techsByCategory[category] || []
}

async function researchSpecificTech(category, techName) {
  try {
    const response = await $fetch('/api/technology/research', {
      method: 'POST',
      body: {
        action: 'research',
        colonyId: colonyId.value,
        techType: category,
        techName: techName
      }
    })
    
    if (response.success) {
      showMessage(`${techName} 研究成功！`)
      await fetchGameData()
    } else {
      showMessage(response.message)
    }
  } catch (error) {
    console.error('科技研究失败:', error)
  }
}

async function researchSelectedTech() {
  if (!selectedTechCategory.value || !selectedTechName.value) return
  
  await researchSpecificTech(selectedTechCategory.value, selectedTechName.value)
  
  // 重置选择
  selectedTechCategory.value = ''
  selectedTechName.value = ''
}

// 成就系统相关函数
const refreshAchievements = async () => {
  try {
    const response = await $fetch('/api/achievements', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (response.success) {
      achievements.value = response.achievements || []
    } else {
      console.error('获取成就失败:', response.message)
    }
  } catch (error) {
    console.error('获取成就失败:', error)
  }
}

const formatReward = (reward) => {
  if (!reward) return '无'
  try {
    const rewardObj = typeof reward === 'string' ? JSON.parse(reward) : reward
    const parts = []
    if (rewardObj.food) parts.push(`食物 +${rewardObj.food}`)
    if (rewardObj.mineral) parts.push(`矿物 +${rewardObj.mineral}`)
    if (rewardObj.water) parts.push(`水 +${rewardObj.water}`)
    if (rewardObj.wood) parts.push(`木材 +${rewardObj.wood}`)
    if (rewardObj.honeydew) parts.push(`蜜露 +${rewardObj.honeydew}`)
    if (rewardObj.fungus) parts.push(`真菌 +${rewardObj.fungus}`)
    return parts.join(', ') || '无'
  } catch {
    return reward.toString()
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

function getResourceLimit(type) {
  // 基础存储上限
  let baseLimit = 1000
  
  // 根据储藏室等级增加上限
  const storageChambers = chambers.value.filter(c => c.type === 'STORAGE')
  const totalStorageBonus = storageChambers.reduce((total, chamber) => {
    return total + (chamber.level * 500) // 每级储藏室增加500上限
  }, 0)
  
  return baseLimit + totalStorageBonus
}

function getResourceProductionRate(type) {
  // 基础生产速度
  const baseRates = {
    FOOD: 2,
    WATER: 3,
    MINERAL: 1,
    WOOD: 1,
    HONEYDEW: 0.5,
    FUNGUS: 0.3
  }
  
  let rate = baseRates[type] || 0
  
  // 根据相关建筑增加生产速度
  const resourceChambers = chambers.value.filter(c => c.type === 'RESOURCE_PROCESSING')
  const chamberBonus = resourceChambers.reduce((total, chamber) => {
    return total + (chamber.level * 0.5) // 每级资源加工室增加0.5/秒
  }, 0)
  
  // 根据工作蚂蚁数量增加生产速度
  const workingAnts = ants.value.filter(a => a.status === 'WORKING' && a.workType === 'RESOURCE_GATHERING')
  const antBonus = workingAnts.length * 0.3 // 每只工作蚂蚁增加0.3/秒
  
  return Math.round((rate + chamberBonus + antBonus) * 10) / 10 // 保留一位小数
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

// 巢穴UI样式函数
function getLayerStyle(layerId) {
  const styles = {
    '-1': 'bg-gradient-to-br from-purple-200 to-purple-300 border-purple-400 text-purple-900', // 核心层
    '0': 'bg-gradient-to-br from-green-200 to-green-300 border-green-400 text-green-900',   // 浅层
    '1': 'bg-gradient-to-br from-blue-200 to-blue-300 border-blue-400 text-blue-900',     // 第1层
    '2': 'bg-gradient-to-br from-orange-200 to-orange-300 border-orange-400 text-orange-900', // 第2层
    '3': 'bg-gradient-to-br from-pink-200 to-pink-300 border-pink-400 text-pink-900'      // 第3层
  }
  return styles[layerId] || 'bg-gradient-to-br from-gray-200 to-gray-300 border-gray-400 text-gray-900'
}

function getChamberIcon(type) {
  const icons = {
    STORAGE: '📦',
    NURSERY: '🥚',
    QUEEN_PALACE: '👑',
    RESOURCE_PROCESSING: '⚙️',
    FUNGUS_GARDEN: '🍄'
  }
  return icons[type] || '🏠'
}

function getChamberStyle(type) {
  const styles = {
    STORAGE: 'hover:shadow-blue-200',
    NURSERY: 'hover:shadow-green-200',
    QUEEN_PALACE: 'hover:shadow-purple-200',
    RESOURCE_PROCESSING: 'hover:shadow-orange-200',
    FUNGUS_GARDEN: 'hover:shadow-emerald-200'
  }
  return styles[type] || 'hover:shadow-gray-200'
}

function getChamberBorderStyle(type) {
  const styles = {
    STORAGE: 'border-blue-400 bg-gradient-to-br from-blue-100 to-blue-200',
    NURSERY: 'border-green-400 bg-gradient-to-br from-green-100 to-green-200',
    QUEEN_PALACE: 'border-purple-400 bg-gradient-to-br from-purple-100 to-purple-200',
    RESOURCE_PROCESSING: 'border-orange-400 bg-gradient-to-br from-orange-100 to-orange-200',
    FUNGUS_GARDEN: 'border-emerald-400 bg-gradient-to-br from-emerald-100 to-emerald-200'
  }
  return styles[type] || 'border-gray-400 bg-gradient-to-br from-gray-100 to-gray-200'
}

function getEfficiencyColor(efficiency) {
  if (efficiency >= 0.8) return 'bg-green-400'
  if (efficiency >= 0.6) return 'bg-yellow-400'
  if (efficiency >= 0.4) return 'bg-orange-400'
  return 'bg-red-400'
}

function getAntName(type) {
  const names = {
    WORKER: '工蚁',
    SOLDIER: '兵蚁',
    BUILDER: '建筑蚁',
    SCOUT: '侦察蚁',
    QUEEN: '蚁后'
  }
  return names[type] || type
}

function getStatusName(status) {
  const names = {
    IDLE: '空闲',
    WORKING: '工作中',
    RESTING: '休息中',
    EXPLORING: '探索中',
    EGG: '蚂蚁卵'
  }
  return names[status] || status
}

function getStatusColor(status) {
  const colors = {
    IDLE: 'text-gray-500',
    WORKING: 'text-green-600',
    RESTING: 'text-blue-600',
    EXPLORING: 'text-purple-600',
    EGG: 'text-yellow-600'
  }
  return colors[status] || 'text-gray-500'
}

// 认证相关方法
async function login() {
  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: loginForm.value
    })
    
    if (response.success) {
      isLoggedIn.value = true
      playerInfo.value = response.data.player
      colonyId.value = response.data.colonyId
      authMessage.value = '登录成功！'
      authError.value = false
      await fetchGameData()
    } else {
      authMessage.value = response.message
      authError.value = true
    }
  } catch (error) {
    authMessage.value = '登录失败，请重试'
    authError.value = true
  }
}

async function register() {
  try {
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: registerForm.value
    })
    
    if (response.success) {
      authMessage.value = '注册成功！请登录'
      authError.value = false
      authMode.value = 'login'
    } else {
      authMessage.value = response.message
      authError.value = true
    }
  } catch (error) {
    authMessage.value = '注册失败，请重试'
    authError.value = true
  }
}

function logout() {
  isLoggedIn.value = false
  playerInfo.value = null
  colonyId.value = ''
  // 清空表单
  loginForm.value = { username: '', password: '' }
  registerForm.value = { username: '', password: '', nickname: '', email: '' }
}

// 巢穴建设相关方法
function getChambersByLayer(layerId) {
  return chambers.value.filter(chamber => chamber.layer === layerId)
}

function canBuildInLayer(layerId) {
  const layerChambers = getChambersByLayer(layerId)
  const maxChambersPerLayer = 6
  return layerChambers.length < maxChambersPerLayer
}

function getAvailableChamberTypes(layerId) {
   const allTypes = [
     { value: 'QUEEN_PALACE', label: '蚁后宫殿', layers: [-1], unique: true, description: '蚁后居所，升级提升产卵速度' },
     { value: 'FUNGUS_GARDEN', label: '真菌园', layers: [0], description: '培养真菌，提供特殊资源' },
     { value: 'STORAGE', label: '储藏室', layers: [1], description: '存储各种资源，升级增加容量' },
     { value: 'RESOURCE_PROCESSING', label: '资源加工室', layers: [2], description: '加工原材料，提升转换效率' },
     { value: 'NURSERY', label: '育婴室', layers: [3], description: '孵化蚂蚁幼虫，升级减少孵化时间' }
   ]
   
   return allTypes.filter(type => {
     // 检查层级限制
     if (!type.layers.includes(layerId)) return false
     
     // 检查唯一性限制
     if (type.unique) {
       const existingChamber = chambers.value.find(chamber => chamber.type === type.value)
       if (existingChamber) return false
     }
     
     return true
   })
 }

function getSpecialBonusText(chamber) {
   try {
     const specialBonus = chamber.specialBonus ? JSON.parse(chamber.specialBonus) : {}
     const bonuses = {
       QUEEN_PALACE: [
         `产卵间隔: ${specialBonus.eggProductionInterval || 300}秒`,
         `特殊蚂蚁几率: ${((specialBonus.specialEggChance || 0) * 100).toFixed(1)}%`,
         specialBonus.royalAura ? '✨ 皇室光环已激活' : '',
         `蚁后生命值: +${specialBonus.queenHealthBonus || 0}`
       ].filter(Boolean).join(' | '),
       NURSERY: [
         `孵化时间: ${specialBonus.hatchingTime || 180}秒`,
         `最大孵化数: ${specialBonus.maxEggs || 5}个`,
         specialBonus.eliteChance > 0 ? `精英几率: ${(specialBonus.eliteChance * 100).toFixed(1)}%` : '',
         specialBonus.massHatching ? '🥚 批量孵化已解锁' : ''
       ].filter(Boolean).join(' | '),
       STORAGE: [
         `额外容量: +${specialBonus.storageBonus || 0}`,
         `保存率: ${((specialBonus.preservationRate || 0.95) * 100).toFixed(1)}%`,
         specialBonus.autoSorting ? '📦 自动分类已激活' : '',
         specialBonus.emergencyReserve > 0 ? `紧急储备: ${specialBonus.emergencyReserve}` : ''
       ].filter(Boolean).join(' | '),
       RESOURCE_PROCESSING: [
         `加工效率: ${((specialBonus.processingSpeed || 1) * 100).toFixed(0)}%`,
         `转换率: ${((specialBonus.conversionRate || 0.8) * 100).toFixed(0)}%`,
         specialBonus.advancedRecipes ? '⚗️ 高级配方已解锁' : '',
         specialBonus.autoProcessing ? '🔄 自动加工已激活' : ''
       ].filter(Boolean).join(' | '),
       FUNGUS_GARDEN: [
         `真菌产量: ${specialBonus.fungusProduction || 1}/小时`,
         `种植位: ${specialBonus.plotCount || 3}个`,
         `稀有几率: ${((specialBonus.rareFungusChance || 0) * 100).toFixed(1)}%`,
         specialBonus.symbioticBonus > 0 ? `🍄 共生加成: +${(specialBonus.symbioticBonus * 100).toFixed(0)}%` : ''
       ].filter(Boolean).join(' | ')
     }
     return bonuses[chamber.type] || ''
   } catch {
     return ''
   }
 }

function getUpgradeCostText(chamber) {
  const costConfigs = {
    QUEEN_PALACE: { base: { food: 200, mineral: 150, honeydew: 100 }, multiplier: 1.8 },
    STORAGE: { base: { food: 100, mineral: 80, wood: 30 }, multiplier: 1.3 },
    NURSERY: { base: { food: 150, water: 100, mineral: 60 }, multiplier: 1.4 },
    RESOURCE_PROCESSING: { base: { mineral: 120, fungus: 80, food: 60 }, multiplier: 1.5 },
    FUNGUS_GARDEN: { base: { water: 120, mineral: 100, fungus: 50 }, multiplier: 1.4 }
  }
  
  const config = costConfigs[chamber.type]
  if (!config) return '升级成本未知'
  
  const costs = []
  for (const [resource, baseCost] of Object.entries(config.base)) {
    const cost = Math.floor(baseCost * Math.pow(config.multiplier, chamber.level))
    costs.push(`${cost} ${getResourceName(resource.toUpperCase())}`)
  }
  
  return costs.join(', ')
}

async function upgradeChamber(chamberId) {
  try {
    const response = await $fetch('/api/chamber/upgrade', {
      method: 'POST',
      body: {
        chamberId
      }
    })
    
    if (response.success) {
      showMessage('房间升级成功！')
      await fetchGameData()
    } else {
      showMessage(response.message)
    }
  } catch (error) {
    console.error('升级房间失败:', error)
  }
}

// 繁殖系统相关方法
async function loadBreedingInfo() {
  try {
    const response = await $fetch('/api/ant/breeding', {
      method: 'POST',
      body: {
        action: 'get_breeding_info',
        colonyId: colonyId.value
      }
    })
    
    if (response.success) {
      breedingInfo.value = response.data
    }
  } catch (error) {
    console.error('获取繁殖信息失败:', error)
  }
}

// 产卵现在通过自动化系统处理，保留手动孵化功能
async function hatchEgg(eggId) {
  try {
    const response = await $fetch('/api/ant/breeding', {
      method: 'POST',
      body: {
        action: 'hatch_egg',
        colonyId: colonyId.value,
        eggId
      }
    })
    
    if (response.success) {
      showMessage('孵化成功！')
      await loadBreedingInfo()
      await fetchGameData()
    } else {
      showMessage(response.message)
    }
  } catch (error) {
    console.error('孵化失败:', error)
  }
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString()
}

// 房间管理相关方法
function selectChamber(chamber) {
  selectedChamber.value = chamber
  if (chamber.type === 'FUNGUS_GARDEN') {
    loadFungusGardenInfo(chamber.id)
  }
}

function getLayerName(layerId) {
  const layer = layers.value.find(l => l.id === layerId)
  return layer ? layer.name : '未知层级'
}

// 真菌园管理相关方法
async function loadFungusGardenInfo(chamberId) {
  try {
    const response = await $fetch('/api/fungus/manage', {
      method: 'POST',
      body: {
        action: 'get_garden_info',
        colonyId: colonyId.value,
        fungusGardenId: chamberId
      }
    })
    
    if (response.success) {
      fungusGardenInfo.value = response.data
    }
  } catch (error) {
    console.error('获取真菌园信息失败:', error)
  }
}

function handlePlotClick(plot) {
  if (plot.status === 'empty') {
    selectedPlotId.value = plot.id
    showPlantingOptions.value = true
  } else if (plot.canHarvest) {
    harvestFungus(plot.id)
  }
}

async function plantFungus(plotId, fungusType) {
  try {
    const response = await $fetch('/api/fungus/manage', {
      method: 'POST',
      body: {
        action: 'plant_fungus',
        colonyId: colonyId.value,
        fungusGardenId: selectedChamber.value.id,
        plotId,
        fungusType
      }
    })
    
    if (response.success) {
      showMessage('真菌种植成功！')
      showPlantingOptions.value = false
      selectedPlotId.value = null
      await loadFungusGardenInfo(selectedChamber.value.id)
      await fetchGameData()
    } else {
      showMessage(response.message)
    }
  } catch (error) {
    console.error('种植真菌失败:', error)
  }
}

async function harvestFungus(plotId) {
  try {
    const response = await $fetch('/api/fungus/manage', {
      method: 'POST',
      body: {
        action: 'harvest_fungus',
        colonyId: colonyId.value,
        fungusGardenId: selectedChamber.value.id,
        plotId
      }
    })
    
    if (response.success) {
      showMessage('真菌收获成功！')
      await loadFungusGardenInfo(selectedChamber.value.id)
      await fetchGameData()
    } else {
      showMessage(response.message)
    }
  } catch (error) {
    console.error('收获真菌失败:', error)
  }
}

function canPlantFungus(fungusType) {
  if (!fungusType.cost) return true
  
  for (const [resource, cost] of Object.entries(fungusType.cost)) {
    const resourceData = resources.value.find(r => r.type === resource)
    if (!resourceData || resourceData.amount < cost) {
      return false
    }
  }
  
  return true
}

// 获取当前选项卡信息的方法
function getCurrentTabIcon() {
  const currentTab = menuTabs.value.find(tab => tab.id === activeTab.value)
  return currentTab ? currentTab.icon : '🏠'
}

function getCurrentTabName() {
  const currentTab = menuTabs.value.find(tab => tab.id === activeTab.value)
  return currentTab ? currentTab.name : '总览'
}

function getCurrentTabDescription() {
  const currentTab = menuTabs.value.find(tab => tab.id === activeTab.value)
  return currentTab ? currentTab.description : '查看巢穴整体状况和资源情况'
}

// 工蚁工作分配相关方法
function getAvailableWorkers() {
  return ants.value.filter(ant => ant.type === 'WORKER')
}

function getWorkableChambers() {
  return chambers.value.filter(chamber => 
    chamber.type !== 'QUEEN_PALACE' && chamber.type !== 'ENTRANCE'
  )
}

function getWorkerCount(chamberId) {
  return ants.value.filter(ant => ant.workingAt === chamberId).length
}

function getMaxWorkers(chamber) {
  // 根据房间等级和类型确定最大工蚁数量
  const baseWorkers = {
    'STORAGE': 2,
    'NURSERY': 3,
    'RESOURCE_PROCESSING': 4,
    'FUNGUS_GARDEN': 2
  }
  return (baseWorkers[chamber.type] || 2) + chamber.level
}

function getChamberDescription(type) {
  const descriptions = {
    'STORAGE': '存储资源，工蚁可提高存储效率',
    'NURSERY': '孵化蚂蚁，工蚁可加速孵化过程',
    'RESOURCE_PROCESSING': '加工资源，工蚁可提高产出质量',
    'FUNGUS_GARDEN': '种植真菌，工蚁可增加产量'
  }
  return descriptions[type] || '工蚁可在此工作'
}

function getAntCountByType(type) {
  return ants.value.filter(ant => ant.type === type).length
}

function getWorkingAntsCount() {
  return ants.value.filter(ant => ant.workingAt).length
}

async function assignWorkerToRoom() {
  if (!selectedWorkerAnt.value || !selectedWorkChamber.value) {
    showMessage('请选择工蚁和房间')
    return
  }
  
  // 检查房间是否已满
  const currentWorkers = getWorkerCount(selectedWorkChamber.value.id)
  const maxWorkers = getMaxWorkers(selectedWorkChamber.value)
  
  if (currentWorkers >= maxWorkers) {
    showMessage('该房间工蚁已满')
    return
  }
  
  try {
    const response = await $fetch('/api/ant/manage', {
      method: 'POST',
      body: {
        action: 'assign_work',
        colonyId: colonyId.value,
        antId: selectedWorkerAnt.value.id,
        chamberId: selectedWorkChamber.value.id
      }
    })
    
    if (response.success) {
      showMessage(`${getAntTypeName(selectedWorkerAnt.value.type)}已分配到${getChamberName(selectedWorkChamber.value.type)}工作！`)
      await fetchGameData()
      clearWorkerSelection()
    } else {
      showMessage(response.message)
    }
  } catch (error) {
    console.error('分配工蚁工作失败:', error)
    showMessage('分配工作失败')
  }
}

function clearWorkerSelection() {
  selectedWorkerAnt.value = null
  selectedWorkChamber.value = null
}

// 科技研究相关方法
function getTechDescription(techName) {
  const descriptions = {
    '基础采集': '提升工蚁的资源采集效率',
    '群体协作': '增强蚂蚁间的协作能力',
    '基础战斗': '提升兵蚁的战斗力',
    '特殊技能': '解锁蚂蚁的特殊能力',
    '建造速度': '加快房间建造速度',
    '结构优化': '提升建筑的稳定性和效率',
    '繁殖优化': '提高蚁后的产卵效率',
    '基因改造': '培育更强大的蚂蚁'
  }
  return descriptions[techName] || '未知技术'
}

function getTechCost(techName) {
  const costs = {
    '基础采集': 100,
    '群体协作': 200,
    '基础战斗': 150,
    '特殊技能': 300,
    '建造速度': 120,
    '结构优化': 250,
    '繁殖优化': 180,
    '基因改造': 400
  }
  return costs[techName] || 100
}

function clearTechSelection() {
  selectedTechCategory.value = ''
  selectedTechName.value = ''
}

function formatDate(dateString) {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 页面加载时检查登录状态
onMounted(async () => {
  // 设置自动化更新事件监听
  if (process.client && window.gameEventBus) {
    window.gameEventBus.on('automationUpdate', async (data) => {
      // 自动化处理完成后刷新游戏数据
      await fetchGameData()
      
      // 显示自动化处理结果
      if (data.resourcesProduced && Object.keys(data.resourcesProduced).length > 0) {
        const producedText = Object.entries(data.resourcesProduced)
          .map(([type, amount]) => `${getResourceName(type)} +${amount}`)
          .join(', ')
        console.log('🔄 自动生产:', producedText)
      }
      
      if (data.eggsLaid > 0) {
        console.log('🥚 自动产卵:', data.eggsLaid + '个')
      }
    })
  }
  
  // 检查是否有保存的登录状态
  const savedPlayerInfo = localStorage.getItem('playerInfo')
  if (savedPlayerInfo) {
    try {
      playerInfo.value = JSON.parse(savedPlayerInfo)
      isLoggedIn.value = true
      colonyId.value = playerInfo.value.colonyId
      await fetchGameData()
      await loadBreedingInfo()
    } catch (error) {
      localStorage.removeItem('playerInfo')
    }
  }
})
</script>