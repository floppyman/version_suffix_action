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

	let refSplit = payload.ref.split("/");

	return {
		run_number: context.runNumber,
		sha: context.sha,
		sha_short: context.sha.slice(-7),
		ref: payload.ref,
		ref_name: refSplit.length >= 3 ? refSplit[2] : "",
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
 * @param {string} bom
 * @param {string[]} defOptions
 * @returns {number} 0 == not match, 1 == bom match, 2 == default match
 */
function isGitBranch(gitBranch, bom, defOptions) {
	if (bom !== null && bom !== "") {
		if (gitBranch.toLowerCase().startsWith(bom)) return igbBom;
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
		latestCommit: latestCommit,
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
	core.info(`Version Suffix Action`);

	/** @type {GetInputs} */
	let inputs = {};

	try {
		core.info(`Reading inputs ...`);
		inputs = getInputs();

		if (inputs.debug) {
			core.info("");
			core.info("INPUT VALUES:");
			core.info(`  Version:          ${inputs.version}`);
			core.info(`  Branch Overrides: ${JSON.stringify(inputs.branch_overrides)}`);
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
		let res = getVersionSuffix(inputs.event_data.ref_name, inputs.event_data.sha_short, inputs.event_data.run_number, inputs.branch_overrides);
		let fullVersion = `${inputs.version}${res.getNewVersion()}`;

		core.info("Results");
		core.info(`version_full: ${fullVersion}`);
		core.info(`version_number: ${inputs.version}`);
		core.info(`version_suffix: ${res.suffix}`);
		core.info(`version_run_number: ${res.runNumber}`);
		core.info(`version_latest_commit: ${res.latestCommit}`);
		core.info(`version_version_only: ${res.versionOnly}`);
		core.info("----------");

		core.info(`Setting outputs ...`);
		core.setOutput("version_full", fullVersion);
		core.setOutput("version_number", inputs.version);
		core.setOutput("version_suffix", res.suffix);
		core.setOutput("version_run_number", res.runNumber);
		core.setOutput("version_latest_commit", res.latestCommit);
		core.setOutput("version_version_only", res.versionOnly);

		core.info(`Version generated`);
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
 * @property {string} latestCommit
 * @property {string} versionOnly
 * @property {function} getNewVersion
 */
