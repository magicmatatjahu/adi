import { promiseLikify } from "../src/utils";

describe('Utils function', function() {
  describe('promiseLikify', function() {
    test('should works with non promise functions', function() {
      function next(str: string) {
        return str + ' works!';
      }  
      const wrapper = promiseLikify(next);
  
      const result = wrapper('promiseLikify').then(val => {
        return val
      });
  
      expect(result).toEqual('promiseLikify works!');
    });

    test('should works with promise functions', async function() {
      async function next(str: string) {
        return str + ' works!';
      }  
      const wrapper = promiseLikify(next);
  
      const result = wrapper('promiseLikify').then(val => {
        return val
      });
  
      expect(await result).toEqual('promiseLikify works!');
    });
  });
});
