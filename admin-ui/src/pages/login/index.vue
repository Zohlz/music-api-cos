<script setup lang="ts">
import { LockOutlined, UserOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { login } from '~/api/auth'
import { useRouter } from 'vue-router'

const router = useRouter()

const loading = ref(false)
const loginForm = ref({
  username: '',
  password: '',
  remember: true,
})

const formRef = shallowRef()

async function handleLogin() {
  try {
    await formRef.value?.validate()
    
    loading.value = true
    const res = await login({
      username: loginForm.value.username,
      password: loginForm.value.password,
    })
    
    if (res.code === 200 && res.data) {
      // 保存token和用户信息
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('userInfo', JSON.stringify(res.data.user))
      
      message.success('登录成功')
      
      // 跳转到首页
      router.push('/')
    } else {
      message.error(res.msg || '登录失败')
    }
  } catch (error: any) {
    if (error.errorFields) {
      // 表单验证错误
      return
    }
    message.error('登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-content">
      <div class="ant-pro-form-login-container">
        <div class="ant-pro-form-login-top">
          <div class="ant-pro-form-login-header">
            <span class="ant-pro-form-login-logo">
              <span class="text-4xl">🎵</span>
            </span>
            <span class="ant-pro-form-login-title">
              音乐管理平台
            </span>
          </div>
          <div class="ant-pro-form-login-desc">
            Music Management Platform - 基于 Vue 3 + Ant Design Vue
          </div>
        </div>
        <div class="ant-pro-form-login-main">
          <a-form ref="formRef" :model="loginForm">
            <a-form-item name="username" :rules="[{ required: true, message: '请输入用户名' }]">
              <a-input
                v-model:value="loginForm.username"
                allow-clear
                placeholder="用户名："
                size="large"
                @press-enter="handleLogin"
              >
                <template #prefix>
                  <UserOutlined />
                </template>
              </a-input>
            </a-form-item>
            <a-form-item name="password" :rules="[{ required: true, message: '请输入密码' }]">
              <a-input-password
                v-model:value="loginForm.password"
                allow-clear
                placeholder="密码："
                size="large"
                @press-enter="handleLogin"
              >
                <template #prefix>
                  <LockOutlined />
                </template>
              </a-input-password>
            </a-form-item>
            <div class="mb-24px" flex items-center justify-between>
              <a-checkbox v-model:checked="loginForm.remember">
                自动登录
              </a-checkbox>
            </div>
            <a-button type="primary" block :loading="loading" size="large" @click="handleLogin">
              登录
            </a-button>
          </a-form>
        </div>
      </div>
    </div>
    <div class="login-footer">
      <div class="text-center text-14px text-gray-500">
        Copyright © 2026 xxx
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.login-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: auto;
  background: #f0f2f5;
}

.login-content {
  flex: 1 1;
  padding: 32px 0;
}

.ant-pro-form-login-container {
  display: flex;
  flex: 1 1;
  flex-direction: column;
  height: 100%;
  padding: 32px 0;
  overflow: auto;
  background: inherit;
}

.ant-pro-form-login-top {
  text-align: center;
}

.ant-pro-form-login-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  line-height: 44px;
}

.ant-pro-form-login-header a {
  text-decoration: none;
}

.ant-pro-form-login-title {
  position: relative;
  top: 2px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 600;
  font-size: 33px;
}

.ant-pro-form-login-logo {
  width: 44px;
  height: 44px;
  margin-right: 16px;
  vertical-align: top;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ant-pro-form-login-desc {
  margin-top: 12px;
  margin-bottom: 40px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.ant-pro-form-login-main {
  min-width: 328px;
  max-width: 400px;
  margin: 0 auto;
}

.login-tips {
  margin-top: 24px;
}

.login-footer {
  padding: 24px 50px;
}

@media (min-width: 768px) {
  .login-container {
    background-image: url(https://gw.alipayobjects.com/zos/rmsportal/TVYTbAXWheQpRcWDaDMu.svg);
    background-repeat: no-repeat;
    background-position: center 110px;
    background-size: 100%;
  }

  .login-content {
    padding: 32px 0 24px;
  }

  .ant-pro-form-login-container {
    padding: 32px 0 24px;
    background-repeat: no-repeat;
    background-position: center 110px;
    background-size: 100%;
  }
}

@media (max-width: 768px) {
  .ant-pro-form-login-main {
    width: 95%;
    max-width: 328px;
  }
}
</style>
