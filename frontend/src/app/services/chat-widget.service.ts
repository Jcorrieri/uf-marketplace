import { Injectable, signal } from '@angular/core';
import { Conversation } from './chat.service';

export type WidgetState = 'closed' | 'list' | 'chat';

@Injectable({ providedIn: 'root' })
export class ChatWidgetService {
  state = signal<WidgetState>('closed');
  activeConversation = signal<Conversation | null>(null);

  open() {
    this.state.set('list');
  }

  openChat(conversation: Conversation) {
    this.activeConversation.set(conversation);
    this.state.set('chat');
  }

  backToList() {
    this.activeConversation.set(null);
    this.state.set('list');
  }

  close() {
    this.state.set('closed');
    this.activeConversation.set(null);
  }

  toggle() {
    this.state() === 'closed' ? this.open() : this.close();
  }
}