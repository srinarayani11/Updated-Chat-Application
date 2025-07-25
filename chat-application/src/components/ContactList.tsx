import { useEffect, useState } from 'react';
import { fetchContacts } from '../api/messageApi';
import { useAuth } from '../context/AuthContext';
import './ContactList.css';

interface Contact {
  id: number;
  name: string;
  email: string;
  profile_picture?: string;
  is_online?: boolean;
  last_message?: string;
}

interface Props {
  onSelectContact: (contact: Contact) => void;
}

const ContactList = ({ onSelectContact }: Props) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const res = await fetchContacts();
        const filtered = res.data.filter((c: Contact) => c.id !== user?.id);
        setContacts(filtered);
        setFilteredContacts(filtered);
      } catch (err) {
        console.error('Error fetching contacts:', err);
      }
    };
    loadContacts();
  }, [user]);

  const handleSelect = (contact: Contact) => {
    setSelectedId(contact.id);
    onSelectContact(contact);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = contacts.filter(contact =>
      contact.name.toLowerCase().includes(query)
    );
    setFilteredContacts(filtered);
  };

  return (
    <div className="contact-list-container">
      <input
        type="text"
        id="contact-search"
        name="contact-search"
        className="search-bar"
        placeholder="Search"
        value={searchQuery}
        onChange={handleSearch}
      />

      <div className="contacts-wrapper">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className={`contact-card ${selectedId === contact.id ? 'selected' : ''}`}
            onClick={() => handleSelect(contact)}
          >
            {contact.profile_picture ? (
              <img
                src={contact.profile_picture}
                alt={contact.name}
                className="contact-avatar"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/default-avatar.png'; // fallback image
                }}
              />
            ) : (
              <div className="contact-avatar placeholder">
                {contact.name.charAt(0)}
              </div>
            )}

            <div className="contact-meta">
              <div className="name">{contact.name}</div>
              <div className="last-message">
                {contact.last_message || 'Start chatting...'}
              </div>
            </div>
            <div className="time">09:00</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactList;
