// src/components/Chat/ChatRoom.jsx - WITH AUTO MARK AS READ
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, Timestamp, writeBatch, doc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { FaTimes, FaPaperPlane, FaComments } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ChatRoom = ({ flatId, otherUser, onClose }) => {
  const { currentUser, userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const markedAsReadRef = useRef(false);

  useEffect(() => {
    if (!flatId) return;

    // SIMPLIFIED QUERY - Just filter by flatId
    const messagesQuery = query(
      collection(db, 'messages'),
      where('flatId', '==', flatId)
    );

    const unsubscribe = onSnapshot(
      messagesQuery, 
      (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort in JavaScript instead of Firestore
        messagesData.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeA - timeB;
        });
        
        setMessages(messagesData);
        setLoading(false);
        
        // Mark messages as read when chat opens
        if (!markedAsReadRef.current) {
          markMessagesAsRead();
          markedAsReadRef.current = true;
        }
        
        setTimeout(() => scrollToBottom(), 100);
      },
      (error) => {
        console.error('Error fetching messages:', error);
        setLoading(false);
        toast.error('Failed to load messages');
      }
    );

    return () => unsubscribe();
  }, [flatId]);

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
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'messages'), {
        flatId,
        senderId: currentUser.uid,
        senderName: userProfile.name,
        senderRole: userProfile.role,
        message: newMessage.trim(),
        createdAt: Timestamp.now(),
        read: false
      });

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl h-[600px] flex flex-col shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <FaComments className="text-xl" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{otherUser?.name || 'Chat'}</h3>
              <p className="text-sm text-blue-100">
                {userProfile?.role === 'owner' ? 'Tenant' : 'Property Owner'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FaComments className="text-5xl mb-3" />
              <p className="text-lg">No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMyMessage = msg.senderId === currentUser.uid;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isMyMessage ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isMyMessage
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {!isMyMessage && (
                        <p className="text-xs font-semibold mb-1 text-blue-600">
                          {msg.senderName}
                        </p>
                      )}
                      <p className="break-words">{msg.message}</p>
                    </div>
                    <p
                      className={`text-xs text-gray-500 mt-1 px-2 ${
                        isMyMessage ? 'text-right' : 'text-left'
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t bg-white rounded-b-2xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FaPaperPlane />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
