import api from './api';

export type Message = {
  _id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
};

export async function getMessages(limit = 50) {
  const response = await api.get(
    `/marketplace/chat/messages?limit=${limit}`,
  );

  return response.data?.data ?? [];
}

export async function postMessage(content: string) {
  const response = await api.post('/marketplace/chat/messages', { content });

  return response.data?.data ?? null;
}