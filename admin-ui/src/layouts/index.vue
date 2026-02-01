<script setup lang="ts">
import {
  DashboardOutlined,
  SearchOutlined,
  CustomerServiceOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GithubOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import { useAppStore } from '~/stores/app'
import { logout } from '~/api/auth'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const selectedKeys = computed(() => [route.name as string])

// 获取用户信息
const userInfo = computed(() => {
  const info = localStorage.getItem('userInfo')
  return info ? JSON.parse(info) : null
})

const menuItems = [
  {
    key: 'Dashboard',
    icon: () => h(DashboardOutlined),
    label: '仪表盘',
    path: '/dashboard',
  },
  {
    key: 'Search',
    icon: () => h(SearchOutlined),
    label: '音乐搜索',
    path: '/search',
  },
  {
    key: 'Music',
    icon: () => h(CustomerServiceOutlined),
    label: '音乐管理',
    path: '/music',
  },
]

function handleMenuClick({ key }: { key: string }) {
  const item = menuItems.find(m => m.key === key)
  if (item) {
    router.push(item.path)
  }
}

// 退出登录
function handleLogout() {
  Modal.confirm({
    title: '确认退出',
    content: '确定要退出登录吗？',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        await logout()
      } catch (error) {
        // 忽略错误，继续退出
      } finally {
        // 清除本地存储
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        message.success('已退出登录')
        router.push('/login')
      }
    },
  })
}
</script>

<template>
  <a-layout class="layout-container">
    <a-layout-sider
      v-model:collapsed="appStore.collapsed"
      :trigger="null"
      collapsible
      theme="light"
      class="layout-sider"
      :width="220"
      :collapsed-width="80"
    >
      <!-- Logo -->
      <div class="logo-container">
        <img src="/logo.svg" alt="logo" class="logo-img" />
        <transition name="fade">
          <span v-if="!appStore.collapsed" class="logo-title">
            音乐管理平台
          </span>
        </transition>
      </div>
      
      <!-- Menu -->
      <a-menu
        v-model:selectedKeys="selectedKeys"
        mode="inline"
        :items="menuItems"
        class="layout-menu"
        @click="handleMenuClick"
      />
      
      <!-- Footer -->
      <div class="sider-footer">
        <a-tooltip v-if="appStore.collapsed" title="GitHub" placement="right">
          <GithubOutlined class="footer-icon" />
        </a-tooltip>
        <template v-else>
          <span class="footer-text">Music Admin v1.0</span>
        </template>
      </div>
    </a-layout-sider>
    
    <a-layout :class="['layout-main', { 'layout-main-collapsed': appStore.collapsed }]">
      <!-- Header -->
      <a-layout-header class="layout-header">
        <div class="header-left">
          <component
            :is="appStore.collapsed ? MenuUnfoldOutlined : MenuFoldOutlined"
            class="trigger-icon"
            @click="appStore.toggleCollapsed"
          />
          <a-breadcrumb class="breadcrumb">
            <a-breadcrumb-item>
              <router-link to="/dashboard">首页</router-link>
            </a-breadcrumb-item>
            <a-breadcrumb-item>{{ route.meta.title }}</a-breadcrumb-item>
          </a-breadcrumb>
        </div>
        <div class="header-right">
          <a-space :size="16">
            <a-tag color="blue">开发环境</a-tag>
            <a-dropdown>
              <div class="user-info">
                <a-avatar :size="32" :style="{ backgroundColor: '#1677ff' }">
                  <template #icon>
                    <UserOutlined />
                  </template>
                </a-avatar>
                <span class="user-name">{{ userInfo?.nickname || userInfo?.username || '管理员' }}</span>
              </div>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="logout" @click="handleLogout">
                    <LogoutOutlined />
                    <span class="ml-2">退出登录</span>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-space>
        </div>
      </a-layout-header>
      
      <!-- Content -->
      <a-layout-content class="layout-content">
        <RouterView v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100vw;
}

.layout-sider {
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.logo-container {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
}

.logo-img {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.logo-title {
  margin-left: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #1677ff;
  white-space: nowrap;
}

.layout-menu {
  flex: 1;
  border-inline-end: none !important;
}

.sider-footer {
  padding: 16px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

.footer-icon {
  font-size: 18px;
  color: #999;
  cursor: pointer;
}

.footer-icon:hover {
  color: #1677ff;
}

.footer-text {
  font-size: 12px;
  color: #999;
}

.layout-main {
  margin-left: 220px;
  transition: margin-left 0.2s;
}

.layout-main-collapsed {
  margin-left: 80px;
}

.layout-header {
  height: 64px;
  padding: 0 24px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 99;
}

.header-left {
  display: flex;
  align-items: center;
}

.trigger-icon {
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.trigger-icon:hover {
  background: #f5f5f5;
  color: #1677ff;
}

.breadcrumb {
  margin-left: 16px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.user-name {
  font-size: 14px;
  color: #333;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layout-content {
  margin: 16px;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  min-height: calc(100vh - 64px - 32px);
  overflow: auto;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease-out;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
