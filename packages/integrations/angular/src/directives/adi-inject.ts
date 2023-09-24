import { Injector, waitAll } from '@adi/core';
import { getAllKeys, isPromiseLike, wait } from '@adi/core/lib/utils';
import { convertInjection, createInjectionMetadata, optimizedInject } from '@adi/core/lib/injector';
import { InjectionKind } from '@adi/core/lib/enums';
import { Injector as NgInjector, Directive, Input, inject, ViewContainerRef, TemplateRef, ChangeDetectorRef } from '@angular/core'

import { ADI_INTERNAL_INJECTOR } from '../tokens';

import type { InjectionItem } from '@adi/core'
import type { OnChanges, OnDestroy, OnInit, EmbeddedViewRef } from '@angular/core'

type InjectionItemType<T extends InjectionItem<unknown>> = T extends InjectionItem<infer R> ? R : never;

type InjectionItemMap<T extends { [key: string]: InjectionItem<unknown> }> = {
  [K in keyof T]: InjectionItemType<T[K]>;
};

export type ADIInjectContext<T extends { [key: string]: InjectionItem }> = {
  $implicit: InjectionItemMap<T>;
} & InjectionItemMap<T>;

@Directive({
  selector: '[adiInject]',
  standalone: true,
})
export class ADIInjectDirective<T extends { [key: string]: InjectionItem }> implements OnInit, OnChanges, OnDestroy {
  static ngTemplateContextGuard<T extends { [key: string]: InjectionItem }>(
    _: ADIInjectDirective<T>,
    context: unknown
  ): context is ADIInjectContext<T> {
    return true;
  }

  private readonly ngInjector = inject(NgInjector)
  private readonly internalInjector = inject(ADI_INTERNAL_INJECTOR);

  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly templateRef = inject(TemplateRef);
  private readonly cdr = inject(ChangeDetectorRef);

  private fallbackTemplateRef: TemplateRef<any> | null = null;
  private fallbackViewRef: EmbeddedViewRef<any> | null = null;
  private providers: T | null = null;
  private resolved = false
  private destroyed = false;

  @Input() 
  set adiInject(providers: T | null) {
    this.providers = providers;
    this.resolved = false;
  }

  @Input()
  set adiInjectFallback(templateRef: TemplateRef<any> | null) {
    this.assertTemplate('adiInjectFallback', templateRef);

    this.fallbackTemplateRef = templateRef;
    this.fallbackViewRef = null;  // clear previous view if any exist
  }

  ngOnInit() {
    this.updateView()
  }
  
  ngOnChanges() {
    this.updateView()
  }

  ngOnDestroy() {
    this.destroyed = true;
  }

  private updateView() {
    if (this.destroyed || this.resolved) {
      return;
    }

    // create injector if it doesn't
    this.ngInjector.get(Injector)
    const { isResolving, isAsync } = this.internalInjector;
    if (isResolving && isAsync) {
      this.renderFallback()

      return wait(
        this.internalInjector.promise,
        _ => this.updateView()
      )
    }

    const injections = this.resolveProviders();
    if (injections === null) {
      this.viewContainerRef.clear();
      return this.viewContainerRef.createEmbeddedView(this.templateRef);
    }

    const isPromise = isPromiseLike(injections);
    if (isPromise === false) {
      return this.renderTemplate(injections)
    }

    this.renderFallback()
    wait(
      injections,
      result => this.renderTemplate(result)
    )
  }

  private renderTemplate(injections: InjectionItemMap<T>) {
    const context: ADIInjectContext<T> = {
      $implicit: injections,
      ...injections,
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
  
  private resolveProviders() {
    const providers = this.providers;
    if (providers === null) {
      return null;
    }

    const values: any = {}
    const injections: any[] = []
    const properties = getAllKeys(providers);
    const metadata = createInjectionMetadata({
      kind: InjectionKind.CUSTOM,
    })

    const injector = this.internalInjector.injector as Injector
    properties.forEach(prop => {
      injections.push(
        wait(
          optimizedInject(injector, undefined, convertInjection(providers[prop as string], metadata)),
          value => values[prop] = value,
        )
      );
    })

    return waitAll(
      injections,
      () => {
        this.resolved = true;
        return values
      },
    )
  }

  private assertTemplate(property: string, templateRef: TemplateRef<any> | null): void {
    const isTemplateRefOrNull = !!(!templateRef || templateRef.createEmbeddedView);

    if (!isTemplateRefOrNull) {
      throw new Error(`${property} must be a TemplateRef, but received '${templateRef}'.`);
    }
  }
}
