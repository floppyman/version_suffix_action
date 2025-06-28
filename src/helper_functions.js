/**
 * Checks if input is TRUE or FALSE and returns appropriately, else it will throw and exception
 * @param {string} inp
 * @returns
 */
function parseBool(inp) {
	var v = inp.trim().toUpperCase();
	if (v === "TRUE" || v === "FALSE") return inp.toUpperCase() === "TRUE";
	throw new Error("Input value is not correct format, but be either 'true' or 'false'");
}

/**
 * Gets the input value of the boolean type in the YAML 1.2 "core schema" specification.
 * Support boolean input list: `true | True | TRUE | false | False | FALSE` .
 * The return value is also in boolean type.
 * @param {string} key
 * @returns {boolean}
 */
function getBoolInput(key) {
	return core.getBooleanInput(key, {
		required: false,
		trimWhitespace: true
	});
}

/**
 * Gets the value of an input.  The value is also trimmed.
 * Returns an empty string if the value is not defined.
 * @param {string} key
 * @param {string} def
 * @returns {string}
 */
function getStringInput(key, def) {
	var inp = core.getInput(key, {
		required: false,
		trimWhitespace: true
	});
	if (inp == "") return def;
	return inp;
}

/**
 * Gets the values of an multiline input.  Each value is also trimmed.
 * @param {string} key
 * @returns {string[]}
 */
function getMultilineInput(key) {
	var inp = core.getMultilineInput(key, {
		required: false,
		trimWhitespace: true
	});
	if (inp == "") return def;
	return inp;
}

/**
 * Gets the value of an input parsed as an Int.  The value is trimmed before parse.
 * Returns the 'def' if empty string or parseInt failes.
 * @param {string} key
 * @param {number} def
 * @returns {number}
 */
function getIntInput(key, def) {
	var inp = core.getInput(key, {
		required: false,
		trimWhitespace: true
	});
	if (inp == "") return def;
	try {
		return parseInt(inp);
	} catch {
		return def;
	}

	core.get;
}