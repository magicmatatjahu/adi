import { Component, Input } from '@angular/core'

import { ADIModuleDirective } from '../directives';

import type { InjectorInput } from '@adi/core'
import type { TemplateRef } from '@angular/core'

@Component({
  template: `
    <ng-container *adiModule="input; fallback fallback">
      <ng-content></ng-content>
    </ng-container>
  `,
  selector: 'adi-module',
  imports: [ADIModuleDirective],
  standalone: true,
})
export class ADIModuleComponent {
  @Input()
  private input: InjectorInput<any>;

  @Input()
  private fallback: TemplateRef<any> | null = null;
}
