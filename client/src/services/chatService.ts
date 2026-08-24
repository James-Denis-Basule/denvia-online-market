import api from './api';

export type Message = {
  _id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
};

export async function getMessages(limit = 50) {
  const token = localStorage.getItem('accessToken');
  if (!token) return [];

  const response = await api.get(`/marketplace/chat/messages?limit=${limit}`, { headers: { Authorization: `Bearer ${token}` } });
  return response.data?.data ?? [];
}

export async function postMessage(content: string) {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  const response = await api.post('/marketplace/chat/messages', { content }, { headers: { Authorization: `Bearer ${token}` } });
  return response.data?.data ?? null;
}
