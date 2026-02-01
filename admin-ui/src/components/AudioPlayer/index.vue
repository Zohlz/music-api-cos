<script setup lang="ts">
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SoundOutlined,
  CloseOutlined,
  LoadingOutlined,
  StepForwardOutlined,
  StepBackwardOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useAppStore } from '~/stores/app'
import { formatDuration } from '~/utils/format'
import { nextTick } from 'vue'

const appStore = useAppStore()

const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const isLoading = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(80)
const isMuted = ref(false)
const isDragging = ref(false)

// 计算进度百分比
const progress = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

// 监听当前音乐变化
watch(() => appStore.currentMusic, async (music) => {
  if (music) {
    // 等待下一个渲染周期，保证 <audio> 已经挂载并可用
    await nextTick()
    if (!audioRef.value) return

    isLoading.value = true
    currentTime.value = 0
    duration.value = 0

    // 先重置再赋值，避免某些浏览器不触发加载
    audioRef.value.pause()
    audioRef.value.src = ''
    audioRef.value.src = music.audioUrl
    try {
      await audioRef.value.play()
      isPlaying.value = true
    } catch (error: any) {
      isPlaying.value = false
      message.error('播放失败: ' + (error?.message || ''))
    }
  }
}, { immediate: true })

// 监听音量变化
watch(volume, (val) => {
  if (audioRef.value) {
    audioRef.value.volume = val / 100
    isMuted.value = val === 0
  }
})

function togglePlay() {
  if (!audioRef.value || isLoading.value) return
  
  if (isPlaying.value) {
    audioRef.value.pause()
    isPlaying.value = false
  } else {
    audioRef.value.play().then(() => {
      isPlaying.value = true
    })
  }
}

function toggleMute() {
  if (isMuted.value) {
    volume.value = 80
  } else {
    volume.value = 0
  }
}

function handleTimeUpdate() {
  if (audioRef.value && !isDragging.value) {
    currentTime.value = audioRef.value.currentTime
  }
}

function handleLoadedMetadata() {
  if (audioRef.value) {
    duration.value = audioRef.value.duration
    isLoading.value = false
  }
}

function handleCanPlay() {
  isLoading.value = false
}

function handleWaiting() {
  isLoading.value = true
}

function handleEnded() {
  isPlaying.value = false
  currentTime.value = 0
}

function handleError() {
  isLoading.value = false
  isPlaying.value = false
  
  const error = audioRef.value?.error
  let errorMsg = '音频加载失败'
  if (error) {
    switch (error.code) {
      case 1: errorMsg = '音频加载被中止'; break
      case 2: errorMsg = '网络错误，无法加载音频'; break
      case 3: errorMsg = '音频解码失败'; break
      case 4: errorMsg = '音频格式不支持或URL无效'; break
    }
  }
  message.error(errorMsg)
}

function handleProgressClick(e: MouseEvent) {
  if (!audioRef.value || isLoading.value) return
  
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  audioRef.value.currentTime = percent * duration.value
}

function handleClose() {
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.src = ''
  }
  isPlaying.value = false
  isLoading.value = false
  currentTime.value = 0
  duration.value = 0
  appStore.clearCurrentMusic()
}

// 快进/快退 5 秒
function seekForward() {
  if (audioRef.value) {
    audioRef.value.currentTime = Math.min(audioRef.value.currentTime + 5, duration.value)
  }
}

function seekBackward() {
  if (audioRef.value) {
    audioRef.value.currentTime = Math.max(audioRef.value.currentTime - 5, 0)
  }
}
</script>

<template>
  <transition name="slide-up">
    <div v-if="appStore.currentMusic" class="audio-player">
      <audio
        ref="audioRef"
        preload="auto"
        @timeupdate="handleTimeUpdate"
        @loadedmetadata="handleLoadedMetadata"
        @canplay="handleCanPlay"
        @waiting="handleWaiting"
        @ended="handleEnded"
        @error="handleError"
      />
      
      <!-- 进度条 -->
      <div class="progress-bar" @click="handleProgressClick">
        <div class="progress-fill" :style="{ width: `${progress}%` }" />
      </div>
      
      <div class="player-content">
        <!-- 封面和信息 -->
        <div class="music-info">
          <a-avatar
            :src="appStore.currentMusic.coverUrl"
            :size="48"
            shape="square"
            class="cover"
          />
          <div class="info">
            <div class="song-name">{{ appStore.currentMusic.songName }}</div>
            <div class="artist">{{ appStore.currentMusic.artist }}</div>
          </div>
        </div>
        
        <!-- 控制区域 -->
        <div class="controls">
          <a-button type="text" size="small" @click="seekBackward">
            <template #icon>
              <StepBackwardOutlined />
            </template>
          </a-button>
          
          <a-button
            type="text"
            size="large"
            class="play-btn"
            :disabled="isLoading"
            @click="togglePlay"
          >
            <template #icon>
              <LoadingOutlined v-if="isLoading" class="text-2xl" spin />
              <PauseCircleOutlined v-else-if="isPlaying" class="text-2xl" />
              <PlayCircleOutlined v-else class="text-2xl" />
            </template>
          </a-button>
          
          <a-button type="text" size="small" @click="seekForward">
            <template #icon>
              <StepForwardOutlined />
            </template>
          </a-button>
          
          <span class="time">
            {{ formatDuration(currentTime) }} / {{ formatDuration(duration) }}
          </span>
        </div>
        
        <!-- 音量和关闭 -->
        <div class="right-controls">
          <a-button type="text" size="small" @click="toggleMute">
            <template #icon>
              <SoundOutlined :class="{ 'text-gray-300': isMuted }" />
            </template>
          </a-button>
          <a-slider
            v-model:value="volume"
            :min="0"
            :max="100"
            class="volume-slider"
          />
          <a-button type="text" size="small" @click="handleClose">
            <template #icon>
              <CloseOutlined />
            </template>
          </a-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.audio-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.progress-bar {
  height: 4px;
  background: #f0f0f0;
  cursor: pointer;
  position: relative;
  transition: height 0.2s;
}

.progress-bar:hover {
  height: 6px;
}

.progress-bar:hover .progress-fill::after {
  opacity: 1;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1677ff, #69b1ff);
  transition: width 0.1s linear;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  background: #1677ff;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s;
  box-shadow: 0 2px 4px rgba(22, 119, 255, 0.4);
}

.player-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.music-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.cover {
  flex-shrink: 0;
}

.info {
  margin-left: 12px;
  min-width: 0;
}

.song-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artist {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.play-btn {
  color: #1677ff;
}

.time {
  font-size: 12px;
  color: #666;
  min-width: 100px;
  text-align: center;
}

.right-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-icon {
  color: #666;
}

.volume-slider {
  width: 100px;
}

/* Transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .player-content {
    padding: 8px 12px;
  }
  
  .music-info .info {
    max-width: 100px;
  }
  
  .controls {
    gap: 8px;
  }
  
  .time {
    display: none;
  }
  
  .volume-slider {
    width: 60px;
  }
  
  .right-controls {
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .volume-slider {
    display: none;
  }
  
  .music-info .info {
    max-width: 80px;
  }
}
</style>
