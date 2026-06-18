import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

let app: App;

if (!getApps().length) {
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  });
} else {
  app = getApps()[0];
}

export async function sendNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  try {
    await getMessaging(app).send({
      token,
      notification: { title, body },
      data: data ?? {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'sawab_notifications',
          icon: 'ic_notification',
          color: '#1D4ED8',
        },
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function sendNotificationToAll(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<number> {
  if (tokens.length === 0) return 0;

  let successCount = 0;
  const chunks: string[][] = [];

  for (let i = 0; i < tokens.length; i += 500) {
    chunks.push(tokens.slice(i, i + 500));
  }

  for (const chunk of chunks) {
    const response = await getMessaging(app).sendEachForMulticast({
      tokens: chunk,
      notification: { title, body },
      data: data ?? {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'sawab_notifications',
          icon: 'ic_notification',
          color: '#1D4ED8',
        },
      },
    });
    successCount += response.successCount;
  }

  return successCount;
}