import { provide } from "../../src";

class A {}

interface LOL {}

interface Test<T> {}

describe('reflection provide<?> function', function () {
  test('testing', function () {
    provide<A>();
    provide<Test<LOL>>()
    provide<Test<string>>()
  });
});
