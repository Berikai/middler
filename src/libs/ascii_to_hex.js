// MADE BY BERIKAI 2023
// https://github.com/berikai

function ascii_to_hex(str) {
	var arr1 = [];
	for (var n = 0, l = str.length; n < l; n ++) {
		var hex = Number(str.charCodeAt(n)).toString(16);
		arr1.push(hex);
	}
	return arr1.join('');
}

module.exports = ascii_to_hex;