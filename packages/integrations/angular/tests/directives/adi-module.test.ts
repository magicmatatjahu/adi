import { ModuleToken } from '@adi/core';
import { Component, ChangeDetectionStrategy, ElementRef, Input } from '@angular/core'
import { TestBed } from '@angular/core/testing';

import { provideInjector, provide, inject } from '../../src'
import { ADIModuleDirective } from '../../src/directives/adi-module'

describe('ADIModuleDirective', () => {
  describe('without injections', () => {
    @Component({
      selector: 'child-component',
      template: `<div>Child component content</div>`,
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class ChildComponent {}
    
    @Component({
      template: `<child-component *adiModule></child-component>`,
      imports: [ADIModuleDirective, ChildComponent],
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class ParentComponent {
      constructor(private readonly elementRef: ElementRef<any>) {}
    
      get textContent(): string {
        return this.elementRef.nativeElement.textContent?.trim() ?? '';
      }
    }

    it('should compile', () => {
      TestBed.configureTestingModule({
        providers: [
          provideInjector(),
        ],
      });
  
      const fixture = TestBed.createComponent(ParentComponent);
      fixture.autoDetectChanges();
      
      expect(fixture.componentInstance).toBeTruthy();
    });
  
    it('should render child component without problems', () => {
      TestBed.configureTestingModule({
        providers: [
          provideInjector(),
        ],
      });
  
      const fixture = TestBed.createComponent(ParentComponent);
      fixture.autoDetectChanges();
      
      expect(fixture.componentInstance.textContent).toBe('Child component content');
    });

    it('should not wait for sync injector', async () => {
      const childModule = ModuleToken.create()

      const rootModule = ModuleToken.create({
        imports: [
          childModule,
        ]
      })

      TestBed.configureTestingModule({
        providers: [
          provideInjector(rootModule),
        ],
      });
  
      const fixture = TestBed.createComponent(ParentComponent);
      fixture.autoDetectChanges();
      
      expect(fixture.componentInstance.textContent).toBe('Child component content');
    });

    // TODO: weird effect that directive waits for async injector when logic should not be - fix that and make similar logic to the adiInject directive
    it.skip('should wait for async injector', async () => {
      const childModule = ModuleToken.create()

      const rootModule = ModuleToken.create({
        imports: [
          Promise.resolve(childModule)
        ]
      })

      TestBed.configureTestingModule({
        providers: [
          provideInjector(rootModule),
        ],
      });
  
      const fixture = TestBed.createComponent(ParentComponent);
      fixture.autoDetectChanges();
      
      expect(fixture.componentInstance.textContent).toBe('');
      
      // Resolve injector
      await new Promise(process.nextTick);
      
      expect(fixture.componentInstance.textContent).toBe('Child component content');
    });
  })

  describe('with sync input', () => {
    @Component({
      selector: 'child-component',
      template: `<div>{{ injectedText }}</div>`,
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class ChildComponent {
      injectedText = inject('token')
    }
    
    @Component({
      template: `
        <child-component
          *adiModule="moduleInput"
        >
        </child-component>
      `,
      imports: [ADIModuleDirective, ChildComponent],
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class ParentComponent {
      constructor(private readonly elementRef: ElementRef<any>) {}

      readonly moduleInput = ModuleToken.create({
        providers: [
          {
            provide: 'token',
            useFactory() {
              return 'sync value'
            }
          }
        ]
      })
    
      get textContent(): string {
        return this.elementRef.nativeElement.textContent?.trim() ?? '';
      }
    }

    it('should wait for sync injector', () => {  
      const fixture = TestBed.createComponent(ParentComponent);
      fixture.autoDetectChanges();
      
      expect(fixture.componentInstance.textContent).toBe('sync value');
    });
  });

  describe('with async input', () => {
    @Component({
      selector: 'child-component',
      template: `<div>{{ injectedText }}</div>`,
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class ChildComponent {
      injectedText = inject('token')
    }
    
    @Component({
      template: `
        <child-component
          *adiModule="moduleInput; fallback waitFallback"
        >
        </child-component>

        <ng-template #waitFallback>
          Fallback is rendered...
        </ng-template>
      `,
      imports: [ADIModuleDirective, ChildComponent],
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class ParentComponent {
      constructor(private readonly elementRef: ElementRef<any>) {}

      readonly childModule = ModuleToken.create({
        providers: [
          {
            provide: 'token',
            useFactory() {
              return 'async value'
            }
          }
        ],
        exports: [
          'token',
        ]
      })

      readonly moduleInput = ModuleToken.create({
        imports: [
          Promise.resolve(this.childModule)
        ],
      })
    
      get textContent(): string {
        return this.elementRef.nativeElement.textContent?.trim() ?? '';
      }
    }

    it('should wait for async injector using fallback', async () => {  
      const fixture = TestBed.createComponent(ParentComponent);
      fixture.autoDetectChanges();
      
      expect(fixture.componentInstance.textContent).toBe('Fallback is rendered...');
      
      // Resolve injections
      await new Promise(process.nextTick);

      expect(fixture.componentInstance.textContent).toBe('async value');
    });
  });
});
