import { promiseLikify } from "../src/utils/promise-likify";

describe('Misc testing', function() {
  test('checking event loop', async function() {
    let a = 0;
    async function add() {
      a++;
    }
    async function addTwo() {
      await add();
      a++;
    }
    async function loop() {
      for (let i = 0; i < 100; i++) {
        await addTwo();
      }
      setTimeout(() => {
        console.log(a);
        a = 1000000000000;
      }, 0);
      for (let i = 0; i < 100; i++) {
        await addTwo();
      }
    }
    await loop();
  });

  // test.only('checking promislikefy', async function() {
  //   function next(str: string) {
  //     return str + ' dupa';
  //   }

  //   async function asyncNext(str: string) {
  //     return str + ' dupa';
  //   }

  //   const wrapper = promiseLikify(next);

  //   let result = wrapper('lol').then(val => {
  //     return val
  //   });

  //   console.log(result);

  //   const asyncWrapper = promiseLikify(asyncNext);

  //   result = asyncWrapper('lol').then(val => {
  //     return val
  //   });

  //   console.log(await result)
  // });
});
