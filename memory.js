const array = [];
for (let i = 0; i < 1e3; i++) {
  array.push(new Set())
}

const used = process.memoryUsage();
for (let key in used) {
  console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
}