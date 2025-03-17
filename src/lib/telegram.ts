interface TelegramMessage {
    chatId: string;
    text: string;
    parseMode?: 'MarkdownV2' | 'HTML';
  }
  
  export class TelegramService {
    private readonly apiUrl: string;
    private readonly botToken: string;
  
    constructor() {
      this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
      this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
      
      if (!this.botToken) {
        console.warn('TELEGRAM_BOT_TOKEN is not set. Telegram notifications will not work.');
      }
    }
  
    /**
     * Send a message to a Telegram chat
     */
    async sendMessage(message: TelegramMessage): Promise<boolean> {
      if (!this.botToken) {
        console.error('Cannot send Telegram message: Bot token is not configured');
        return false;
      }
  
      try {
        const response = await fetch(`${this.apiUrl}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chat_id: message.chatId,
            text: message.text,
            parse_mode: message.parseMode || 'HTML'
          })
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Telegram API error:', errorData);
          return false;
        }
  
        return true;
      } catch (error) {
        console.error('Error sending Telegram message:', error);
        return false;
      }
    }
  
    /**
     * Get chat ID from a Telegram webhook update
     */
    getChatIdFromUpdate(update: any): string | null {
      if (update?.message?.chat?.id) {
        return update.message.chat.id.toString();
      }
      return null;
    }
  }
  