import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { ChatService, Conversation } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { ChatPanel } from '../../components/chat-panel/chat-panel';
import { AvatarDropdown } from '../../components/avatar-dropdown/avatar-dropdown';

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, ChatPanel, AvatarDropdown],
  templateUrl: './messages-page.html',
  styleUrl: './messages-page.css',
})
export class MessagesPage implements OnInit {
  conversations: Conversation[] = [];
  activeConversation: Conversation | null = null;
  loading = true;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
  ) {}

  async ngOnInit() {
    await this.authService.loadUser();
    try {
      this.conversations = await this.chatService.getConversations();
    } catch {
      this.conversations = [];
    } finally {
      this.loading = false;
    }
  }

  selectConversation(convo: Conversation) {
    this.chatService.disconnect();
    this.chatService.clearHandlers();
    this.activeConversation = convo;
  }

  getOtherName(convo: Conversation): string {
    const user = this.authService.currentUser();
    if (!user) return '';
    return user.id === convo.seller_id ? convo.buyer_name : convo.seller_name;
  }
}