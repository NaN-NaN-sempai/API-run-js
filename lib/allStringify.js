function indent (s, paddingSize) {
	console.log(s);
	return s.split("\n").map(s => (" ".repeat(paddingSize) || "\t") + s).join("\n");
}

function stringify (anything, doEnconde) {
	
	var p, key_values = [];

	var returnStr;

	if (typeof anything == "function"){
		returnStr = anything + "";

	} else if (anything instanceof Array) {
		returnStr = "[" + anything.map(stringify).join(", ") + "]";

	} else if (anything instanceof Date) {
		returnStr = anything.toString();	

	} else if (typeof anything === "object") {
		if ((anything+"").startsWith("ReferenceError: ")) {
			returnStr = anything+"";
		} else {
			for (p in anything) {
				console.log(p);
				if (anything.hasOwnProperty(p)) {
					key_values.push(p + ": " + stringify(anything[p]));
				}
			}
			returnStr = "{\n" + indent(key_values.join(",\n"), 4) + "\n}";
		}

	} else if (typeof anything === "string") {
		returnStr = anything;
	} else {
		returnStr = anything + "";
	}
	return doEnconde? encodeURI(returnStr): returnStr;
}

module.exports = stringify;