import { ModuleToken } from '@adi/core';
import { Component, ChangeDetectionStrategy, ElementRef, Input } from '@angular/core'
import { TestBed } from '@angular/core/testing';

import { provideInjector, provide, ADIInjectDirective } from '../../src'

describe('ADIInjectDirective', () => {
  describe('without injections', () => {
    @Component({
      selector: 'child-component',
      template: `<div>Child component content</div>`,
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class ChildComponent {}
    
    @Component({
      template: `<child-component *adiInject></child-component>`,
      imports: [ADIInjectDirective, ChildComponent],
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

    it('should wait for async injector', async () => {
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
      
      // Resolve injections
      await new Promise(process.nextTick);

      expect(fixture.componentInstance.textContent).toBe('Child component content');
    });
  })

  describe('with injections', () => {
    @Component({
      selector: 'child-component',
      template: `<div>{{ injectedText }}</div>`,
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class ChildComponent {
      @Input() 
      injectedText!: string;
    }
    
    @Component({
      template: `
        <child-component
          *adiInject="{ injectedText: injectedToken }; let injections"
          [injectedText]="injections.injectedText"
        >
        </child-component>
      `,
      imports: [ADIInjectDirective, ChildComponent],
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class ParentComponent {
      constructor(private readonly elementRef: ElementRef<any>) {}

      readonly injectedToken = 'token'
    
      get textContent(): string {
        return this.elementRef.nativeElement.textContent?.trim() ?? '';
      }
    }

    it('should not wait for sync injections', () => {
      TestBed.configureTestingModule({
        providers: [
          provideInjector(),
          provide({
            providers: [
              {
                provide: 'token',
                useFactory() {
                  return 'sync value'
                }
              }
            ]
          }),
        ],
      });
  
      const fixture = TestBed.createComponent(ParentComponent);
      fixture.autoDetectChanges();
      
      expect(fixture.componentInstance.textContent).toBe('sync value');
    });

    it('should wait for async injections', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideInjector(),
          provide({
            providers: [
              {
                provide: 'token',
                async useFactory() {
                  return 'async value'
                }
              }
            ]
          }),
        ],
      });
  
      const fixture = TestBed.createComponent(ParentComponent);
      fixture.autoDetectChanges();
      
      expect(fixture.componentInstance.textContent).toBe('');
      
      // Resolve injections
      await new Promise(process.nextTick);

      expect(fixture.componentInstance.textContent).toBe('async value');
    });
  });

  describe('with fallback', () => {
    @Component({
      selector: 'child-component',
      template: `<div>{{ injectedText }}</div>`,
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class ChildComponent {
      @Input() 
      injectedText!: string;
    }
    
    @Component({
      template: `
        <child-component
          *adiInject="{ injectedText: injectedToken }; let injections; fallback waitFallback"
          [injectedText]="injections.injectedText"
        >
        </child-component>

        <ng-template #waitFallback>
          Fallback is rendered...
        </ng-template>
      `,
      imports: [ADIInjectDirective, ChildComponent],
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class ParentComponent {
      constructor(private readonly elementRef: ElementRef<any>) {}

      readonly injectedToken = 'token'
    
      get textContent(): string {
        return this.elementRef.nativeElement.textContent?.trim() ?? '';
      }
    }

    it('should wait for sync injections', () => {
      TestBed.configureTestingModule({
        providers: [
          provideInjector(),
          provide({
            providers: [
              {
                provide: 'token',
                useFactory() {
                  return 'sync value'
                }
              }
            ]
          }),
        ],
      });
  
      const fixture = TestBed.createComponent(ParentComponent);
      fixture.autoDetectChanges();
      
      expect(fixture.componentInstance.textContent).toBe('sync value');
    });

    it('should wait for async injections', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideInjector(),
          provide({
            providers: [
              {
                provide: 'token',
                async useFactory() {
                  return 'async value'
                }
              }
            ]
          }),
        ],
      });
  
      const fixture = TestBed.createComponent(ParentComponent);
      fixture.autoDetectChanges();
      
      expect(fixture.componentInstance.textContent).toBe('Fallback is rendered...');
      
      // Resolve injections
      await new Promise(process.nextTick);

      expect(fixture.componentInstance.textContent).toBe('async value');
    });
  });
});
