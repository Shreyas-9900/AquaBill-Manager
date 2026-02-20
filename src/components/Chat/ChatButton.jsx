// src/components/Chat/ChatButton.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, writeBatch, doc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { FaComments } from 'react-icons/fa';
import ChatRoom from './ChatRoom';

const ChatButton = ({ flatId, otherUser }) => {
  const { currentUser } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!flatId || !currentUser) return;

    // Subscribe to unread messages (messages from other person that you haven't read)
    const messagesQuery = query(
      collection(db, 'messages'),
      where('flatId', '==', flatId),
      where('senderId', '!=', currentUser.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [flatId, currentUser]);

  const handleOpenChat = async () => {
    setShowChat(true);
    
    // Mark all unread messages as read when opening chat
    if (unreadCount > 0) {
      await markMessagesAsRead();
    }
  };

  const markMessagesAsRead = async () => {
    try {
      // Get all unread messages from the other person
      const messagesQuery = query(
        collection(db, 'messages'),
        where('flatId', '==', flatId),
        where('senderId', '!=', currentUser.uid),
        where('read', '==', false)
      );

      const snapshot = await getDocs(messagesQuery);
      
      if (snapshot.empty) return;

      // Batch update all messages to read: true
      const batch = writeBatch(db);
      snapshot.docs.forEach((messageDoc) => {
        batch.update(doc(db, 'messages', messageDoc.id), { read: true });
      });

      await batch.commit();
      
      // Unread count will automatically update via the listener
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenChat}
        className="relative inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <FaComments />
        <span className="hidden sm:inline">Chat</span>
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showChat && (
        <ChatRoom
          flatId={flatId}
          otherUser={otherUser}
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
};

export default ChatButton;
