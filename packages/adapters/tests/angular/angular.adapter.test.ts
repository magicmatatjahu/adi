import { StoreRootModule } from '@ngrx/store';
import { angularAdapter } from "../../src/angular";

describe('Angular adapter', function () {
  test('should work', function () {
    angularAdapter(StoreRootModule);
  });
});
