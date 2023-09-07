/**
 * Copied and slightly modified https://github.com/lukeed/dequal/blob/master/src/lite.js
 * 
 * Thanks Luke Edwards (https://github.com/lukeed) for awesome utility!
 */

var has = Object.prototype.hasOwnProperty;

export function dequalLite(foo: any, bar: any): boolean {
	var ctor: any, len: number;
	if (foo === bar) return true;

	if (foo && bar && (ctor = foo.constructor) === bar.constructor) {
		if (ctor === Array) {
			if ((len = foo.length) === bar.length) {
				while (len-- && dequalLite(foo[len], bar[len]));
			}
			return len === -1;
		}

		if (!ctor || typeof foo === 'object') {
			len = 0;
			for (ctor in foo) {
				if (has.call(foo, ctor) && ++len && !has.call(bar, ctor)) return false;
				if (!(ctor in bar) || !dequalLite(foo[ctor], bar[ctor])) return false;
			}
			return Object.keys(bar).length === len;
		}
	}

	return foo !== foo && bar !== bar;
}