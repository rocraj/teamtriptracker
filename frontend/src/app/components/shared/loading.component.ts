import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading',
  template: `
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin text-4xl">⟳</div>
    </div>
  `
})
export class LoadingComponent {
  @Input() message: string = 'Loading...';
}
