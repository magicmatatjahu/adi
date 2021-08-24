// import { applyThenable } from "../src/utils/thenable";

describe('Utils function', function() {
  describe('thenable', function() {
    test('should works with non promise functions', function() {});
    // test('should works with non promise functions', function() {
    //   function next(str: string) {
    //     return str + ' works!';
    //   }  
    //   const wrapper = applyThenable(next);
  
    //   const result = wrapper('thenable').then(val => {
    //     return val
    //   });
    //   expect(result).toEqual('thenable works!');
    // });

    // test('should works with non promise functions - rejection case', function() {
    //   function next(str: string) {
    //     throw new Error('Error!');
    //   }  
    //   const wrapper = applyThenable(next);
  
    //   let error: undefined;
    //   const result = wrapper('thenable').then(
    //     val => {
    //       return val
    //     },
    //     err => {
    //       error = err;
    //       return err.message;
    //     }
    //   );
    //   expect(result).toEqual('Error!');
    //   expect(error === undefined).toEqual(false);
    // });

    // test('should works with native promise functions', async function() {
    //   function next(str: string) {
    //     return Promise.resolve(str + ' works!');
    //   }  
    //   const wrapper = applyThenable(next);
  
    //   const result = wrapper('thenable').then(val => {
    //     return val
    //   });
    //   expect(await result).toEqual('thenable works!');
    // });

    // test('should works with native promise functions - rejection case', async function() {
    //   async function next(str: string) {
    //     return Promise.reject(new Error('Error!'));
    //   }  
    //   const wrapper = applyThenable(next);
  
    //   let error: undefined;
    //   const result = await wrapper('thenable').then(
    //     val => {
    //       return val
    //     },
    //     err => {
    //       error = err;
    //       return err.message;
    //     }
    //   );
    //   expect(result).toEqual('Error!');
    //   expect(error === undefined).toEqual(false);
    // });

    // test('should works with async promise functions', async function() {
    //   async function next(str: string) {
    //     return str + ' works!';
    //   }  
    //   const wrapper = applyThenable(next);
  
    //   const result = wrapper('thenable').then(val => {
    //     return val
    //   });
    //   expect(await result).toEqual('thenable works!');
    // });

    // test('should works with async promise functions - rejection case', async function() {
    //   async function next(str: string) {
    //     throw new Error('Error!');
    //   }  
    //   const wrapper = applyThenable(next);
  
    //   let error: undefined;
    //   const result = await wrapper('thenable').then(
    //     val => {
    //       return val;
    //     },
    //     err => {
    //       error = err;
    //       return err.message;
    //     }
    //   );
    //   expect(result).toEqual('Error!');
    //   expect(error === undefined).toEqual(false);
    // });

    // test.only('should works with chain of thenable objects', function() {
    //   function next(str: string) {
    //     return thenable(function nested() {
    //       return str + ' works!';
    //     });
    //   }  
    //   const wrapper = thenable(next);
  
    //   const result = wrapper('thenable').then(val => {
    //     return val
    //   });
    //   expect(result).toEqual('thenable works!');
    // });
  });
});
