// src/api/contactApi.ts
import api from './axios';

export const fetchContacts = () => {
  return api.get('/contacts');
};
