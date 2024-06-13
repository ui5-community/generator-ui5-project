import chalk from "chalk"
import fs from "fs"
import Generator from "yeoman-generator"
import prompts from "./prompts.js"
import { lookForParentUI5ProjectAndPrompt } from "../helpers.js"
import yaml from "yaml"
import path, { dirname } from "path"
import { fileURLToPath } from "url"
const __dirname = dirname(fileURLToPath(import.meta.url))

export default class extends Generator {
	static displayName = "Add a new opa5 test to your uimodule."

	async prompting() {
		// standalone call
		if (!this.options.config) {
			await lookForParentUI5ProjectAndPrompt.call(this, prompts)
			this.options.config.route = this.options.config.viewName.toLowerCase()
		} else {
			await lookForParentUI5ProjectAndPrompt.call(this, () => { }, false)
			this.options.config.testName = "First"
			this.options.config.viewName = "MainView"
			this.options.config.route = ""
			// prioritize manually passed parameter over config from file, as the latter is not up to date when subgenerator are composed
			this.options.config.uimoduleName = this.options.uimoduleName
		}
	}

	async writing() {
		this.log(chalk.green(`✨ creating new opa5 journey for ${this.options.config.uimoduleName}`))

		// required when called from fpmpage subgenerator
		if (!this.destinationPath().endsWith(this.options.config.uimoduleName)) {
			this.destinationRoot(this.destinationPath(this.options.config.uimoduleName))
		}

		const ui5Yaml = yaml.parse(fs.readFileSync(this.destinationPath("ui5.yaml")).toString())
		const testConfig = { framework: "OPA5" }
		let previewMiddlewareAlreadyExists
		for (const middleware of ui5Yaml.server.customMiddleware) {
			if (middleware.name === "preview-middleware") {
				previewMiddlewareAlreadyExists = true
				if (middleware.configuration?.test) {
					middleware.configuration.test.push(testConfig)
				} else {
					middleware.configuration = {
						test: [testConfig]
					}
				}
			}
		}
		if (!previewMiddlewareAlreadyExists) {
			ui5Yaml.server.customMiddleware.push({
				name: "preview-middleware",
				afterMiddleware: "compression",
				configuration: {
					test: [testConfig]
				}
			})

		}
		fs.writeFileSync(this.destinationPath("ui5.yaml"), yaml.stringify(ui5Yaml))

		this.fs.copyTpl(
			// for some reason this.templatePath() doesn't work here
			path.join(__dirname, "templates/pages/View.js"),
			this.destinationPath(`webapp/test/integration/pages/${this.options.config.viewName}.js`),
			{
				viewName: this.options.config.viewName,
				uimoduleName: this.options.config.uimoduleName,
				route: this.options.config.route
			}
		)
		this.fs.copyTpl(
			// for some reason this.templatePath() doesn't work here
			path.join(__dirname, "templates/Journey.js"),
			this.destinationPath(`webapp/test/integration/${this.options.config.testName}Journey.js`),
			{
				viewName: this.options.config.viewName,
				uimoduleName: this.options.config.uimoduleName,
				route: this.options.config.route
			}
		)

		const uimodulePackageJson = JSON.parse(fs.readFileSync(this.destinationPath("package.json")))
		uimodulePackageJson.scripts["opa5"] = "fiori run --open test/opaTests.qunit.html"
		fs.writeFileSync(this.destinationPath("package.json"), JSON.stringify(uimodulePackageJson, null, 4))
	}

}
