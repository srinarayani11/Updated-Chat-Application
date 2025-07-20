// src/components/ContactList.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchContacts } from '../api/contactApi';

interface Contact {
  id: number;
  name: string;
  profile_picture?: string;
  is_online?: boolean;
  last_seen?: string;
}

const ContactList = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const res = await fetchContacts();
        setContacts(res.data);
      } catch (err) {
        console.error('Error fetching contacts:', err);
      }
    };

    loadContacts();
  }, []);

  const handleClick = (id: number) => {
    navigate('/chat', { state: { receiverId: id } });
  };

  return (
    <div className="p-3 border-end bg-white" style={{ width: '250px' }}>
      <h5>Contacts</h5>
      {contacts.map((contact) => (
        <div
          key={contact.id}
          onClick={() => handleClick(contact.id)}
          className="d-flex align-items-center gap-2 py-2 px-2 mb-2 border rounded cursor-pointer bg-light"
          style={{ cursor: 'pointer' }}
        >
          <img
            src={contact.profile_picture || '/default-profile.png'}
            alt={contact.name}
            className="rounded-circle"
            width={40}
            height={40}
          />
          <div>
            <div>{contact.name}</div>
            <small className={`text-${contact.is_online ? 'success' : 'secondary'}`}>
              {contact.is_online
                ? 'Online'
                : contact.last_seen
                ? `Last seen ${new Date(contact.last_seen).toLocaleString()}`
                : 'Offline'}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContactList;
