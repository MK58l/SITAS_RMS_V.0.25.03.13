// This interface is no longer needed with Chatbase integration
export interface ChatbotMessage {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
  }