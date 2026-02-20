// src/components/Notifications/NotificationBell.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { FaBell } from 'react-icons/fa';

const NotificationBell = () => {
  const { currentUser, userProfile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!currentUser || !userProfile) return;

    // Listen for new bills (for tenants)
    if (userProfile.role === 'tenant' && userProfile.flatId) {
      const billsQuery = query(
        collection(db, 'waterReadings'),
        where('flatId', '==', userProfile.flatId),
        where('status', '==', 'pending')
      );

      const unsubscribeBills = onSnapshot(billsQuery, (snapshot) => {
        const billNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'new_bill',
          message: `New water bill for ${doc.data().billMonth}`,
          amount: doc.data().billAmount,
          createdAt: doc.data().createdAt,
          read: false
        }));
        setNotifications(prev => [...billNotifications]);
        setUnreadCount(billNotifications.length);
      });

      return () => unsubscribeBills();
    }

    // Listen for new messages
    if (userProfile.flatId) {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('flatId', '==', userProfile.flatId),
        where('senderId', '!=', currentUser.uid),
        where('read', '==', false)
      );

      const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        const messageNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'new_message',
          message: `New message from ${doc.data().senderName}`,
          content: doc.data().message,
          createdAt: doc.data().createdAt,
          read: false
        }));
        setNotifications(prev => [...prev, ...messageNotifications]);
        setUnreadCount(prev => prev + messageNotifications.length);
      });

      return () => unsubscribeMessages();
    }
  }, [currentUser, userProfile]);

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'messages', notificationId), {
        read: true
      });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <FaBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear all
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FaBell className="text-4xl mx-auto mb-2 text-gray-300" />
                <p>No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        notification.type === 'new_bill' ? 'bg-orange-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {notification.message}
                        </p>
                        {notification.amount && (
                          <p className="text-orange-600 font-semibold text-sm">
                            ₹{notification.amount.toFixed(2)}
                          </p>
                        )}
                        {notification.content && (
                          <p className="text-gray-600 text-sm truncate">
                            {notification.content}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
