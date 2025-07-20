// Notification utilities for timer alerts

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function showTimerNotification(message: string = 'Rest timer finished! Time to get back to your workout.') {
  if (Notification.permission === 'granted') {
    const notification = new Notification('Gainz Tracker - Timer Complete', {
      body: message,
      icon: '/icon-192.png', // PWA icon
      badge: '/icon-192.png',
      tag: 'timer-complete', // Replace previous notifications
      requireInteraction: true, // Stay visible until user interacts
    });

    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);

    return notification;
  }
  return null;
}

export function vibratePhone(pattern: number[] = [500, 200, 500, 200, 500]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
    return true;
  }
  return false;
}