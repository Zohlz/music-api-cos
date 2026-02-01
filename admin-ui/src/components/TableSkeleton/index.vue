<script setup lang="ts">
interface Props {
  rows?: number
  columns?: number
  showHeader?: boolean
}

withDefaults(defineProps<Props>(), {
  rows: 5,
  columns: 5,
  showHeader: true,
})
</script>

<template>
  <div class="table-skeleton">
    <!-- 表头 -->
    <div v-if="showHeader" class="skeleton-header">
      <div 
        v-for="i in columns" 
        :key="`header-${i}`" 
        class="skeleton-cell header-cell"
      >
        <a-skeleton-input active :size="'small'" style="width: 80px" />
      </div>
    </div>
    
    <!-- 表格行 -->
    <div 
      v-for="row in rows" 
      :key="`row-${row}`" 
      class="skeleton-row"
    >
      <div 
        v-for="col in columns" 
        :key="`cell-${row}-${col}`" 
        class="skeleton-cell"
      >
        <!-- 第一列显示头像+文字 -->
        <template v-if="col === 1">
          <div class="flex items-center">
            <a-skeleton-avatar active :size="40" shape="square" />
            <a-skeleton-input active :size="'small'" style="width: 120px; margin-left: 12px" />
          </div>
        </template>
        <!-- 其他列显示普通骨架 -->
        <template v-else>
          <a-skeleton-input 
            active 
            :size="'small'" 
            :style="{ width: col === columns ? '60px' : '80px' }" 
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-skeleton {
  width: 100%;
}

.skeleton-header {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.skeleton-row {
  display: flex;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.skeleton-cell {
  flex: 1;
  padding: 0 8px;
}

.skeleton-cell:first-child {
  flex: 2;
}

.header-cell {
  font-weight: 500;
}
</style>
