import chalk from "chalk"
import fs from "fs"
import Generator from "yeoman-generator"
import dependencies from "../dependencies.js"
import prompts from "./prompts.js"
import {
	lookForParentUI5ProjectAndPrompt,
	addPreviewMiddlewareTestConfig,
	ensureCorrectDestinationPath
} from "../helpers.js"
import path, { dirname } from "path"
import { fileURLToPath } from "url"
const __dirname = dirname(fileURLToPath(import.meta.url))

export default class extends Generator {
	static displayName = "Add a new qunit test to your uimodule."

	async prompting() {
		// standalone call
		if (!this.options.config) {
			await lookForParentUI5ProjectAndPrompt.call(this, prompts)
		} else {
			await lookForParentUI5ProjectAndPrompt.call(this, () => { }, false)
			this.options.config.testName = "First"
			// prioritize manually passed parameter over config from file, as the latter is not up to date when subgenerator is composed
			this.options.config.uimoduleName = this.options.uimoduleName
		}
	}

	async writing() {
		this.log(chalk.green(`✨ creating new qunit test for ${this.options.config.uimoduleName}`))

		ensureCorrectDestinationPath.call(this)

		addPreviewMiddlewareTestConfig.call(this, "Qunit")

		this.fs.copyTpl(
			// for some reason this.templatePath() doesn't work here
			path.join(__dirname, `templates/Test.${this.options.config.enableTypescript ? "ts": "js"}`),
			this.destinationPath(`webapp/test/unit/${this.options.config.testName}Test.${this.options.config.enableTypescript ? "ts": "js"}`),
			{testName: this.options.config.testName}
		)

		const uimodulePackageJson = JSON.parse(fs.readFileSync(this.destinationPath("package.json")))
		uimodulePackageJson.scripts["qunit"] = "fiori run --open test/unitTests.qunit.html"
		if (this.options.config.enableTypescript) {
			uimodulePackageJson["devDependencies"]["@types/qunit"] = dependencies["@types/qunit"]
		}
		fs.writeFileSync(this.destinationPath("package.json"), JSON.stringify(uimodulePackageJson, null, 4))
	}

}
