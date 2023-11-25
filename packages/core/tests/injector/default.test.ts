import { Injector, Injectable } from "../../src";
import { InjectorStatus } from "../../src/enums";

describe('injector', function() {
  it('should work with the "using" statement', async function() {
    let calls = 0;

    @Injectable()
    class Service {
      onDestroy() {
        calls++;
      }
    }
  
    async function testing() {
      await using scoped = Injector.create([
        Service
      ]);
      await scoped.get(Service)
    }
  
    await testing();
    await testing();
    await testing();
    expect(calls).toEqual(3);
  });

  it('should destroy without "destroy: false" option', async function() {  
    const injector = Injector.create();
  
    await injector.destroy();
    expect(injector.status & InjectorStatus.DESTROYED).toEqual(InjectorStatus.DESTROYED);
  });

  it('should not destroy with "destroy: false" option', async function() {
    const injector = Injector.create([], { destroy: false });
  
    await injector.destroy();
    expect(injector.status & InjectorStatus.DESTROYED).toEqual(0);
  });
});
