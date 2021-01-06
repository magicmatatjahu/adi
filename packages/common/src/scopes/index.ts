import { ApplicationScope } from "./application.scope";
import { CoreScope } from "./core.scope";
import { PlatformScope } from "./platform.scope";

const CommonScope = {
  APPLICATION: new ApplicationScope(),
  PLATFORM: new PlatformScope(),
  CORE: new CoreScope(),
}

export { CommonScope, ApplicationScope, PlatformScope, CoreScope };
