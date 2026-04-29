import { Component, OnInit, effect, ElementRef, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { ChatWidgetService } from '../../services/chat-widget.service';
import { ChatService, Conversation } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { ChatPanel } from '../chat-panel/chat-panel';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, ChatPanel],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.css',
})
export class ChatWidget implements OnInit {
  conversations = signal<Conversation[]>([]);
  loading = signal(false);

  constructor(
    public widget: ChatWidgetService,
    private chatService: ChatService,
    private authService: AuthService,
    private router: Router,
    private el: ElementRef,
  ) {
    effect(() => {
      const _ = this.chatService.refresh();
      this.loadConversations();
      
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.widget.state() !== 'closed' && !this.el.nativeElement.contains(event.target)) {
      this.widget.close();
    }
  }

  async ngOnInit() {}

  async toggle() {
    this.widget.toggle();
    if (this.widget.state() === 'list') {
      await this.loadConversations();
    }
  }

  async loadConversations() {
    if (!this.authService.currentUser()) return;
    this.loading.set(true);
    try {
      const data = await this.chatService.getConversations();
      this.conversations.set(data ?? []);
    } catch {
      this.conversations.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  selectConversation(convo: Conversation) {
    this.widget.openChat(convo);
  }

  backToList() {
    this.chatService.disconnect();
    this.chatService.clearHandlers();
    this.widget.backToList();
    this.loadConversations();
  }

  get isAuthPage(): boolean {
    const url = this.router.url;
    return url === '/login' || url === '/sign-up' || url === '/';
  }

  getOtherName(convo: Conversation): string {
    const user = this.authService.currentUser();
    if (!user) return '';
    return user.id === convo.seller_id ? convo.buyer_name : convo.seller_name;
  }
}