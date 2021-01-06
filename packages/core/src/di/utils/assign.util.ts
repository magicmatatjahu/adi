export const assign = Object.assign || function (...args: any[]) {
  for (let i = args.length - 1; i > 0; i--) {
    for (let key in args[i]) {
      if (key !== "__proto__") {
        args[i - 1][key] = args[i][key];
      }
    }
  }
  return args[0];
}
