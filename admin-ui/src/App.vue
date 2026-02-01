<script setup lang="ts">
import { theme } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import AudioPlayer from '~/components/AudioPlayer/index.vue'

const customTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#1677ff',
  },
}
</script>

<template>
  <a-config-provider :theme="customTheme" :locale="zhCN">
    <RouterView />
    <AudioPlayer />
  </a-config-provider>
</template>
