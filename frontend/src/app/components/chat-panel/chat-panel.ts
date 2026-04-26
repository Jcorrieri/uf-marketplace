import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { ChatService, Message, Conversation } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './chat-panel.html',
  styleUrl: './chat-panel.css',
})
export class ChatPanel implements OnInit, OnDestroy {
  @Input() conversation!: Conversation;
  @ViewChild('messageList') private messageList!: ElementRef;

  messages: Message[] = [];
  newMessage = '';
  currentUserId = '';
  loading = true;   
  

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    this.currentUserId = this.authService.currentUser()?.id ?? '';

    // Load message history first
    this.messages = await this.chatService.getMessages(this.conversation.id);
    this.loading = false;
    this.cdr.detectChanges();
    setTimeout(() => this.scrollToBottom(), 0);

    // Open WebSocket and listen for new messages
    this.chatService.connect(this.conversation.id);
    this.chatService.onMessage((msg: Message) => {
      this.messages.push(msg);
      this.cdr.detectChanges();
      setTimeout(() => this.scrollToBottom(), 0);
    });
  }

  

  ngOnDestroy() {
    this.chatService.clearHandlers();
    this.chatService.disconnect();
  }

  send() {
    const content = this.newMessage.trim();
    if (!content) return;
    this.chatService.sendMessage(content);
    this.newMessage = '';
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  private scrollToBottom() {
    try {
    const el = this.messageList.nativeElement;
    el.scrollTop = el.scrollHeight;
  } catch {}
}

  isMine(msg: Message): boolean {
    return msg.sender_id === this.currentUserId;
  }

  getOtherPersonName(): string {
    const user = this.authService.currentUser();
    if (!user) return '';
    return user.id === this.conversation.seller_id
      ? this.conversation.buyer_name
      : this.conversation.seller_name;
  }
}