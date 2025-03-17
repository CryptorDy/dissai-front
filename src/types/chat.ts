export interface ChatMessage {
  id: string;
  content: string;
  sender: ChatParticipant;
  timestamp: Date;
}

export interface ChatParticipant {
  id: string;
  name: string;
  role: string;
  isOnline: boolean;
}
