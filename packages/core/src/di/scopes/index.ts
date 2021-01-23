import { Scope } from "./scope";
import { InstanceScope } from "./instance.scope";
import { PrototypeScope } from "./prototype.scope";
import { RequestScope } from "./request.scope";
import { SingletonScope } from "./singleton.scope";
import { TransientScope } from "./transient.scope";

Scope.DEFAULT = new Scope();
Scope.INSTANCE = new InstanceScope();
Scope.REQUEST = new RequestScope();
Scope.SINGLETON = new SingletonScope();
Scope.TRANSIENT = new TransientScope();
Scope.PROTOTYPE = new PrototypeScope();

export { Scope };
