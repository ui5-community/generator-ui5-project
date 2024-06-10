import chalk from "chalk"
import fs from "fs"
import Generator from "yeoman-generator"
import prompts from "./prompts.js"
import { lookForParentUI5ProjectAndPrompt } from "../helpers.js"

export default class extends Generator {
	static displayName = "Create a new xml view for an existing uimodule."

	async prompting() {
		await lookForParentUI5ProjectAndPrompt.call(this, prompts)
	}

	async writing() {
		this.log(chalk.green(`✨ creating new custom control for ${this.options.config.uimodule}`))

		const webappPath = `${this.options.config.uimodule}/webapp`

		this.fs.copyTpl(
			this.templatePath("customControl.js"),
			this.destinationPath(`${webappPath}/control/${this.options.config.controlName}.js`),
			{
				superControl: this.options.config.superControl,
				uimodule: this.options.config.uimodule,
				controlName: this.options.config.controlName
			}
		)

	}

}
