import { Injector } from '@adi/core'
import { wait } from '@adi/core/lib/utils';
import { 
  Injector as NgInjector,
  Directive, 
  Input, 
  inject, 
  ViewContainerRef, 
  TemplateRef, 
  ChangeDetectorRef, 
} from '@angular/core'

import { provideInjector } from '../standalone-features';
import { ADI_INJECTOR_INPUT, ADI_INTERNAL_INJECTOR } from '../tokens';

import type { InjectorInput } from '@adi/core'
import type { OnDestroy, OnInit, EmbeddedViewRef } from '@angular/core'

export type ADIModuleContext = {
  $implicit: Injector;
  injector: Injector;
}

@Directive({
  selector: '[adiModule]',
  standalone: true,
  providers: [
    provideInjector(),
  ]
})
export class ADIModuleDirective<T extends InjectorInput> implements OnInit, OnDestroy {
  static ngTemplateContextGuard<T extends InjectorInput>(
    _: ADIModuleDirective<T>,
    context: unknown
  ): context is ADIModuleContext {
    return true;
  }

  private readonly ngInjector = inject(NgInjector)
  private readonly internalInjector = inject(ADI_INTERNAL_INJECTOR)
  private readonly injectorInput = inject(ADI_INJECTOR_INPUT)

  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly templateRef = inject(TemplateRef);
  private readonly cdr = inject(ChangeDetectorRef);

  private fallbackTemplateRef: TemplateRef<any> | null = null;
  private fallbackViewRef: EmbeddedViewRef<any> | null = null;
  private destroyed = false;

  @Input()
  set adiModule(input: T | null) {
    this.injectorInput.input = input;
  }

  @Input()
  set adiModuleFallback(templateRef: TemplateRef<any> | null) {
    this.assertTemplate('adiModuleFallback', templateRef);

    this.fallbackTemplateRef = templateRef;
    this.fallbackViewRef = null;  // clear previous view if any exist
  }

  ngOnInit() {
    this.initInjector()
  }

  ngOnDestroy() {
    this.destroyed = true;
  }

  protected initInjector() {
    if (this.destroyed) {
      return;
    }

    // create injector if it doesn't
    this.ngInjector.get(Injector)
    const { isResolving, isAsync } = this.internalInjector;
    if (isResolving && isAsync) {
      this.renderFallback()

      return wait(
        this.internalInjector.promise,
        _ => this.renderTemplate()
      )
    }

    return this.renderTemplate();
  }

  protected renderTemplate() {
    const injector = this.internalInjector.injector as Injector;
    const context: ADIModuleContext = {
      $implicit: injector,
      injector,
    };

    this.fallbackViewRef = null;
    this.viewContainerRef.clear();
    this.viewContainerRef.createEmbeddedView(this.templateRef, context);
    this.cdr.markForCheck();
  }

  protected renderFallback() {
    if (this.fallbackTemplateRef) {
      this.viewContainerRef.clear();
      this.fallbackViewRef = this.viewContainerRef.createEmbeddedView(this.fallbackTemplateRef);
    }
  }

  protected assertTemplate(property: string, templateRef: TemplateRef<any> | null): void {
    const isTemplateRefOrNull = !!(!templateRef || templateRef.createEmbeddedView);

    if (!isTemplateRefOrNull) {
      throw new Error(`${property} must be a TemplateRef, but received '${templateRef}'.`);
    }
  }
}
