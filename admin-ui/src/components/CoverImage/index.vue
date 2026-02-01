<script setup lang="ts">
import { CustomerServiceOutlined } from '@ant-design/icons-vue'

interface Props {
  src?: string
  size?: number | 'small' | 'default' | 'large'
  shape?: 'circle' | 'square'
  playable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  size: 'default',
  shape: 'square',
  playable: false,
})

const emit = defineEmits<{
  (e: 'click'): void
}>()

const imageError = ref(false)

const sizeValue = computed(() => {
  if (typeof props.size === 'number') return props.size
  const sizeMap = { small: 32, default: 48, large: 64 }
  return sizeMap[props.size] || 48
})

function handleError() {
  imageError.value = true
}

function handleClick() {
  emit('click')
}

// 重置错误状态当 src 变化时
watch(() => props.src, () => {
  imageError.value = false
})
</script>

<template>
  <div 
    class="cover-image"
    :class="[
      `cover-${shape}`,
      { 'cover-playable': playable }
    ]"
    :style="{ 
      width: `${sizeValue}px`, 
      height: `${sizeValue}px` 
    }"
    @click="handleClick"
  >
    <img 
      v-if="src && !imageError"
      :src="src" 
      :alt="'cover'"
      class="cover-img"
      @error="handleError"
    />
    <div v-else class="cover-placeholder">
      <CustomerServiceOutlined :style="{ fontSize: `${sizeValue / 2}px` }" />
    </div>
    
    <!-- 播放遮罩 -->
    <div v-if="playable" class="cover-overlay">
      <PlayCircleOutlined class="play-icon" />
    </div>
  </div>
</template>

<script lang="ts">
import { PlayCircleOutlined } from '@ant-design/icons-vue'
export default {
  components: { PlayCircleOutlined }
}
</script>

<style scoped>
.cover-image {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  background: #f5f5f5;
}

.cover-square {
  border-radius: 6px;
}

.cover-circle {
  border-radius: 50%;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d9d9d9;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
}

.cover-playable {
  cursor: pointer;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.cover-playable:hover .cover-overlay {
  opacity: 1;
}

.play-icon {
  color: #fff;
  font-size: 24px;
}
</style>
