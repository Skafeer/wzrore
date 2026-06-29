"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
exports.sendNotificationToAll = sendNotificationToAll;
async function sendExpoPush(messages) {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(messages),
    });
    const data = await response.json();
    const results = Array.isArray(data.data) ? data.data : [data.data];
    return results.filter((r) => r?.status === 'ok').length;
}
async function sendNotification(token, title, body, data) {
    try {
        const count = await sendExpoPush([{
                to: token,
                title,
                body,
                data: data ?? {},
                sound: 'default',
                priority: 'high',
            }]);
        return count > 0;
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
    // Expo تسمح بـ 100 رسالة في كل طلب
    for (let i = 0; i < tokens.length; i += 100) {
        chunks.push(tokens.slice(i, i + 100));
    }
    for (const chunk of chunks) {
        const messages = chunk.map(token => ({
            to: token,
            title,
            body,
            data: data ?? {},
            sound: 'default',
            priority: 'high',
        }));
        try {
            const count = await sendExpoPush(messages);
            successCount += count;
        }
        catch {
            // تجاهل chunk الفاشل
        }
    }
    return successCount;
}
//# sourceMappingURL=push.js.map