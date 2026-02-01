<script setup lang="ts">
import { SearchOutlined, DeleteOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import { getMusicList, deleteMusic, batchDeleteMusic, getMusicPlayInfo } from '~/api/music'
import { useAppStore } from '~/stores/app'
import { formatDuration, formatDateTime } from '~/utils/format'
import type { Music } from '../../../types'

const appStore = useAppStore()

const loading = ref(false)
const musicList = ref<Music[]>([])
const total = ref(0)
const selectedRowKeys = ref<number[]>([])

const searchForm = ref({
  songName: '',
  artist: '',
})

const pagination = ref({
  current: 1,
  pageSize: 20,
})

const columns = [
  { title: '歌曲', dataIndex: 'songName', key: 'songName' },
  { title: '歌手', dataIndex: 'artist', key: 'artist', width: 150 },
  { title: '专辑', dataIndex: 'album', key: 'album', width: 180 },
  { title: '时长', dataIndex: 'duration', key: 'duration', width: 80 },
  { title: '来源', dataIndex: 'source', key: 'source', width: 80 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' as const },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await getMusicList({
      pageNum: pagination.value.current,
      pageSize: pagination.value.pageSize,
      songName: searchForm.value.songName || undefined,
      artist: searchForm.value.artist || undefined,
    })
    if (res.code === 200 && res.data) {
      musicList.value = res.data.rows
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.value.current = 1
  fetchList()
}

function handleReset() {
  searchForm.value = { songName: '', artist: '' }
  pagination.value.current = 1
  fetchList()
}

function handleTableChange(pag: any) {
  pagination.value.current = pag.current
  pagination.value.pageSize = pag.pageSize
  fetchList()
}

async function handlePlay(record: Music) {
  try {
    // 获取实际的播放链接
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

function handleDelete(record: Music) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除《${record.songName}》吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res = await deleteMusic(record.musicId)
        if (res.code === 200) {
          message.success('删除成功')
          fetchList()
        } else {
          message.error(res.msg || '删除失败')
        }
      } catch {
        message.error('删除失败')
      }
    },
  })
}

async function confirmDelete(record: Music) {
  try {
    const res = await deleteMusic(record.musicId)
    if (res.code === 200) {
      message.success('删除成功')
      fetchList()
    } else {
      message.error(res.msg || '删除失败')
    }
  } catch {
    message.error('删除失败')
  }
}

function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的音乐')
    return
  }
  Modal.confirm({
    title: '确认批量删除',
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 首音乐吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res = await batchDeleteMusic(selectedRowKeys.value)
        if (res.code === 200) {
          message.success('删除成功')
          selectedRowKeys.value = []
          fetchList()
        } else {
          message.error(res.msg || '删除失败')
        }
      } catch {
        message.error('删除失败')
      }
    },
  })
}

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: number[]) => {
    selectedRowKeys.value = keys
  },
}))

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div>
    <a-card class="mb-4">
      <a-form layout="inline">
        <a-form-item label="歌曲名">
          <a-input
            v-model:value="searchForm.songName"
            placeholder="请输入歌曲名"
            allow-clear
            style="width: 180px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="歌手">
          <a-input
            v-model:value="searchForm.artist"
            placeholder="请输入歌手"
            allow-clear
            style="width: 180px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" :loading="loading" @click="handleSearch">
              <template #icon><SearchOutlined /></template>
              搜索
            </a-button>
            <a-button @click="handleReset">
              <template #icon><ReloadOutlined /></template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card>
      <template #title>
        <span>音乐列表</span>
        <a-tag v-if="total > 0" class="ml-2" color="blue">{{ total }} 首</a-tag>
      </template>
      <template #extra>
        <a-space>
          <a-button @click="fetchList">
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
          <a-button
            v-if="selectedRowKeys.length > 0"
            danger
            @click="handleBatchDelete"
          >
            <template #icon><DeleteOutlined /></template>
            批量删除 ({{ selectedRowKeys.length }})
          </a-button>
        </a-space>
      </template>

      <!-- 空状态 -->
      <a-empty
        v-if="!loading && musicList.length === 0"
        class="py-12"
      >
        <template #description>
          <span>暂无音乐数据</span>
          <br />
          <router-link to="/search" class="text-primary mt-2 inline-block">
            去搜索添加 →
          </router-link>
        </template>
      </a-empty>

      <a-table
        v-else
        :columns="columns"
        :data-source="musicList"
        :loading="loading"
        :row-selection="rowSelection"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t: number) => `共 ${t} 条`,
        }"
        row-key="musicId"
        :scroll="{ x: 900 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'songName'">
            <div class="flex items-center">
              <a-avatar
                v-if="record.coverUrl"
                :src="record.coverUrl"
                shape="square"
                :size="48"
                class="mr-3 flex-shrink-0 cursor-pointer"
                @click="handlePlay(record)"
              >
                <template #icon>
                  <CustomerServiceOutlined />
                </template>
              </a-avatar>
              <div class="min-w-0">
                <div class="font-medium truncate">{{ record.songName }}</div>
                <div class="text-xs text-gray-400">ID: {{ record.songId }}</div>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'source'">
            <a-tag :color="record.source === 'kuwo' ? 'orange' : 'blue'">
              {{ record.source || 'kuwo' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'duration'">
            <span class="text-gray-500">{{ formatDuration(record.duration) }}</span>
          </template>
          <template v-else-if="column.key === 'createTime'">
            <span class="text-gray-500">{{ formatDateTime(record.createTime) }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-tooltip title="播放">
                <a-button 
                  type="primary" 
                  shape="circle" 
                  size="small" 
                  @click="handlePlay(record)"
                >
                  <template #icon><PlayCircleOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-popconfirm
                title="确定要删除这首歌曲吗？"
                ok-text="删除"
                cancel-text="取消"
                @confirm="confirmDelete(record)"
              >
                <a-tooltip title="删除">
                  <a-button type="primary" danger shape="circle" size="small">
                    <template #icon><DeleteOutlined /></template>
                  </a-button>
                </a-tooltip>
              </a-popconfirm>
            </a-space>
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
