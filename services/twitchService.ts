import { ChatMessage } from '../types';

let client: any = null;
let retryTimeout: any = null;

export const connectTwitch = (channel: string, onMessage: (msg: ChatMessage) => void) => {
  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }

  if (client) {
    client.disconnect().catch(() => {});
    client = null;
  }

  const attemptConnection = () => {
    // @ts-ignore
    if (typeof window.tmi === 'undefined') {
      console.log("TMI.js not loaded yet. Retrying in 500ms...");
      retryTimeout = setTimeout(attemptConnection, 500);
      return;
    }

    try {
      console.log(`Initializing Twitch client for channel: ${channel}`);
      // @ts-ignore
      client = new window.tmi.Client({
        channels: [channel],
        connection: {
          reconnect: true,
          secure: true
        }
      });

      client.connect().catch((err: any) => {
        console.error("Twitch connection failed:", err);
      });

      client.on('message', (channel: string, tags: any, message: string, self: boolean) => {
        if (self) return;

        // Detect Bits/Cheer
        const bits = tags['bits'] ? parseInt(tags['bits']) : 0;
        const isDonation = bits > 0;
        
        onMessage({
          user: tags['display-name'] || tags.username,
          message: message,
          color: tags.color || '#a855f7',
          isDonation: isDonation,
          donationAmount: isDonation ? bits / 100 : 0 // Roughly convert bits to dollars for normalization
        });
      });
      
      // Handle Subs/Resubs
      const handleSub = (channel: any, username: any, method: any, message: any, userstate: any) => {
          onMessage({
              user: username,
              message: message || "Subscribed!",
              color: '#f472b6',
              isDonation: true,
              donationAmount: 5 // Assume $5 value for logic
          });
      };

      client.on('subscription', handleSub);
      client.on('resub', handleSub);
      client.on('cheer', (channel: any, userstate: any, message: any) => {
          // Handled in message event usually, but redundant safety
      });

      client.on('connected', () => {
        console.log("Twitch connected successfully");
      });

    } catch (err) {
      console.error("Error initializing Twitch client:", err);
    }
  };

  attemptConnection();

  return () => {
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
    if (client) {
      client.disconnect().catch(() => {});
      client = null;
    }
  };
};