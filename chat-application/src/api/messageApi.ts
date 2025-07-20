// src/api/messageApi.ts
import api from './axios';

export const fetchMessages = (receiverId: number) => {
  return api.get(`/messages/${receiverId}`);
};

export const sendMessage = (data: FormData | object) => {
  return api.post('/messages', data);
};
