"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
exports.sendNotificationToAll = sendNotificationToAll;
const app_1 = require("firebase-admin/app");
const messaging_1 = require("firebase-admin/messaging");
let app;
if (!(0, app_1.getApps)().length) {
    app = (0, app_1.initializeApp)({
        credential: (0, app_1.cert)({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
    });
}
else {
    app = (0, app_1.getApps)()[0];
}
async function sendNotification(token, title, body, data) {
    try {
        await (0, messaging_1.getMessaging)(app).send({
            token,
            notification: { title, body },
            data: data ?? {},
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'sawab_notifications',
                    color: '#1D4ED8',
                },
            },
        });
        return true;
    }
    catch {
        return false;
    }
}
async function sendNotificationToAll(tokens, title, body, data) {
    if (tokens.length === 0)
        return 0;
    let successCount = 0;
    const chunks = [];
    for (let i = 0; i < tokens.length; i += 500) {
        chunks.push(tokens.slice(i, i + 500));
    }
    for (const chunk of chunks) {
        const response = await (0, messaging_1.getMessaging)(app).sendEachForMulticast({
            tokens: chunk,
            notification: { title, body },
            data: data ?? {},
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'sawab_notifications',
                    color: '#1D4ED8',
                },
            },
        });
        successCount += response.successCount;
    }
    return successCount;
}
//# sourceMappingURL=firebase.js.map