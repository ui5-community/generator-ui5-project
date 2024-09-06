import chalk from "chalk"
import fs from "fs"
import yaml from "yaml"

export async function lookForParentUI5ProjectAndPrompt(prompts, uimodulePrompt = true, alternativePromptMessage) {
	const readConfig = () => this.readDestinationJSON(".yo-rc.json")?.["generator-ui5-project"] || {}
	this.options.config = readConfig()

	if (Object.keys(this.options.config).length === 0) {
		this.destinationRoot(this.destinationPath("../"))
		this.options.config = readConfig()

		if (Object.keys(this.options.config).length === 0) {
			this.log(`${chalk.yellow("We couldn't find a parent UI5 project with existing uimodules to run this subgenerator, but you can create one by running")} ${chalk.blue("yo easy-ui5 project")}${chalk.yellow(".")}`)
			return this.cancelCancellableTasks()
		}
	}

	if (this.options.config.uimodules) {
		if (this.options.config.uimodules.length === 1) {
			this.options.config.uimoduleName = this.options.config.uimodules[0]
			if (uimodulePrompt) this.log(chalk.green(`✨ found existing uimodule ${this.options.config.uimoduleName}`))
		} else if (uimodulePrompt) {
			this.options.config.uimoduleName = (await this.prompt({
				type: "list",
				name: "uimoduleName",
				message: alternativePromptMessage || "For which uimodule would you like to call this subgenerator?",
				choices: this.options.config.uimodules
			})).uimoduleName
		}
	}

	await prompts.call(this)
}

export function addModuleToNPMWorkspaces(moduleName) {
	const rootPackageJson = JSON.parse(fs.readFileSync(this.destinationPath("package.json")))
	rootPackageJson.workspaces.push(moduleName)
	rootPackageJson.scripts[`start:${moduleName}`] = `npm start --workspace ${moduleName}`
	fs.writeFileSync(this.destinationPath("package.json"), JSON.stringify(rootPackageJson, null, 4))

}

export async function ensureCorrectDestinationPath() {
	// required when called from fpmpage subgenerator
	if (!this.destinationPath().endsWith(this.options.config.uimoduleName)) {
		this.destinationRoot(this.destinationPath(this.options.config.uimoduleName))
	}
}

export async function addPreviewMiddlewareTestConfig(framework) {
	const ui5Yaml = yaml.parse(fs.readFileSync(this.destinationPath("ui5.yaml")).toString())
	const testConfig = { framework: framework }
	const middlewareName = "preview-middleware"

	let middleware = ui5Yaml.server.customMiddleware.find(m => m.name === middlewareName)

	if (!middleware) {
		middleware = {
			name: middlewareName,
			afterMiddleware: "compression",
			configuration: { test: [] }
		}
		ui5Yaml.server.customMiddleware.push(middleware)
	}

	if (!middleware.configuration) {
		middleware.configuration = { test: [testConfig] }
	}

	if (!middleware.configuration.test) {
		middleware.configuration.test = [testConfig]
	}

	if (!middleware.configuration.test.find(t => t.framework === framework)) {
		middleware.configuration.test.push(testConfig)
	}

	fs.writeFileSync(this.destinationPath("ui5.yaml"), yaml.stringify(ui5Yaml))
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

export function validateAlphaNumericNonEmpty(string) {
	if (/^[a-zA-Z0-9_-]*$/g.test(string)) {
		if (string !== "") {
			return true
		}
	}
	return "Please use a non-empty value with alpha numeric characters only."
}


export function validateUrl(string) {
	if (new URL(string) instanceof Error) {
		return 	// no error message required, yeoman will forward an error to the user
	}
	return true
}
