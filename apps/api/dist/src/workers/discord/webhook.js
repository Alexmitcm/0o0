"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveWebhook = void 0;
const postContent = (payload) => {
    const postUrl = payload.slug ? `https://hey.xyz/posts/${payload.slug}` : "";
    const type = payload.type ?? "post";
    return { content: `New ${type} on Hey ${postUrl}`.trim() };
};
const likeContent = (payload) => {
    const postUrl = payload.slug ? `https://hey.xyz/posts/${payload.slug}` : "";
    return { content: `New like on Hey ${postUrl}`.trim() };
};
const collectContent = (payload) => {
    const postUrl = payload.slug ? `https://hey.xyz/posts/${payload.slug}` : "";
    return { content: `New collect on Hey ${postUrl}`.trim() };
};
const resolveWebhook = (item) => {
    if (item.kind === "post") {
        return {
            body: postContent(item.payload),
            webhookUrl: process.env.EVENTS_DISCORD_WEBHOOK_URL
        };
    }
    if (item.kind === "collect") {
        return {
            body: collectContent(item.payload),
            webhookUrl: process.env.COLLECTS_DISCORD_WEBHOOK_URL
        };
    }
    if (item.kind === "like") {
        return {
            body: likeContent(item.payload),
            webhookUrl: process.env.LIKES_DISCORD_WEBHOOK_URL
        };
    }
    return { body: {}, webhookUrl: undefined };
};
exports.resolveWebhook = resolveWebhook;
