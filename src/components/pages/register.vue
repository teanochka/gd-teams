<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>Регистрация</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>Имя пользователя (@name)</label>
          <input v-model="username" type="text" placeholder="username" required />
        </div>
        <div class="form-group">
          <label>Отображаемое имя</label>
          <input v-model="displayName" type="text" placeholder="Иван Иванов" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" required />
        </div>
        <div class="form-group">
          <label>Пароль</label>
          <input v-model="password" type="password" required />
        </div>
        <div class="form-group">
          <label>Секретное слово (для восстановления)</label>
          <input v-model="secretWord" type="text" placeholder="Любимое блюдо?" />
        </div>
        <div v-if="error" class="error-msg">{{ error }}</div>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Регистрация...' : 'Создать аккаунт' }}
        </button>
        <p class="switch-mode">
          Уже есть аккаунт? <router-link to="/auth/login">Войти</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const username = ref('')
const displayName = ref('')
const email = ref('')
const password = ref('')
const secretWord = ref('')
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  loading.value = true
  error.value = ''
  try {
    await auth.register({
      username: username.value,
      displayName: displayName.value,
      email: email.value,
      password: password.value,
      secretWord: secretWord.value
    })
    await auth.login(username.value, password.value)
    router.push('/projects')
  } catch (e: any) {
    error.value = e.message || 'Ошибка регистрации'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--bg-primary);
}
.auth-card {
  background: var(--bg-secondary);
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}
h2 {
  margin-bottom: 1.5rem;
  text-align: center;
}
.form-group {
  margin-bottom: 1rem;
}
label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}
input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-primary);
}
button {
  width: 100%;
  padding: 0.75rem;
  background: var(--primary-color, #4a90e2);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
}
button:disabled {
  opacity: 0.7;
}
.error-msg {
  color: #ff4d4f;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}
.switch-mode {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
}
</style>
