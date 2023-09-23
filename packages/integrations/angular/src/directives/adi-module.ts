import { Injector } from '@adi/core'
import { wait } from '@adi/core/lib/utils';
import { 
  Injector as AngularInjector,
  DestroyRef,
  Directive, 
  Input, 
  inject, 
  ViewContainerRef, 
  TemplateRef, 
  ChangeDetectorRef, 
} from '@angular/core'

import { provideSubInjector, createSubInjector, CreateSubInjectorContext } from '../standalone-features';
import { ADI_INJECTOR, ADI_INTERNAL_INJECTOR, InternalInjectorType } from '../tokens';

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
    provideSubInjector(),
  ]
})
export class ADIModuleDirective<T extends InjectorInput> implements OnInit, OnDestroy {
  static ngTemplateContextGuard<T extends InjectorInput>(
    _: ADIModuleDirective<T>,
    context: unknown
  ): context is ADIModuleContext {
    return true;
  }

  private readonly internalInjector: InternalInjectorType = inject(ADI_INTERNAL_INJECTOR)
  private readonly parent = inject<Injector>(ADI_INJECTOR, { skipSelf: true, optional: true }) || undefined;
  private readonly angularInjector = inject(AngularInjector);
  private readonly destroyRef = inject(DestroyRef);

  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly templateRef = inject(TemplateRef);
  private readonly cdr = inject(ChangeDetectorRef);

  private fallbackTemplateRef: TemplateRef<any> | null = null;
  private fallbackViewRef: EmbeddedViewRef<any> | null = null;
  private input: T | null = null;
  private destroyed = false;

  @Input()
  set adiModule(input: T | null) {
    this.input = input;
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

  private initInjector() {
    if (this.destroyed) {
      return;
    }

    const { isResolving, isResolved, isAsync, promise, injector } = this.internalInjector;
    if (isResolving === false && isResolved === false) {
      this.createInjector()
      return this.initInjector()
    }

    if (isAsync) {
      this.renderFallback()
      return wait(
        promise,
        () => {
          this.initInjector()
        }
      )
    }

    return this.renderTemplate(injector as Injector);
  }

  private renderTemplate(injector: Injector) {
    const context: ADIModuleContext = {
      $implicit: injector,
      injector,
    };

    this.fallbackViewRef = null;
    this.viewContainerRef.clear();
    this.viewContainerRef.createEmbeddedView(this.templateRef, context);
    this.cdr.markForCheck();
  }

  private renderFallback() {
    if (this.fallbackTemplateRef) {
      this.viewContainerRef.clear();
      this.fallbackViewRef = this.viewContainerRef.createEmbeddedView(this.fallbackTemplateRef);
    }
  }

  private createInjector() {
    const ctx: CreateSubInjectorContext = {
      parent: this.parent,
      angularInjector: this.angularInjector,
      destroyRef: this.destroyRef,
      internalInjector: this.internalInjector,
    }

    createSubInjector(ctx, this.input || undefined)
  }

  private assertTemplate(property: string, templateRef: TemplateRef<any> | null): void {
    const isTemplateRefOrNull = !!(!templateRef || templateRef.createEmbeddedView);

    if (!isTemplateRefOrNull) {
      throw new Error(`${property} must be a TemplateRef, but received '${templateRef}'.`);
    }
  }
}
