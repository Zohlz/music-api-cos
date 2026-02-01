<script setup lang="ts">
import {
  CustomerServiceOutlined,
  PlusCircleOutlined,
  PlayCircleOutlined,
  RiseOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { getMusicList, getMusicPlayInfo } from '~/api/music'
import { useAppStore } from '~/stores/app'
import { formatDuration, formatDateTime } from '~/utils/format'
import type { Music } from '../../../types'

const router = useRouter()
const appStore = useAppStore()

const loading = ref(false)
const stats = ref({
  total: 0,
  todayNew: 0,
  totalPlays: 0,
})
const recentMusic = ref<Music[]>([])
const hotMusic = ref<Music[]>([])

const recentColumns = [
  { title: '歌曲', dataIndex: 'songName', key: 'songName' },
  { title: '歌手', dataIndex: 'artist', key: 'artist', width: 120 },
  { title: '时长', dataIndex: 'duration', key: 'duration', width: 80 },
  { title: '添加时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
  { title: '操作', key: 'action', width: 80 },
]

async function fetchData() {
  loading.value = true
  try {
    const res = await getMusicList({ pageNum: 1, pageSize: 10 })
    if (res.code === 200 && res.data) {
      stats.value.total = res.data.total
      recentMusic.value = res.data.rows
      // 计算总播放次数
      stats.value.totalPlays = res.data.rows.reduce((sum, item) => sum + (item.playCount || 0), 0)
      // 按播放次数排序获取热门音乐
      hotMusic.value = [...res.data.rows].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 5)
      // 简单计算今日新增（比较createTime）
      const today = new Date().toDateString()
      stats.value.todayNew = res.data.rows.filter(item =>
        new Date(item.createTime).toDateString() === today
      ).length
    }
  } finally {
    loading.value = false
  }
}

async function handlePlay(record: Music) {
  try {
    // 获取实际的播放链接（使用代理URL）
    const res = await getMusicPlayInfo(record.musicId)
    if (res.code === 200 && res.data?.audioUrl) {
      appStore.setCurrentMusic({
        musicId: record.musicId,
        songName: record.songName,
        artist: record.artist,
        audioUrl: res.data.audioUrl,
        coverUrl: record.coverUrl,
      })
    } else {
      message.error('获取播放链接失败')
    }
  } catch (error) {
    message.error('播放失败，请稍后重试')
  }
}

function goToSearch() {
  router.push('/search')
}

function goToMusic() {
  router.push('/music')
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <a-row :gutter="16" class="mb-4">
      <a-col :xs="24" :sm="8">
        <a-card class="stat-card" hoverable @click="goToMusic">
          <a-statistic 
            title="音乐总数" 
            :value="stats.total"
            :value-style="{ color: '#1677ff', fontSize: '28px' }"
          >
            <template #prefix>
              <CustomerServiceOutlined class="stat-icon text-blue-500" />
            </template>
            <template #suffix>
              <span class="text-sm text-gray-400">首</span>
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="8">
        <a-card class="stat-card" hoverable @click="goToSearch">
          <a-statistic 
            title="今日新增" 
            :value="stats.todayNew"
            :value-style="{ color: '#52c41a', fontSize: '28px' }"
          >
            <template #prefix>
              <PlusCircleOutlined class="stat-icon text-green-500" />
            </template>
            <template #suffix>
              <span class="text-sm text-gray-400">首</span>
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="8">
        <a-card class="stat-card">
          <a-statistic 
            title="播放总次数" 
            :value="stats.totalPlays"
            :value-style="{ color: '#fa8c16', fontSize: '28px' }"
          >
            <template #prefix>
              <PlayCircleOutlined class="stat-icon text-orange-500" />
            </template>
            <template #suffix>
              <span class="text-sm text-gray-400">次</span>
            </template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16">
      <!-- 最近添加 -->
      <a-col :xs="24" :lg="16">
        <a-card :loading="loading" class="mb-4">
          <template #title>
            <div class="flex-between">
              <span>最近添加</span>
              <a-button type="link" size="small" @click="goToMusic">
                查看全部 <ArrowRightOutlined />
              </a-button>
            </div>
          </template>
          
          <a-empty v-if="recentMusic.length === 0" description="暂无音乐">
            <a-button type="primary" @click="goToSearch">去搜索添加</a-button>
          </a-empty>
          
          <a-table
            v-else
            :columns="recentColumns"
            :data-source="recentMusic"
            :pagination="false"
            row-key="musicId"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'songName'">
                <div class="flex items-center">
                  <a-avatar
                    v-if="record.coverUrl"
                    :src="record.coverUrl"
                    shape="square"
                    :size="36"
                    class="mr-2 cursor-pointer"
                    @click="handlePlay(record as Music)"
                  />
                  <span class="truncate">{{ record.songName }}</span>
                </div>
              </template>
              <template v-else-if="column.key === 'duration'">
                <span class="text-gray-500">{{ formatDuration(record.duration) }}</span>
              </template>
              <template v-else-if="column.key === 'createTime'">
                <span class="text-gray-500 text-xs">{{ formatDateTime(record.createTime) }}</span>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-button 
                  type="link" 
                  size="small" 
                  :disabled="!record.audioUrl"
                  @click="handlePlay(record as Music)"
                >
                  <PlayCircleOutlined />
                </a-button>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
      
      <!-- 热门音乐 -->
      <a-col :xs="24" :lg="8">
        <a-card :loading="loading" class="mb-4">
          <template #title>
            <span><RiseOutlined class="mr-1 text-red-500" /> 热门音乐</span>
          </template>
          
          <a-empty v-if="hotMusic.length === 0" description="暂无数据" />
          
          <a-list v-else :data-source="hotMusic" size="small">
            <template #renderItem="{ item, index }">
              <a-list-item class="hot-music-item cursor-pointer" @click="handlePlay(item as Music)">
                <div class="flex items-center w-full">
                  <span 
                    class="rank-number" 
                    :class="{ 'top-three': index < 3 }"
                  >
                    {{ index + 1 }}
                  </span>
                  <a-avatar
                    :src="item.coverUrl"
                    shape="square"
                    :size="32"
                    class="mx-2"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="truncate text-sm">{{ item.songName }}</div>
                    <div class="text-xs text-gray-400 truncate">{{ item.artist }}</div>
                  </div>
                  <PlayCircleOutlined v-if="item.audioUrl" class="text-gray-400 hover:text-primary" />
                </div>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
        
        <!-- 快捷操作 -->
        <a-card title="快捷操作">
          <a-space direction="vertical" class="w-full">
            <a-button type="primary" block @click="goToSearch">
              <template #icon><PlusCircleOutlined /></template>
              搜索添加音乐
            </a-button>
            <a-button block @click="goToMusic">
              <template #icon><CustomerServiceOutlined /></template>
              管理音乐库
            </a-button>
          </a-space>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<style scoped>
.stat-card {
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 24px;
  margin-right: 8px;
}

.hot-music-item {
  padding: 8px 0;
  transition: background 0.3s;
}

.hot-music-item:hover {
  background: #fafafa;
}

.rank-number {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: #999;
}

.rank-number.top-three {
  background: linear-gradient(135deg, #ff6b6b, #ffa500);
  color: #fff;
  border-radius: 4px;
}
</style>
