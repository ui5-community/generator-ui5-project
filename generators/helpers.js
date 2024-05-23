import chalk from "chalk"

export async function lookForParentUI5ProjectAndPrompt(prompts, uimodulePrompt = true) {
	let configExists
	this.options.config = this.readDestinationJSON(".yo-rc.json")?.["generator-ui5-project"] || {}
	if (Object.keys(this.options.config).length === 0) {
		// look for ui5 projects in the parent dir
		this.destinationRoot(this.destinationPath("../"))
		this.options.config = this.readDestinationJSON(".yo-rc.json")?.["generator-ui5-project"] || {}
		if (Object.keys(this.options.config).length === 0) {
			this.log(`${chalk.yellow("We couldn't find a parent UI5 project with existing uimodules to run this subgenerator, but you can create one by running")} ${chalk.blue("yo easy-ui5 project")}${chalk.yellow(".")}`)
			this.cancelCancellableTasks()
		} else {
			configExists = true
		}
	} else {
		configExists = true
	}
	if (configExists) {
		// a subgenerator might be called before uimodules array gets created during end() as part of ./uimodule/index.js
		// in this case use uimoduleName
		if (!this.options.config.uimodules) {
			this.options.config.uimodule = this.options.config.uimoduleName
		} else if (this.options.config.uimodules?.length === 1) {
			this.options.config.uimodule = this.options.config.uimodules[0]
			if (uimodulePrompt) this.log(chalk.green(`✨ found existing uimodule ${this.options.config.uimodule}`))
		} else if (uimodulePrompt) {
			this.options.config.uimodule = (await this.prompt({
				type: "list",
				name: "uimodule",
				message: "For which uimodule would you like to call this subgenerator?",
				choices: this.options.config.uimodules
			})).uimodule
		}
		await prompts.call(this)
	}
}

export function validateAlphaNumericStartingWithLetterNonEmpty(string) {
	if (/^\d*[a-z][a-z0-9]*$/gi.test(string)) {
		if (string !== "") {
			return true
		}
	}
	return "Please use a non-empty value with alpha numeric characters only, starting with a letter."
}

export function validateAlphaNumericAndDotsNonEmpty(string) {
	if (/^[a-zA-Z0-9_\.]*$/g.test(string)) {
		if (string !== "") {
			return true
		}
	}
	return "Please use a non-empty value with alpha numeric characters and dots only."
}


export function validateAlphaNumeric(string) {
	if (/^[a-zA-Z0-9_-]*$/g.test(string)) {
		return true
	}
	return "Please use alpha numeric characters only."
}

export function validateUrl(string) {
	if (new URL(string) instanceof Error) {
		return 	// no error message required, yeoman will forward an error to the user
	}
	return true
}
