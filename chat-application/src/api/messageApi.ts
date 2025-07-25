// src/api/messageApi.ts
import api from './axios';

// ✅ Fetch messages for a conversation with a specific contact
export const fetchMessages = (receiverId: number) => {
  return api.get(`/messages/conversation/${receiverId}`);
};

// ✅ Send a message (text or media)
export const sendMessage = (data: FormData | object) => {
  return api.post('/messages', data);
};

// ✅ Get contacts list (excluding current user)
export const fetchContacts = () => {
  return api.get('/contacts');
};
export const markMessagesAsSeen = (senderId: number) => {
  return api.post(`/messages/${senderId}/seen`);
};

export const markMessageAsDelivered = (messageId: number) => {
  return api.post('/messages/delivered', { message_id: messageId });
};