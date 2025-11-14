import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api, { notificationAPI } from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated() && user?.id) {
      const newSocket = io('http://localhost:4000');
      
      newSocket.on('connect', () => {
        console.log('🔌 Connected to notification server');
        console.log('👤 Joining with user ID:', user.id);
        newSocket.emit('join', user.id);
      });

      newSocket.on('newNotification', (notification) => {
        console.log('📢 New notification received:', notification);
        console.log('📢 Current notifications count:', notifications.length);
        setNotifications(prev => {
          console.log('📢 Adding notification to list, prev count:', prev.length);
          return [notification, ...prev];
        });
        setUnreadCount(prev => {
          console.log('📢 Updating unread count from', prev, 'to', prev + 1);
          return prev + 1;
        });
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico'
          });
        }
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Disconnected from notification server');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user, isAuthenticated]);

  // Fetch initial notifications
  useEffect(() => {
    if (isAuthenticated() && user?.id) {
      fetchNotifications();
    }
  }, [user, isAuthenticated]);

  // Request notification permission
  useEffect(() => {
    if (isAuthenticated() && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [isAuthenticated]);

  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications(page, 20, false);
      
      if (response.data.success) {
        if (page === 1) {
          setNotifications(response.data.notifications);
        } else {
          setNotifications(prev => [...prev, ...response.data.notifications]);
        }
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
