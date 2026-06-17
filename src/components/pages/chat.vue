<template>
  <div class="chat-page">
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <h3>Каналы</h3>
        <BButton variant="light" size="sm" @click="showCreateChannel = true">
          <IconAdd />
        </BButton>
      </div>
      <div class="channel-list">
        <button
          v-for="channel in chatStore.channels"
          :key="channel.id"
          class="channel-item"
          :class="{ active: type === 'channel' && activeId === channel.id }"
          @click="selectChannel(channel.id)"
        >
          <IconHashtag v-if="!channel.is_private" />
          <IconLocked v-else />
          <span>{{ channel.name }}</span>
        </button>
      </div>

      <div class="sidebar-header mt-4">
        <h3>Личные сообщения</h3>
      </div>
      <div class="dm-list">
        <button
          v-for="user in projectUsers"
          :key="user.id"
          class="channel-item"
          :class="{ active: type === 'dm' && activeId === user.id }"
          @click="selectDM(user.id)"
        >
          <IconUser />
          <span>{{ user.display_name || user.username }}</span>
        </button>
      </div>
    </div>

    <div class="chat-main">
      <template v-if="activeId">
        <div class="chat-header">
          <h2>{{ currentTargetName }}</h2>
        </div>
        <div class="message-list" ref="messageList">
          <div
            v-for="msg in chatStore.messages"
            :key="msg.id"
            class="message-item"
            :class="{ 'my-message': msg.senderId === authStore.user?.id }"
          >
            <div class="message-sender">{{ msg.senderName }}</div>
            <div class="message-bubble">
              <div class="message-content">{{ msg.content }}</div>
              <div class="message-time">{{ formatTime(msg.createdAt) }}</div>
            </div>
          </div>
        </div>
        <div class="chat-input">
          <textarea
            v-model="newMessage"
            placeholder="Введите сообщение..."
            @keydown.enter.prevent="handleSendMessage"
          ></textarea>
          <BButton variant="primary" @click="handleSendMessage" :disabled="!newMessage.trim()">
            Отправить
          </BButton>
        </div>
      </template>
      <div v-else class="chat-empty">
        <IconChat class="empty-icon" />
        <p>Выберите канал или пользователя, чтобы начать общение</p>
      </div>
    </div>

    <!-- Modal Create Channel -->
    <BModal v-model="showCreateChannel" title="Создать канал" @ok="handleCreateChannel">
      <div class="form-group">
        <label>Название канала</label>
        <input v-model="newChannelName" type="text" class="form-control" placeholder="general" />
      </div>
      <div class="form-check mt-3">
        <input v-model="newChannelPrivate" type="checkbox" class="form-check-input" id="isPrivate" />
        <label class="form-check-label" for="isPrivate">Приватный канал</label>
      </div>
    </BModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import { apiRequest } from '@/api/http'
import IconAdd from '~icons/carbon/add'
import IconHashtag from '~icons/carbon/hashtag'
import IconLocked from '~icons/carbon/locked'
import IconUser from '~icons/carbon/user'
import IconChat from '~icons/carbon/chat'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const authStore = useAuthStore()

const projectId = computed(() => route.params.projectId as string)
const type = computed(() => route.params.type as string)
const activeId = computed(() => route.params.id as string)

const newMessage = ref('')
const messageList = ref<HTMLElement | null>(null)
const projectUsers = ref<any[]>([])

const showCreateChannel = ref(false)
const newChannelName = ref('')
const newChannelPrivate = ref(false)

const currentTargetName = computed(() => {
  if (type.value === 'channel') {
    return chatStore.channels.find(c => c.id === activeId.value)?.name || 'Канал'
  } else {
    return projectUsers.value.find(u => u.id === activeId.value)?.display_name || 'Пользователь'
  }
})

async function loadData() {
  await chatStore.loadChannels(projectId.value)
  // Загружаем участников проекта для ЛС
  const members = await apiRequest<any[]>(`/projects/${projectId.value}/members`)
  projectUsers.value = members.map(m => m.user).filter(u => u.id !== authStore.user?.id)
  
  if (activeId.value) {
    await loadMessages()
  }
}

async function loadMessages() {
  if (type.value === 'channel') {
    await chatStore.loadMessages(projectId.value, activeId.value)
  } else {
    await chatStore.loadMessages(projectId.value, undefined, activeId.value)
  }
  scrollToBottom()
}

function selectChannel(id: string) {
  router.push({ name: 'project-chat', params: { projectId: projectId.value, type: 'channel', id } })
}

function selectDM(userId: string) {
  router.push({ name: 'project-chat', params: { projectId: projectId.value, type: 'dm', id: userId } })
}

async function handleSendMessage() {
  if (!newMessage.value.trim() || !activeId.value) return
  
  const payload: any = {
    projectId: projectId.value,
    content: newMessage.value.trim()
  }
  
  if (type.value === 'channel') {
    payload.channelId = activeId.value
  } else {
    payload.recipientId = activeId.value
  }
  
  await chatStore.sendMessage(payload)
  newMessage.value = ''
  scrollToBottom()
}

async function handleCreateChannel() {
  if (!newChannelName.value.trim()) return
  const channel = await chatStore.createChannel(projectId.value, newChannelName.value.trim(), newChannelPrivate.value)
  newChannelName.value = ''
  newChannelPrivate.value = false
  selectChannel(channel.id)
}

function scrollToBottom() {
  nextTick(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight
    }
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

onMounted(loadData)

watch([type, activeId], () => {
  if (activeId.value) {
    loadMessages()
  }
})

// Авто-обновление сообщений (простое лонг-поллинг эмуляция)
let pollInterval: any = null
onMounted(() => {
  pollInterval = setInterval(() => {
    if (activeId.value) {
      loadMessages()
    }
  }, 5000)
})
import { onUnmounted } from 'vue'
onUnmounted(() => clearInterval(pollInterval))
</script>

<style scoped>
.chat-page {
  display: flex;
  height: calc(100vh - 72px);
  background: var(--bg-primary);
}

.chat-sidebar {
  width: 260px;
  border-right: 1px solid var(--border-color, #dcdcdc);
  background: #f7f7f7;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px 10px;
}

.sidebar-header h3 {
  font-size: 0.8rem;
  text-transform: uppercase;
  color: #777;
  margin: 0;
  font-weight: 700;
}

.channel-list, .dm-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.channel-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  color: #444;
  cursor: pointer;
}

.channel-item:hover {
  background: #eee;
}

.channel-item.active {
  background: #202020;
  color: white;
}

.channel-item svg {
  width: 18px;
  height: 18px;
  opacity: 0.7;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.chat-header {
  padding: 16px 24px;
  border-bottom: 1px solid #eee;
}

.chat-header h2 {
  margin: 0;
  font-size: 1.2rem;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  flex-direction: column;
  max-width: 70%;
  align-self: flex-start;
}

.message-item.my-message {
  align-self: flex-end;
}

.message-sender {
  font-size: 0.8rem;
  font-weight: 700;
  margin-bottom: 4px;
  color: #555;
}

.my-message .message-sender {
  text-align: right;
}

.message-bubble {
  background: #f1f1f1;
  padding: 10px 14px;
  border-radius: 12px;
  position: relative;
}

.my-message .message-bubble {
  background: #202020;
  color: white;
}

.message-time {
  font-size: 0.7rem;
  opacity: 0.6;
  text-align: right;
  margin-top: 4px;
}

.chat-input {
  padding: 20px 24px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.chat-input textarea {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  resize: none;
  height: 44px;
  font-family: inherit;
}

.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #999;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  opacity: 0.3;
}
</style>
