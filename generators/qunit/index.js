import chalk from "chalk"
import dependencies from "../dependencies.js"
import fs from "fs"
import Generator from "yeoman-generator"
import prompts from "./prompts.js"
import { lookForParentUI5ProjectAndPrompt } from "../helpers.js"
import path, { dirname } from "path"
import { fileURLToPath } from "url"
const __dirname = dirname(fileURLToPath(import.meta.url))

export default class extends Generator {
	static displayName = "Add a new qunit test to your uimodule."

	async prompting() {
		await lookForParentUI5ProjectAndPrompt.call(this, prompts)
	}

	async writing() {
		this.log(chalk.green(`✨ creating new qunit test for ${this.options.config.uimodule}`))

		const webappPath = `${this.options.config.uimodule}/webapp`

		let ui5LibsPath
		switch (this.options.config.ui5Libs) {
			case "Content delivery network (OpenUI5)":
				ui5LibsPath = `https://sdk.openui5.org/${dependencies["OpenUI5"]}/`
				break
			case "Content delivery network (SAPUI5)":
				ui5LibsPath = `https://ui5.sap.com/${dependencies["SAPUI5"]}/`
				break
			case "Local resources (OpenUI5)" || "Local resources (SAPUI5)":
				ui5LibsPath = "../../"
				break
		}

		const config = [
			"allTests.js",
			"unitTests.qunit.html",
			"unitTests.qunit.js"
		]
		const modelImplementationExists = fs.existsSync(this.destinationPath(`${webappPath}/model/models.js`))
		if (modelImplementationExists) {
			config.push("model")
		}
		for (const file of config) {
			this.fs.copyTpl(
				// for some reason this.templatePath() doesn't work here
				path.join(__dirname, "templates", file),
				this.destinationPath(`${webappPath}/test/unit/${file}`),
				{
					uimodule: this.options.config.uimodule,
					ui5LibsPath: ui5LibsPath,
					modelImplementationExists: modelImplementationExists
				}
			)
		}
	}

}
