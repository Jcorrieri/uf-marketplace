import { Injectable } from '@angular/core';
import { Conversation } from './chat.service';

export type WidgetState = 'closed' | 'list' | 'chat';

@Injectable({ providedIn: 'root' })
export class ChatWidgetService {
  state: WidgetState = 'closed';
  activeConversation: Conversation | null = null;

  open() {
    this.state = 'list';
  }

  openChat(conversation: Conversation) {
    this.activeConversation = conversation;
    this.state = 'chat';
  }

  backToList() {
    this.activeConversation = null;
    this.state = 'list';
  }

  close() {
    this.state = 'closed';
    this.activeConversation = null;
  }

  toggle() {
    this.state === 'closed' ? this.open() : this.close();
  }
}