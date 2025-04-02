import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  IconButton, 
  Divider,
  Tooltip,
  Paper,
  useTheme,
  Button
} from '@mui/material';
import {
  NotificationsActive as NotificationsActiveIcon,
  BarChart as BarChartIcon,
  CalendarToday as CalendarTodayIcon,
  Lightbulb as LightbulbIcon,
  Insights as InsightsIcon,
  Update as UpdateIcon,
  Delete as DeleteIcon,
  Check as CheckIcon
} from '@mui/icons-material';

import { Notification, NotificationType } from '../../types';
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../../services/notifications';

interface NotificationsListProps {
  notifications: Notification[];
  userId: string;
  onClose: () => void;
  refreshNotifications: () => void;
}

const NotificationsList: React.FC<NotificationsListProps> = ({ notifications, userId, onClose, refreshNotifications }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Format date function
  const formatDate = (dateString: any): string => {
    try {
      let date: Date;
      
      if (dateString && typeof dateString === 'object' && dateString.toDate && typeof dateString.toDate === 'function') {
        // Firebase Timestamp
        date = dateString.toDate();
      } else if (dateString instanceof Date) {
        // Date object
        date = dateString;
      } else if (typeof dateString === 'string') {
        // String date
        date = new Date(dateString);
      } else {
        return 'Nieznana data';
      }
      
      // Format to local date and time
      return date.toLocaleString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Błąd formatowania daty:', error);
      return 'Nieznana data';
    }
  };
  
  // Handle notification click (mark as read and navigate if link is provided)
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(userId, notification.id);
    }
    
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
    
    refreshNotifications();
  };
  
  // Handle delete notification
  const handleDeleteNotification = async (e: React.MouseEvent<HTMLButtonElement>, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(userId, notificationId);
    refreshNotifications();
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(userId);
    refreshNotifications();
  };
  
  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.BUDGET_ALERT:
        return <BarChartIcon color="primary" />;
      case NotificationType.PAYMENT_REMINDER:
        return <CalendarTodayIcon color="error" />;
      case NotificationType.TIP:
        return <LightbulbIcon sx={{ color: theme.palette.warning.main }} />;
      case NotificationType.TREND:
        return <InsightsIcon color="info" />;
      case NotificationType.UPDATE:
        return <UpdateIcon color="secondary" />;
      default:
        return <NotificationsActiveIcon color="primary" />;
    }
  };
  
  // Get color based on notification type
  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.BUDGET_ALERT:
        return theme.palette.primary.main;
      case NotificationType.PAYMENT_REMINDER:
        return theme.palette.error.main;
      case NotificationType.TIP:
        return theme.palette.warning.main;
      case NotificationType.TREND:
        return theme.palette.info.main;
      case NotificationType.UPDATE:
        return theme.palette.secondary.main;
      default:
        return theme.palette.primary.main;
    }
  };
  
  return (
    <Paper 
      elevation={4} 
      sx={{ 
        width: '100%', 
        maxWidth: 360, 
        maxHeight: 500, 
        overflow: 'auto' 
      }}
      className="glass-card"
    >
      <Box sx={{ p: 2, bgcolor: 'background.paper', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          Powiadomienia
        </Typography>
        <Button 
          variant="text" 
          size="small" 
          startIcon={<CheckIcon />} 
          onClick={handleMarkAllAsRead}
          disabled={!notifications.some(n => !n.isRead)}
        >
          Oznacz wszystkie
        </Button>
      </Box>
      <Divider />
      {notifications.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <NotificationsActiveIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography color="textSecondary">
            Brak powiadomień
          </Typography>
        </Box>
      ) : (
        <List sx={{ width: '100%', pt: 0 }}>
          {notifications.map((notification) => (
            <React.Fragment key={notification.id}>
              <ListItem 
                alignItems="flex-start" 
                sx={{ 
                  cursor: 'pointer',
                  py: 1.5,
                  bgcolor: notification.isRead ? 'transparent' : `${getNotificationColor(notification.type)}10`,
                  '&:hover': {
                    bgcolor: `${getNotificationColor(notification.type)}15`,
                  }
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <Box sx={{ mr: 2, mt: 1 }}>
                  {getNotificationIcon(notification.type)}
                </Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" component="div" fontWeight={notification.isRead ? 400 : 600}>
                        {notification.title}
                      </Typography>
                      <Tooltip title="Usuń">
                        <IconButton 
                          edge="end" 
                          aria-label="delete" 
                          size="small"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            deleteNotification(userId, notification.id)
                              .then(() => refreshNotifications());
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="body2"
                        color="textPrimary"
                        component="span"
                        sx={{ display: 'block', mb: 0.5, fontWeight: notification.isRead ? 400 : 500 }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        component="span"
                      >
                        {formatDate(notification.createdAt)}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default NotificationsList; 