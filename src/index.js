const core = require("@actions/core");
const github = require("@actions/github");

// require ./helper_functions.js

/**
 * @param {boolean} isDebug
 * @returns {EventData}
 */
async function getEventData(isDebug) {
	const context = github.context;
	const payload = context.payload;

	if (isDebug) {
		core.info("");
		core.info("CONTEXT:");
		core.info(JSON.stringify(context, null, 4));
		core.info("");
		core.info("");
		core.info("PAYLOAD:");
		core.info(JSON.stringify(payload, null, 4));
		core.info("");
	}

	return {
		run_number: context.run_number,
		sha: context.sha,
		sha_short: context.sha.slice(-7),
		ref: context.ref,
		ref_name: context.ref_name,
		ref_type: context.ref_type,
		head_ref: context.head_ref,
		base_ref: context.base_ref,
	};
}

/**
 * @returns {GetInputs}
 */
function getInputs() {
	return {
		debug: inputBool("debug"),
		version: inputString("version", ""),
		branch_overrides: convertBranchOverridesToMap(inputMultiline("branch_overrides")),
		event_data: {},
	};
}

/**
 * @param {string[]} bo
 */
function convertBranchOverridesToMap(bo) {
	var res = {
		feature: {
			name: "",
			suffix: "-alpha",
			versionOnly: false,
		},
		develop: {
			name: "",
			suffix: "-dev",
			versionOnly: false,
		},
		master: {
			name: "",
			suffix: "",
			versionOnly: true,
		},
		release: {
			name: "",
			suffix: "-rc",
			versionOnly: false,
		},
		bugfix: {
			name: "",
			suffix: "-bug",
			versionOnly: false,
		},
		hotfix: {
			name: "",
			suffix: "-hot",
			versionOnly: false,
		},
	};

	for (let i = 0; i < bo.length; i++) {
		let bol = bo[i].split(",");
		let branch = bol[0].trim();
		res[branch].name = bol[1].trim();
		res[branch].suffix = bol[2].trim();
		res[branch].versionOnly = parseBool(bol[3]);
	}

	return res;
}

const igbNone = 0;
const igbBom = 1;
const igbNormal = 2;
/**
 * @param {string} gitBranch
 * @param {string[]} options
 * @returns {number} 0 == not match, 1 == bom match, 2 == default match
 */
function isGitBranch(gitBranch, bom, defOptions) {
	if (bom !== null && bom !== "") {
		if (gitBranch.toLowerCase().startsWith(option)) return igbBom;
	}

	for (let i = 0; i < defOptions.length; i++) {
		if (gitBranch.toLowerCase().startsWith(defOptions[i])) return igbNormal;
	}
	return igbNone;
}

/**
 * @param {string} gitBranch
 * @param {string} latestCommit
 * @param {number} runNumber
 * @param {BranchOverridesMap} bom
 * @returns {getVersionSuffixRes}
 */
function getVersionSuffix(gitBranch, latestCommit, runNumber, bom) {
	var res = {
		suffix: "-alpha",
		runNumber: runNumber,
		lastestCommit: latestCommit,
		versionOnly: false,

		getNewVersion: function() {
			if (this.versionOnly) return "";
			return `${this.suffix}${this.runNumber}-${this.latestCommit}`;
		},
	};

	let igb = 0;

	igb = isGitBranch(gitBranch, bom.feature.name, ["feature"]);
	if (igb === igbBom) {
		res.suffix = `-${bom.feature.suffix}`;
		res.versionOnly = bom.master.versionOnly;
		return res;
	} else if (igb === igbNormal) {
		return res;
	}

	igb = isGitBranch(gitBranch, bom.develop.name, ["dev", "develop"]);
	if (igb === igbBom) {
		res.suffix = `-${bom.develop.suffix}`;
		res.versionOnly = bom.master.versionOnly;
		return res;
	} else if (igb === igbNormal) {
		res.suffix = "-dev";
		return res;
	}

	igb = isGitBranch(gitBranch, bom.release.name, ["release"]);
	if (igb === igbBom) {
		res.suffix = `-${bom.release.suffix}`;
		res.versionOnly = bom.master.versionOnly;
		return res;
	} else if (igb === igbNormal) {
		res.suffix = "-rc";
		return res;
	}

	igb = isGitBranch(gitBranch, bom.bugfix.name, ["bug", "bugfix"]);
	if (igb === igbBom) {
		res.suffix = `-${bom.bugfix.suffix}`;
		res.versionOnly = bom.master.versionOnly;
		return res;
	} else if (igb === igbNormal) {
		res.suffix = "-bug";
		return res;
	}

	igb = isGitBranch(gitBranch, bom.hotfix.name, ["hot", "hotfix"]);
	if (igb === igbBom) {
		res.suffix = `-${bom.hotfix.suffix}`;
		res.versionOnly = bom.master.versionOnly;
		return res;
	} else if (igb === igbNormal) {
		res.suffix = "-hot";
		return res;
	}

	igb = isGitBranch(gitBranch, bom.master.name, ["main", "master"]);
	if (igb === igbBom) {
		res.suffix = `-${bom.master.suffix}`;
		res.versionOnly = bom.master.versionOnly;
		return res;
	} else if (igb === igbNormal) {
		res.suffix = "";
		res.versionOnly = true;
		return res;
	}

	if (isGitBranch(gitBranch, [bom.master, "main", "master"])) {
		res.suffix = "";
		res.versionOnly = true;
		return res;
	}

	// unknown
	return res;
}

async function run() {
	/** @type {GetInputs} */
	let inputs = {};

	try {
		core.info(`Reading inputs ...`);
		inputs = getInputs();

		if (inputs.debug) {
			core.info("");
			core.info("INPUT VALUES:");
			core.info(`  Version:          ${inputs.version}`);
			core.info(`  Branch Overrides: ${inputs.branch_overrides}`);
			core.info("");
		}

		core.info(`Get GIT Event Information ...`);
		inputs.event_data = await getEventData(inputs.debug);
	} catch (error) {
		core.error("Failed getting action inputs");
		if (error.response && error.response.data) core.error(JSON.stringify(request, null, 4));
		core.setFailed(error.message);
	}

	try {
		let res = getVersionSuffix(inputs.EventData.ref_name, inputs.EventData.sha, inputs.EventData.run_number, inputs.branch_overrides);

		core.setOutput("version_new", `${inputs.version}${res.getNewVersion()}`);
		core.setOutput("version_suffix", res.suffix);
		core.setOutput("version_run_number", res.runNumber);
		core.setOutput("version_latest_commit", res.lastestCommit);
		core.setOutput("version_version_only", res.versionOnly);
	} catch (error) {
		core.error("Failed to create the next version");
		if (error.response && error.response.data) core.error(JSON.stringify(request, null, 4));
		core.setFailed(error.message);
	}
}

run();

/**
 * @interface GetInputs
 * @property {boolean} number
 * @property {string} version
 * @property {BranchOverridesMap} branch_overrides
 * @property {EventDataObj} event_data
 */

/**
 * @interface EventData
 * @property {number} run_number
 * @property {string} sha
 * @property {string} sha_short
 * @property {string} ref
 * @property {string} ref_name
 * @property {string} ref_type
 * @property {string} head_ref
 * @property {string} base_ref
 */

/**
 * @interface BranchOverridesMap
 * @property {BranchOverridesMapItem} feature
 * @property {BranchOverridesMapItem} develop
 * @property {BranchOverridesMapItem} master
 * @property {BranchOverridesMapItem} release
 * @property {BranchOverridesMapItem} bugfix
 * @property {BranchOverridesMapItem} hotfix
 */

/**
 * @interface BranchOverridesMapItem
 * @property {string} name
 * @property {string} suffix
 * @property {boolean} versionOnly
 */

/**
 * @interface getVersionSuffixRes
 * @property {string} suffix
 * @property {number} runNumber
 * @property {string} lastestCommit
 * @property {string} versionOnly
 * @property {function} getNewVersion
 */
