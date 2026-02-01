import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  // 侧边栏折叠状态
  const collapsed = ref(false)
  
  // 当前播放的音乐
  const currentMusic = ref<{
    musicId: number
    songName: string
    artist: string
    audioUrl: string
    coverUrl: string
  } | null>(null)
  
  // 切换侧边栏
  function toggleCollapsed() {
    collapsed.value = !collapsed.value
  }
  
  // 设置当前播放音乐
  function setCurrentMusic(music: typeof currentMusic.value) {
    currentMusic.value = music
  }
  
  // 清除当前播放
  function clearCurrentMusic() {
    currentMusic.value = null
  }
  
  return {
    collapsed,
    currentMusic,
    toggleCollapsed,
    setCurrentMusic,
    clearCurrentMusic,
  }
})
