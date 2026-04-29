import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
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
  conversations = signal<Conversation[]>([]);
  activeConversation = signal<Conversation | null>(null);
  loading = signal(true);

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private router: Router,
  ) {
    // effect must be created in constructor (injection context)
    effect(() => {
      const _ = this.chatService.refresh();
      this.loadConversations();
    });
  }

  async ngOnInit() {
    await this.authService.loadUser();
    await this.loadConversations();
    this.loading.set(false);
  }

  async loadConversations() {
    try {
      const data = await this.chatService.getConversations();
      this.conversations.set(data ?? []);
    } catch {
      this.conversations.set([]);
    }
  }

  selectConversation(convo: Conversation) {
    this.chatService.disconnect();
    this.chatService.clearHandlers();
    this.activeConversation.set(convo);
  }

  getOtherName(convo: Conversation): string {
    const user = this.authService.currentUser();
    if (!user) return '';
    return user.id === convo.seller_id ? convo.buyer_name : convo.seller_name;
  }

  goBack() {
    this.router.navigate(['/main']);
  }
}