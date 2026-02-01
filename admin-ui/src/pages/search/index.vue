<script setup lang="ts">
import { SearchOutlined, DownloadOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { searchMusic } from '~/api/search'
import { parseMusic } from '~/api/music'
import { formatDuration, formatPlayCount } from '~/utils/format'
import type { SearchResultItem } from '../../../types'

const keyword = ref('')
const loading = ref(false)
const searchResult = ref<SearchResultItem[]>([])
const total = ref(0)
const hasSearched = ref(false)
const pagination = ref({
  current: 1,
  pageSize: 10,
})
const parsingIds = ref<Set<string>>(new Set())
const savedIds = ref<Set<string>>(new Set()) // 记录已保存的歌曲

const columns = [
  { title: '歌曲', dataIndex: 'songName', key: 'songName' },
  { title: '歌手', dataIndex: 'artist', key: 'artist', width: 150 },
  { title: '专辑', dataIndex: 'album', key: 'album', width: 200, ellipsis: true },
  { title: '时长', dataIndex: 'duration', key: 'duration', width: 80, align: 'center' as const },
  { title: '播放量', dataIndex: 'playCount', key: 'playCount', width: 100, align: 'right' as const },
  { title: '操作', key: 'action', width: 120, fixed: 'right' as const, align: 'center' as const },
]

async function handleSearch() {
  if (!keyword.value.trim()) {
    message.warning('请输入搜索关键词')
    return
  }
  
  loading.value = true
  hasSearched.value = true
  try {
    const res = await searchMusic({
      keyword: keyword.value,
      pageNum: pagination.value.current,
      pageSize: pagination.value.pageSize,
    })
    if (res.code === 200 && res.data) {
      searchResult.value = res.data.rows
      total.value = res.data.total
    } else {
      searchResult.value = []
      total.value = 0
    }
  } catch {
    searchResult.value = []
    total.value = 0
    message.error('搜索失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

async function handleParse(record: SearchResultItem) {
  if (parsingIds.value.has(record.songId)) return
  if (savedIds.value.has(record.songId)) {
    message.info('该歌曲已保存')
    return
  }
  
  parsingIds.value.add(record.songId)
  try {
    const res = await parseMusic({
      songId: record.songId,
      songName: record.songName,
      artist: record.artist,
      album: record.album,
      duration: record.duration,
      coverUrl: record.coverUrl,
    })
    if (res.code === 200) {
      message.success(`《${record.songName}》保存成功`)
      savedIds.value.add(record.songId)
    } else {
      message.error(res.msg || '保存失败')
    }
  } catch {
    message.error('保存失败，请稍后重试')
  } finally {
    parsingIds.value.delete(record.songId)
  }
}

function handleTableChange(pag: any) {
  pagination.value.current = pag.current
  pagination.value.pageSize = pag.pageSize
  handleSearch()
}

function handleClear() {
  keyword.value = ''
  searchResult.value = []
  total.value = 0
  hasSearched.value = false
  pagination.value.current = 1
}
</script>

<template>
  <div>
    <a-card class="mb-4">
      <a-form layout="inline">
        <a-form-item>
          <a-input
            v-model:value="keyword"
            placeholder="请输入歌曲名或歌手"
            style="width: 350px"
            allow-clear
            size="large"
            @press-enter="handleSearch"
            @clear="handleClear"
          >
            <template #prefix>
              <SearchOutlined class="text-gray-400" />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" size="large" :loading="loading" @click="handleSearch">
            <template #icon><SearchOutlined /></template>
            搜索音乐
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card>
      <!-- 搜索结果统计 -->
      <template v-if="hasSearched && total > 0" #title>
        <span>搜索结果</span>
        <a-tag class="ml-2" color="blue">{{ total }} 首</a-tag>
      </template>
      
      <!-- 空状态 - 未搜索 -->
      <a-empty
        v-if="!hasSearched"
        description="输入关键词搜索音乐"
        class="py-12"
      >
        <template #image>
          <SearchOutlined class="text-6xl text-gray-300" />
        </template>
      </a-empty>
      
      <!-- 空状态 - 无结果 -->
      <a-empty
        v-else-if="hasSearched && searchResult.length === 0 && !loading"
        description="未找到相关音乐，请尝试其他关键词"
        class="py-12"
      />
      
      <!-- 搜索结果列表 -->
      <a-table
        v-else
        :columns="columns"
        :data-source="searchResult"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t: number) => `共 ${t} 条`,
        }"
        row-key="songId"
        :scroll="{ x: 800 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'songName'">
            <div class="flex items-center">
              <a-avatar
                :src="record.coverUrl"
                shape="square"
                :size="48"
                class="mr-3 flex-shrink-0"
              >
                <template #icon>
                  <CustomerServiceOutlined />
                </template>
              </a-avatar>
              <div class="min-w-0">
                <div class="font-medium truncate">{{ record.songName }}</div>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'duration'">
            <span class="text-gray-500">{{ formatDuration(record.duration) }}</span>
          </template>
          <template v-else-if="column.key === 'playCount'">
            <span class="text-gray-500">{{ formatPlayCount(record.playCount) }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button
              v-if="savedIds.has(record.songId)"
              type="link"
              size="small"
              disabled
              class="text-green-500"
            >
              <template #icon>
                <CheckCircleOutlined />
              </template>
              已保存
            </a-button>
            <a-button
              v-else
              type="primary"
              size="small"
              :loading="parsingIds.has(record.songId)"
              @click="handleParse(record)"
            >
              <template #icon>
                <LoadingOutlined v-if="parsingIds.has(record.songId)" />
                <DownloadOutlined v-else />
              </template>
              保存
            </a-button>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script lang="ts">
import { CustomerServiceOutlined } from '@ant-design/icons-vue'
export default {
  components: { CustomerServiceOutlined }
}
</script>
