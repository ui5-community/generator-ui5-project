import chalk from "chalk"
import dependencies from "../dependencies.js"
import fs from "fs"
import Generator from "yeoman-generator"
import prompts from "./prompts.js"
import { lookForParentUI5ProjectAndPrompt } from "../helpers.js"
import yaml from "yaml"
import path, { dirname } from "path"
import { fileURLToPath } from "url"
const __dirname = dirname(fileURLToPath(import.meta.url))

export default class extends Generator {
	static displayName = "Add a new qunit test to your uimodule."

	async prompting() {
		await lookForParentUI5ProjectAndPrompt.call(this, prompts)
	}

	async writing() {
		this.log(chalk.green(`✨ creating new qunit test for ${this.options.config.uimoduleName}`))
	
		// required when called from fpmpage subgenerator
		if (!this.destinationPath().endsWith(this.options.config.uimoduleName)) {
			this.destinationRoot(this.destinationPath(this.options.config.uimoduleName))
		}

		const ui5Yaml = yaml.parse(fs.readFileSync(this.destinationPath("ui5.yaml")).toString())

		ui5Yaml.server.customMiddleware.push({
			name: "preview-middleware",
			afterMiddleware: "compression",
			configuration: {
				test: [{ framework: "Qunit" }]
			}
		})
		fs.writeFileSync(this.destinationPath("ui5.yaml"), yaml.stringify(ui5Yaml))

		this.fs.copyTpl(
			// for some reason this.templatePath() doesn't work here
			path.join(__dirname, "templates"),
			this.destinationPath("webapp/test/unit"),
			{
				uimodule: this.options.config.uimodule
			}
		)

		const uimodulePackageJson = JSON.parse(fs.readFileSync(this.destinationPath("package.json")))
		uimodulePackageJson.scripts["qunit"] = "fiori run --open test/unitTests.qunit.html"
		fs.writeFileSync(this.destinationPath("package.json"), JSON.stringify(uimodulePackageJson, null, 4))
	}

}
