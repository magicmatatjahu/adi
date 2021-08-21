// const array = [];
// for (let i = 0; i < 1e3; i++) {
//   array.push(new Set())
// }

// const used = process.memoryUsage();
// for (let key in used) {
//   console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
// }

(async () => {
  new Promise((resolve, reject) => {
    try {
      // resolve('lol')
      throw new Error('lol');
    } catch(e) {
      reject(e);
    }
  })
    .then(
      result => {
        console.log('result: ', result);
      },
      err => {
        console.log('err: ', err);
      }
    );
})();