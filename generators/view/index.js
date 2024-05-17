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
		this.log(`creating new view for ${this.options.config.uimodule}`)

		const webappPath = `${this.options.config.uimodule}/webapp`

		let controllerName
		if (this.options.config.setupController) {
			controllerName = `controllerName="${this.options.config.uimodule}.controller.${this.options.config.viewName}"`

			this.fs.copyTpl(
				this.templatePath("Controller.controller.js"),
				this.destinationPath(`${webappPath}/controller/${this.options.config.viewName}.controller.js`),
				{
					uimodule: this.options.config.uimodule,
					viewName: this.options.config.viewName
				}
			)
		}

		this.fs.copyTpl(
			this.templatePath("View.view.xml"),
			this.destinationPath(`${webappPath}/view/${this.options.config.viewName}.view.xml`),
			{
				controller: controllerName || "",
				viewName: this.options.config.viewName
			}
		)

		if (this.options.config.setupRouteTarget) {
			const newRoute = {
				name: `Route${this.options.config.viewName}`,
				pattern: this.options.config.viewName.toLowerCase(),
				target: [
					`Target${this.options.config.viewName}`
				]
			}
			const newTarget = {
				viewType: "XML",
				transition: "Slide",
				clearControlAggregation: false,
				viewId: this.options.config.viewName,
				viewName: this.options.config.viewName
			}

			const manifestPath = `${this.options.config.uimodule}/webapp/manifest.json`
			const manifestJSON = JSON.parse(fs.readFileSync(this.destinationPath(manifestPath)))
			manifestJSON["sap.ui5"]["routing"]["routes"].push(newRoute)
			manifestJSON["sap.ui5"]["routing"]["targets"][`Target${this.options.config.viewName}`] = newTarget

			// use native yeoman methods for this subgenerator as this prompts the user before overwriting
			this.writeDestinationJSON(this.destinationPath(manifestPath), manifestJSON, null, 4)
		}

	}

}
