import { Module, Injectable, ModuleToken } from "../../src";

@Injectable()
export class DynamicService {}

@Module({
  providers: [
    {
      provide: 'service',
      useClass: DynamicService,
    },
  ],
  exports: [
    'service',
  ]
})
export class DynamicModule {}

export const DynamicModuleToken = new ModuleToken({
  providers: [
    {
      provide: 'service',
      useClass: DynamicService,
    },
  ],
  exports: [
    'service',
  ]
})
