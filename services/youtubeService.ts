
import { ChatMessage } from '../types';

let pollingInterval: any = null;
let nextPageToken: string | null = null;

export const getSubscriberCount = async (channelId: string, apiKey: string): Promise<number | null> => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.items && data.items.length > 0) {
      const count = data.items[0].statistics.subscriberCount;
      return parseInt(count, 10);
    }
  } catch (err) {
    console.error("YouTube Stats Error:", err);
  }
  return null;
};

export const connectYouTube = async (
  liveStreamId: string, 
  apiKey: string, 
  onMessage: (msg: ChatMessage) => void,
  minPollIntervalMs: number = 45000 // Default to 45s for quota safety (10k limit/day ~ 43.2s interval)
) => {
  if (pollingInterval) clearInterval(pollingInterval);

  try {
    // 1. Get Live Chat ID from the Video ID (Live Stream ID)
    const videoUrl = `https://www.googleapis.com/youtube/v3/videos?id=${liveStreamId}&key=${apiKey}&part=liveStreamingDetails`;
    const videoRes = await fetch(videoUrl);
    const videoData = await videoRes.json();

    if (!videoData.items || videoData.items.length === 0) {
      console.error("YouTube: Video not found or invalid API Key");
      return;
    }

    const liveChatId = videoData.items[0]?.liveStreamingDetails?.activeLiveChatId;
    if (!liveChatId) {
      console.error("YouTube: No active live chat found. Is the stream live?");
      return;
    }

    console.log("Connected to YouTube Chat ID:", liveChatId);

    // 2. Poll for messages and SUPER CHATS
    const pollMessages = async () => {
      let chatUrl = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${liveChatId}&part=snippet,authorDetails&key=${apiKey}&maxResults=200`;
      if (nextPageToken) {
        chatUrl += `&pageToken=${nextPageToken}`;
      }

      try {
        const chatRes = await fetch(chatUrl);
        const chatData = await chatRes.json();

        if (chatData.items) {
          chatData.items.forEach((item: any) => {
            const snippet = item.snippet;
            const author = item.authorDetails;
            
            let messageText = snippet.displayMessage;
            let isDonation = false;
            let amount = 0;
            let color = '#ff0000';

            // Detect Super Chat
            if (snippet.type === 'superChatEvent') {
               isDonation = true;
               messageText = snippet.superChatDetails.userComment || "SUPER CHAT!";
               // amountMicros is string
               amount = parseInt(snippet.superChatDetails.amountMicros) / 1000000;
               color = '#fbbf24'; // Gold
            } else if (snippet.type === 'superStickerEvent') {
               isDonation = true;
               messageText = "SUPER STICKER!";
               amount = parseInt(snippet.superStickerDetails.amountMicros) / 1000000;
               color = '#34d399'; // Green
            }

            onMessage({
              user: author.displayName,
              message: messageText,
              color: color,
              platform: 'youtube',
              isDonation,
              donationAmount: amount,
              profileUrl: author.profileImageUrl // Capture profile image
            });
          });
        }

        if (chatData.nextPageToken) {
          nextPageToken = chatData.nextPageToken;
        }

        const apiRecommended = chatData.pollingIntervalMillis || 5000;
        // Enforce the safe minimum interval to protect quota
        const nextPoll = Math.max(apiRecommended, minPollIntervalMs);
        
        if (pollingInterval) clearInterval(pollingInterval);
        pollingInterval = setTimeout(pollMessages, nextPoll);

      } catch (err) {
        console.error("YouTube Polling Error:", err);
        // Retry slower on error
        pollingInterval = setTimeout(pollMessages, 60000); 
      }
    };

    pollMessages();

  } catch (err) {
    console.error("YouTube Connection Error:", err);
  }

  return () => {
    if (pollingInterval) clearTimeout(pollingInterval);
    pollingInterval = null;
    nextPageToken = null;
  };
};
