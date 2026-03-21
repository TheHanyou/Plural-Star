// src/services/NotificationService.ts
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidStyle,
} from '@notifee/react-native';
import {FrontState, Member, fmtDur, fmtTime} from '../utils';

export const NOTIF_CHANNEL_ID = 'plural-space-front';
export const NOTIF_ID = 'ps-front-status';

export const setupNotificationChannel = async () => {
  await notifee.createChannel({
    id: NOTIF_CHANNEL_ID,
    name: 'Front Status',
    importance: AndroidImportance.LOW,
    visibility: AndroidVisibility.PUBLIC,
    sound: '',
  });
};

export const showFrontNotification = async (
  front: FrontState | null,
  members: Member[],
) => {
  if (!front || front.memberIds.length === 0) {
    await clearFrontNotification();
    return;
  }

  await setupNotificationChannel();

  const fronters = (front.memberIds || [])
    .map(id => members.find(m => m.id === id))
    .filter(Boolean) as Member[];

  const names = fronters.map(m => m.name).join(', ') || 'Unknown';
  const duration = fmtDur(front.startTime);

  // Title: fronter name(s) + duration
  const title = `◈ ${names}  ·  ${duration}`;

  // Body lines for bigText expansion
  const lines: string[] = [];
  if (front.mood)     lines.push(`Mood: ${front.mood}`);
  if (front.location) lines.push(`At: ${front.location}`);
  if (front.note)     lines.push(`Note: ${front.note}`);
  lines.push(`Since ${fmtTime(front.startTime)}`);

  // Collapsed summary (one line shown when notification is folded)
  const summary = [
    front.mood     ? `Mood: ${front.mood}` : null,
    front.location ? `At: ${front.location}` : null,
    `${duration}`,
  ].filter(Boolean).join('  ·  ');

  await notifee.displayNotification({
    id: NOTIF_ID,
    title,
    body: summary,
    android: {
      channelId: NOTIF_CHANNEL_ID,
      ongoing: true,
      onlyAlertOnce: true,
      autoCancel: false,
      smallIcon: 'ic_notif',
      importance: AndroidImportance.LOW,
      visibility: AndroidVisibility.PUBLIC,
      pressAction: {id: 'default'},
      color: '#DAA520',
      style: {
        type: AndroidStyle.BIGTEXT,
        text: lines.join('\n'),
      },
    },
  });
};

export const clearFrontNotification = async () => {
  await notifee.cancelNotification(NOTIF_ID);
};
