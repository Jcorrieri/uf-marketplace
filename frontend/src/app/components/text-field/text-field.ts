import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-text-field',
  imports: [],
  templateUrl: './text-field.html',
  styleUrl: './text-field.css',
})
export class TextField {
    isSecure = input(false)
    iconName = input.required<string>()
    placeholderText = input("")
    title = input("")
    secureText = input("")

    text = model("")

    onInput(event: Event) {
        const inputElement = event.target as HTMLInputElement;
        this.text.set(inputElement.value);
    }
}
