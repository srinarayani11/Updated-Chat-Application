// src/pages/Chat.tsx
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react'; 
import { useLocation } from 'react-router-dom';
import { fetchMessages, sendMessage } from '../api/messageApi';
import { useAuth } from '../context/AuthContext';
import ContactList from '../components/ContactList';

interface Message {
  id: number;
  content: string;
  sender_id: number;
  receiver_id: number;
  message_type?: string;
  is_read?: boolean;
  created_at?: string;
  updated_at?: string;
  sender?: {
    id: number;
    name: string;
    email: string;
    profile_picture?: string;
    is_online?: boolean;
  };
}

const Chat = () => {
  const { user } = useAuth();
  const location = useLocation();
  const receiverId = location.state?.receiverId;

  const [messages, setMessages] = useState<Message[]>([]); // ✅ Define message type
  const messageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      if (!receiverId) return;
      const res = await fetchMessages(receiverId);
      setMessages(res.data);
    };
    loadMessages();
  }, [receiverId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const content = messageInputRef.current?.value?.trim();
    if (!content || !receiverId) return;

    const newMessage = {
      content,
      receiver_id: receiverId,
    };

    try {
      const res = await sendMessage(newMessage);
      setMessages((prev: Message[]) => [...prev, res.data]); // ✅ Type-safe state update
      if (messageInputRef.current) messageInputRef.current.value = '';
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!receiverId) {
    return <div className="text-center mt-4">No contact selected</div>;
  }

return (
  <div className="d-flex" style={{ height: '100vh' }}>
    {/* Left Sidebar: Contact List */}
    <ContactList />

    {/* Center Chat Section */}
    <div className="flex-grow-1 d-flex flex-column">
      {/* Chat Messages */}
      <div className="chat-box flex-grow-1 p-3 overflow-auto bg-light">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message mb-2 p-2 rounded ${
              msg.sender_id === user?.id
                ? 'bg-success text-white ms-auto'
                : 'bg-white text-dark me-auto'
            }`}
            style={{ maxWidth: '60%' }}
          >
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="d-flex border-top p-3">
        <input
          type="text"
          className="form-control me-2"
          placeholder="Type your message..."
          ref={messageInputRef}
        />
        <button type="submit" className="btn btn-primary">
          Send
        </button>
      </form>
    </div>
  </div>
);
};

export default Chat;
