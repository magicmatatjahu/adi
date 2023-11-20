import { Injector, ModuleToken } from '@adi/core';
import { Component, ChangeDetectionStrategy, ElementRef, ViewChild } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TestBed } from '@angular/core/testing';

import { provideInjector, inject } from '../../src'
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

    it('should not wait for parent sync injector', async () => {
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

    it('should wait for parent async injector', async () => {
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

  // TODO: Handle cache label when is passed to module options
  describe('with cache label', () => {
    @Component({
      selector: 'child-component',
      template: `<div>{{ injectedText }}</div>`,
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class ChildComponent {
      injectedText = inject('token')
      injector = inject(Injector)
    }
    
    @Component({
      template: `
        <div *ngIf="renderChild; else fallback">
          <child-component *adiModule="moduleInput" #childElement></child-component>
        </div>

        <ng-template #fallback>Fallback is rendered...</ng-template>
      `,
      imports: [ADIModuleDirective, ChildComponent, CommonModule],
      standalone: true,
    })
    class ParentComponent {
      private renderChild = false

      @ViewChild('childElement') 
      childElement: ChildComponent;

      constructor(private readonly elementRef: ElementRef<any>) {}

      readonly moduleInput = ModuleToken.create({
        options: {
          label: 'some-label'
        },
        providers: [
          {
            provide: 'token',
            useFactory() {
              return 'Child content'
            }
          }
        ],
      })

      get textContent(): string {
        return this.elementRef.nativeElement.textContent?.trim() ?? '';
      }

      setRenderChild(value: boolean) {
        this.renderChild = value;
      }
    }

    it.skip('should cache injector using label', async () => {
      const fixture = TestBed.createComponent(ParentComponent);
      fixture.autoDetectChanges();
      expect(fixture.componentInstance.textContent).toBe('Fallback is rendered...');

      fixture.componentInstance.setRenderChild(true)
      fixture.autoDetectChanges();
      const oldInjector = fixture.componentInstance.childElement.injector;

      expect(fixture.componentInstance.textContent).toBe('Child content');
      expect(oldInjector).toBeInstanceOf(Injector);

      fixture.componentInstance.setRenderChild(false)
      fixture.autoDetectChanges();
      expect(fixture.componentInstance.textContent).toBe('Fallback is rendered...');

      fixture.componentInstance.setRenderChild(true)
      fixture.autoDetectChanges();
      const newInjector = fixture.componentInstance.childElement.injector;

      expect(fixture.componentInstance.textContent).toBe('Child content');
      expect(newInjector).toBeInstanceOf(Injector);
      expect(oldInjector === newInjector).toBe(true);
    });
  });
});
