import { defineStore } from "pinia";
import { ref } from "vue";
import { apiRequest } from "@/api/http";
import type { ProjectId } from "@/types/domain";

export type Channel = {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  is_private: boolean;
  createdBy: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  projectId: string;
  channelId?: string;
  senderId: string;
  senderName: string;
  recipientId?: string;
  content: string;
  createdAt: string;
};

export const useChatStore = defineStore("chat", () => {
  const channels = ref<Channel[]>([]);
  const messages = ref<ChatMessage[]>([]);
  const isLoading = ref(false);

  async function loadChannels(projectId: ProjectId) {
    isLoading.value = true;
    try {
      channels.value = await apiRequest<Channel[]>("/channels", {
        query: { projectId },
      });
    } finally {
      isLoading.value = false;
    }
  }

  async function loadMessages(
    projectId: ProjectId,
    channelId?: string,
    recipientId?: string,
  ) {
    isLoading.value = true;
    try {
      const query: any = { projectId };
      if (channelId) query.channelId = channelId;
      if (recipientId) query.recipientId = recipientId;

      messages.value = await apiRequest<ChatMessage[]>("/chatMessages", {
        query,
      });
    } finally {
      isLoading.value = false;
    }
  }

  async function sendMessage(payload: {
    projectId: ProjectId;
    content: string;
    channelId?: string;
    recipientId?: string;
  }) {
    const message = await apiRequest<ChatMessage>("/chatMessages", {
      method: "POST",
      body: payload,
    });
    messages.value.push(message);
    return message;
  }

  async function createChannel(
    projectId: ProjectId,
    name: string,
    isPrivate = false,
  ) {
    const channel = await apiRequest<Channel>("/channels", {
      method: "POST",
      body: { projectId, name, is_private: isPrivate },
    });
    channels.value.push(channel);
    return channel;
  }

  return {
    channels,
    messages,
    isLoading,
    loadChannels,
    loadMessages,
    sendMessage,
    createChannel,
  };
});
