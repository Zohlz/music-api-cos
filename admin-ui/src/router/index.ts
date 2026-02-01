import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { message } from 'ant-design-vue'

const Layout = () => import('~/layouts/index.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('~/pages/login/index.vue'),
    meta: {
      title: '登录',
      requiresAuth: false,
    },
  },
  {
    path: '/',
    name: 'Root',
    redirect: '/dashboard',
    component: Layout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('~/pages/dashboard/index.vue'),
        meta: {
          title: '仪表盘',
          icon: 'DashboardOutlined',
          requiresAuth: true,
        },
      },
      {
        path: 'search',
        name: 'Search',
        component: () => import('~/pages/search/index.vue'),
        meta: {
          title: '音乐搜索',
          icon: 'SearchOutlined',
          requiresAuth: true,
        },
      },
      {
        path: 'music',
        name: 'Music',
        component: () => import('~/pages/music/index.vue'),
        meta: {
          title: '音乐管理',
          icon: 'CustomerServiceOutlined',
          requiresAuth: true,
        },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !token) {
    // 需要认证但没有token，跳转到登录页
    message.warning('请先登录')
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  } else if (to.path === '/login' && token) {
    // 已登录用户访问登录页，跳转到首页
    next('/')
  } else {
    next()
  }
})

export default router
