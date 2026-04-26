import { Injectable } from '@angular/core';

export interface Conversation {
  id: string;
  listing_id: string;
  listing_title: string;
  buyer_id: string;
  buyer_name: string;
  seller_id: string;
  seller_name: string;
  last_message: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: WebSocket | null = null;
  private messageHandlers: ((msg: Message) => void)[] = [];

  async startConversation(listingId: string, sellerId: string): Promise<Conversation> {
    console.log('Sending body:', { listing_id: listingId, seller_id: sellerId });
    const res = await fetch('/api/conversations', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId, seller_id: sellerId }),
    });
    if (!res.ok) throw new Error('Failed to start conversation');
    return res.json();
  }

  async getConversations(): Promise<Conversation[]> {
    const res = await fetch('/api/conversations', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  }

  connect(conversationId: string): void {
    this.disconnect();
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = 'localhost:8080';
    const url = `${protocol}://${host}/api/ws/chat/${conversationId}`;
    this.socket = new WebSocket(url);
    this.socket.onmessage = (event) => {
      try {
        const msg: Message = JSON.parse(event.data);
        this.messageHandlers.forEach(handler => handler(msg));
      } catch {
        console.error('Failed to parse incoming message', event.data);
      }
    };
    this.socket.onerror = (err) => console.error('WebSocket error', err);
    this.socket.onclose = () => console.log('WebSocket closed');
  }

  sendMessage(content: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(content);
    } else {
      console.warn('WebSocket not open');
    }
  }

  onMessage(handler: (msg: Message) => void): void {
    this.messageHandlers.push(handler);
  }

  clearHandlers(): void {
    this.messageHandlers = [];
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}