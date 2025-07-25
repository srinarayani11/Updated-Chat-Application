// Chat.tsx
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import { fetchMessages, sendMessage } from '../api/messageApi';
import { useAuth } from '../context/AuthContext';
import ContactList from '../components/ContactList';
import Pusher from 'pusher-js';
import './Chat.css';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { markMessagesAsSeen, markMessageAsDelivered } from '../api/messageApi';
import axios from '../api/axios';
import VirtualKeyboard from '../components/VirtualKeyboard';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface Message {
  id: number;
  content: string;
  sender_id: number;
  receiver_id: number;
  message_type?: string;
  is_read?: boolean;
  created_at?: string;
  updated_at?: string;
  delivered_at?: string | null;
  seen_at?: string | null;
}

interface Contact {
  id: number;
  name: string;
  email: string;
  profile_picture?: string;
  is_online?: boolean;
}

const Chat = () => {
  const { user, token } = useAuth();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [editMessageId, setEditMessageId] = useState<number | null>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleKeyboardInput = (value: string) => {
    setInputValue(value);
    if (messageInputRef.current) {
      messageInputRef.current.value = value;
    }
  };

  const loadMessages = async (contactId: number) => {
    try {
      const res = await fetchMessages(contactId);
      setMessages(res.data.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleContactSelect = async (contact: Contact) => {
    setSelectedContact(contact);
    await loadMessages(contact.id);
    await markMessagesAsSeen(contact.id);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.sender_id === contact.id && !msg.seen_at
          ? { ...msg, seen_at: new Date().toISOString() }
          : msg
      )
    );
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const content = messageInputRef.current?.value?.trim();
    if (!content || !selectedContact) return;

    if (editMessageId !== null) {
      try {
        await axios.put(`/messages/${editMessageId}`, { content });
        setMessages((prev) =>
          prev.map((msg) => (msg.id === editMessageId ? { ...msg, content } : msg))
        );
        setEditMessageId(null);
        if (messageInputRef.current) messageInputRef.current.value = '';
        setInputValue('');
      } catch (err) {
        console.error('Error editing message:', err);
      }
      return;
    }

    try {
      const res = await sendMessage({
        content,
        receiver_id: selectedContact.id,
      });
      setMessages((prev) => [...prev, res.data]);
      if (messageInputRef.current) messageInputRef.current.value = '';
      setInputValue('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleTyping = async () => {
    if (!selectedContact) return;
    try {
      await fetch('http://localhost:8000/api/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiver_id: selectedContact.id }),
      });
    } catch (error) {
      console.error('Typing event error:', error);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    try {
      await axios.delete(`/messages/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleEditMessage = (msg: Message) => {
    if (messageInputRef.current) {
      messageInputRef.current.value = msg.content;
      messageInputRef.current.focus();
      setInputValue(msg.content);
      setEditMessageId(msg.id);
    }
  };

  const updateMessageStatus = (id: number, fields: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...fields } : msg))
    );
  };

  useEffect(() => {
    if (!user?.id || !token) return;

    const pusher = new Pusher('ce7a372605600e598e49', {
      cluster: 'mt1',
      authEndpoint: 'http://localhost:8000/broadcasting/auth',
      auth: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    const channel = pusher.subscribe(`private-chat.${user.id}`);

    channel.bind('message.sent', async (data: any) => {
      const message = data.message;
      if (
        selectedContact &&
        (message.sender_id === selectedContact.id || message.receiver_id === selectedContact.id)
      ) {
        await markMessageAsDelivered(message.id);
        updateMessageStatus(message.id, { delivered_at: new Date().toISOString() });
        setMessages((prev) => [...prev, message]);
      }
    });

    channel.bind('message.seen', (data: any) => {
      updateMessageStatus(data.message_id, { seen_at: data.seen_at });
    });

    channel.bind('user.typing', (data: any) => {
      if (selectedContact && data.senderId === selectedContact.id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [user?.id, token, selectedContact]);

  return (
    <div className="chat-wrapper">
      <div className="d-flex chat-container" style={{ height: '100vh' }}>
        <div className="contact-list">
          <ContactList onSelectContact={handleContactSelect} />
        </div>

        <div className="flex-grow-1 d-flex flex-column">
          {selectedContact && (
            <div className="chat-header d-flex align-items-center px-3 py-2">
              {selectedContact.profile_picture ? (
                <img
                  src={selectedContact.profile_picture}
                  alt={selectedContact.name}
                  className="chat-header-avatar me-2"
                />
              ) : (
                <div className="chat-header-avatar placeholder me-2">
                  {selectedContact.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="fw-bold">{selectedContact.name}</div>
                <div className="small text-muted">
                  {selectedContact.is_online ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
          )}

          <div className="chat-box-wrapper flex-grow-1">
            <div className="chat-box">
              {selectedContact ? (
                (() => {
                  const renderedMessages = [];
                  let lastDateLabel = '';

                  for (const msg of messages) {
                    const msgDate = msg.created_at ? parseISO(msg.created_at) : new Date();
                    let dateLabel = '';

                    if (isToday(msgDate)) dateLabel = 'Today';
                    else if (isYesterday(msgDate)) dateLabel = 'Yesterday';
                    else dateLabel = format(msgDate, 'MMMM d, yyyy');

                    if (dateLabel !== lastDateLabel) {
                      renderedMessages.push(
                        <div
                          key={`date-${dateLabel}`}
                          className="date-separator text-center text-muted my-2"
                        >
                          {dateLabel}
                        </div>
                      );
                      lastDateLabel = dateLabel;
                    }

                    const isSentByCurrentUser = msg.sender_id === user?.id;

                    renderedMessages.push(
                      <div
                        key={msg.id}
                        className={`message-bubble ${isSentByCurrentUser ? 'sent' : 'received'}`}
                      >
                        <div className="message-text">{msg.content}</div>
                        <div className="message-meta d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <small className="me-2">
                              {msg.created_at &&
                                new Date(msg.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                            </small>

                            {isSentByCurrentUser && (
                              <div className="message-status">
                                {msg.seen_at ? (
                                  <span title="Seen" style={{ color: '#007bff' }}>✔✔</span>
                                ) : msg.delivered_at ? (
                                  <span title="Delivered" style={{ color: 'gray' }}>✔✔</span>
                                ) : (
                                  <span title="Sent" style={{ color: 'gray' }}>✔</span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="message-actions ms-auto">
                            {isSentByCurrentUser && (
                              <button title="Edit" onClick={() => handleEditMessage(msg)}>✏️</button>
                            )}
                            <button title="Delete" onClick={() => handleDeleteMessage(msg.id)}>🗑️</button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return renderedMessages;
                })()
              ) : (
                <div className="text-center text-muted mt-4">
                  Select a contact to start chatting
                </div>
              )}

              {isTyping && (
                <div className="text-muted mb-2">{selectedContact?.name} is typing...</div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleSend} className="d-flex p-3 align-items-start">
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="btns btn-light me-2"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                ☺
              </button>
              {showEmojiPicker && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    zIndex: 999,
                    transform: 'translateY(-10px)',
                  }}
                >
                  <Picker
                    data={data}
                    onEmojiSelect={(emoji: any) => {
                      const emojiChar = emoji.native;
                      const newValue = (messageInputRef.current?.value || '') + emojiChar;
                      setInputValue(newValue);
                      if (messageInputRef.current) {
                        messageInputRef.current.value = newValue;
                      }
                    }}
                  />
                </div>
              )}
            </div>

            <input
              type="text"
              className="form-control me-2"
              id="message"
              name="message"
              placeholder={editMessageId ? 'Edit message...' : 'Type your message...'}
              ref={messageInputRef}
              onChange={handleTyping}
              disabled={!selectedContact}
              defaultValue={inputValue}
            />

            <button
              type="button"
              className={`btn ${showKeyboard ? 'btn-danger' : 'btn-secondary'} btn-sm`}
              onClick={() => setShowKeyboard(prev => !prev)}
            >
              {showKeyboard ? 'Hide KB' : 'Show KB'}
            </button>

            <button type="submit" className="btn btn-primary" disabled={!selectedContact}>
              {editMessageId ? 'Update' : 'Send'}
            </button>
          </form>

          <div className="px-3 pb-3">
            {showKeyboard && <VirtualKeyboard onChange={handleKeyboardInput} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
