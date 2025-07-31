# 🐜 蚂蚁帝国 (Ant Empire)

一个基于 Nuxt 3 的实时策略游戏，玩家可以建造和管理自己的蚂蚁巢穴，发展蚂蚁帝国。

## 🎮 游戏特色

### 🏠 巢穴建设系统
- **多层巢穴结构**：地表层、上层、中层、深层
- **房间类型**：防御工事、储藏室、育婴室、蚁后宫殿等
- **升级系统**：提升房间等级，增加容量和效率

### 🐜 蚂蚁分工系统
- **工蚁** 👷：基础资源收集
- **兵蚁** ⚔️：巢穴防御和掠夺
- **蚁后** 👸：增加蚂蚁产量
- **侦察蚁** 🔍：探索新区域
- **建筑蚁** 🔨：扩建巢穴结构

### 📦 资源生态系统
- **食物** 🍯：维持蚁群生存
- **水源** 💧：幼虫培育必需
- **矿物** ⛏️：加固巢穴结构
- **蜜露** 🍯：提升蚁后繁殖力
- **真菌** 🍄：特殊资源生产

### 🔬 科技树系统
- **采集技术**：提升资源获取效率
- **军事技术**：增强战斗能力
- **建筑技术**：解锁高级巢穴结构
- **生物技术**：基因改造蚂蚁

### 📋 任务与成就
- **日常任务**：采集特定资源
- **周常任务**：击败强大敌人
- **主线任务**：蚁群发展故事
- **成就系统**：解锁特殊奖励

## 🛠️ 技术栈

- **前端框架**：Nuxt 3
- **数据库**：SQLite + Prisma ORM
- **实时通信**：Socket.io
- **样式框架**：TailwindCSS
- **图标**：Emoji (emojiall)

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 数据库设置
```bash
# 生成 Prisma 客户端
npm run db:generate

# 推送数据库模式
npm run db:push
```

### 启动开发服务器
```bash
# 启动 Nuxt 开发服务器
npm run dev
```

### 查看数据库
```bash
# 启动 Prisma Studio
npm run db:studio
```

## 📁 项目结构

```
antGame/
├── assets/
│   └── css/
│       └── main.css          # TailwindCSS 样式
├── composables/
│   └── useGame.ts            # 游戏状态管理
├── pages/
│   └── index.vue             # 主游戏界面
├── plugins/
│   ├── socket.client.ts      # Socket.io 客户端
│   └── socket.server.ts      # Socket.io 服务端
├── prisma/
│   └── schema.prisma         # 数据库模式
├── server/
│   └── api/                  # API 路由
│       ├── colony/
│       ├── resources/
│       └── chamber/
├── nuxt.config.ts            # Nuxt 配置
└── package.json              # 项目依赖
```

## 🎯 游戏玩法

### 1. 创建巢穴
- 选择合适的地点建立巢穴
- 规划不同层级的房间布局

### 2. 资源管理
- 派遣工蚁收集食物、水源、矿物
- 建造储藏室扩大资源容量
- 合理分配资源用于建设和研究

### 3. 蚂蚁培养
- 在育婴室孵化不同类型的蚂蚁
- 升级蚂蚁能力，提高工作效率
- 组建强大的蚂蚁军团

### 4. 科技发展
- 研究新技术解锁高级功能
- 优化资源采集和生产流程
- 开发军事技术增强防御能力

### 5. 任务挑战
- 完成日常任务获得奖励
- 挑战主线剧情推进游戏进度
- 解锁成就获得特殊称号

## 🔧 开发说明

### API 接口
- `GET /api/colony/[id]` - 获取巢穴信息
- `POST /api/resources/update` - 更新资源
- `POST /api/chamber/upgrade` - 升级房间

### Socket 事件
- `join-game` - 加入游戏
- `produce-resources` - 资源生产
- `chamber-upgraded` - 房间升级
- `ant-hatched` - 蚂蚁孵化
- `task-completed` - 任务完成

### 数据模型
- Player - 玩家
- Colony - 巢穴
- Chamber - 房间
- Ant - 蚂蚁
- Resource - 资源
- Technology - 科技
- Task - 任务
- Achievement - 成就

## 🎨 UI 设计

游戏采用温暖的琥珀色调，营造地下巢穴的氛围：
- 主色调：琥珀色系 (amber)
- 辅助色：橙色、黄色、绿色
- 不同层级使用不同的渐变色彩
- 响应式设计，支持桌面和移动端

## 🚧 开发计划

- [ ] 完善战斗系统
- [ ] 添加多人对战功能
- [ ] 实现交易市场
- [ ] 增加更多蚂蚁种类
- [ ] 优化游戏平衡性
- [ ] 添加音效和动画

## 📄 许可证

MIT License