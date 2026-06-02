import { useEffect, useCallback } from 'react';

interface UseReminderOptions {
  enabled: boolean;
  frequency: 'weekly' | 'monthly';
  time: string;
}

export function useReminder({ enabled, frequency, time }: UseReminderOptions) {
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return { granted: false, reason: 'browser_not_supported' };
    }

    if (Notification.permission === 'granted') {
      return { granted: true };
    }

    if (Notification.permission === 'denied') {
      return { granted: false, reason: 'denied' };
    }

    const permission = await Notification.requestPermission();
    return { granted: permission === 'granted' };
  }, []);

  const showNotification = useCallback((title: string, body: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    new Notification(title, {
      body,
      icon: '/favicon.svg',
      tag: 'bee-accounting-reminder',
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const checkAndNotify = () => {
      const lastReminder = localStorage.getItem('bee_accounting_last_reminder');
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const [hours, minutes] = time.split(':').map(Number);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      if (lastReminder === today) return;
      
      if (currentHour < hours || (currentHour === hours && currentMinute < minutes)) {
        return;
      }

      let shouldNotify = false;
      
      if (frequency === 'weekly') {
        const dayOfWeek = now.getDay();
        if (dayOfWeek === 1) {
          shouldNotify = true;
        }
      } else if (frequency === 'monthly') {
        const dayOfMonth = now.getDate();
        if (dayOfMonth === 1) {
          shouldNotify = true;
        }
      }

      if (shouldNotify) {
        requestPermission().then((result) => {
          if (result.granted) {
            showNotification(
              '蜜蜂记账提醒',
              frequency === 'weekly' 
                ? '新的一周开始了，记得记录本周的消费哦！'
                : '新的月份开始了，记得记录本月的消费哦！'
            );
            localStorage.setItem('bee_accounting_last_reminder', today);
          }
        });
      }
    };

    checkAndNotify();

    const interval = setInterval(checkAndNotify, 60 * 1000);

    return () => clearInterval(interval);
  }, [enabled, frequency, time, requestPermission, showNotification]);

  return {
    requestPermission,
    showNotification,
    isSupported: 'Notification' in window,
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  };
}
