# version suffix action

Version Suffix generates the appropriate version number for different types of branches, and then provides ENV variables with the different parts, which can then be fetched in other steps later.

## Inputs

```yaml
version:
  description: "The current SemVer version number"
  required: true
  default: ""

branch_overrides:
  description: "Multiline definition of overrides to map branches to versions, supports for `feature, develop, master, release, bugfix, hotfix`, using a comma separated string with 4 values in format: <branch_to_override (string)>,<branch_name (string)>,<version_suffix (string)>,<return_version_only (bool)>"
  required: false
  default: ""

debug:
  description: "Prints debug information for dev/troubleshooting"
  required: false
  default: "false"
```

## Outputs
Output values can be accessed by getting them from the step using the step id like so `${{ steps.<ID_OF_STEP>.outputs.<NAME_OF_AN_OUTPUT> }}` in any of the subsequent steps.

```yaml
VERSION_NEW:
  description: "The full version string"

VERSION_SUFFIX:
  description: "The calculated suffix"

VERSION_RUN_NUMBER:
  description: "The calculated run number"

VERSION_LATEST_COMMIT:
  description: "The calculated latest commit hash (7 chars)"

VERSION_VERSION_ONLY:
  description: "If the version is version only or it contains the other values"
```

## Example Usage

### Minimal Step

```yaml
- name: Calculate next version
  id: NextVersion
  uses: floppyman/version_suffix_action@main
  with:
	version: "1.0.0"
```

Then to get forexample the new full version string you can call `${{ steps.NextVersion.outputs.VERSION_NEW }}`

### Step with branch overrides

```yaml
- name: Calculate next version
  id: NextVersion
  uses: floppyman/version_suffix_action@main
  with:
	version: "1.0.0",
	branch_overrides: |
	  "feature,thing,new,false"
	  "release,uat,uat,true"
```

Then to get forexample the new full version string you can call `${{ steps.NextVersion.outputs.VERSION_NEW }}`
