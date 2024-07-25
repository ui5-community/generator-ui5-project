import {
	validateAlphaNumeric,
	validateUrl
} from "../helpers.js"

export default async function prompts() {

	this.options.config.modelName = (await this.prompt({
		type: "input",
		name: "modelName",
		message: "How do you want to name your new model? (Press enter for default model.)",
		validate: validateAlphaNumeric,
		default: ""
	})).modelName

	if (!this.options.config.modelType) {
		this.options.config.modelType = (await this.prompt({
			type: "list",
			name: "modelType",
			message: "Which type of model do you want to add?",
			choices: ["OData v4", "OData v2", "JSON"],
			default: "OData v4"
		})).modelType
	}

	if (!this.options.config.modelUrl) {
		this.options.config.modelUrl = (await this.prompt({
			type: "input",
			name: "modelUrl",
			message: "What is the data source url of your service?",
			when: this.options.config.modelType.includes("OData"),
			validate: validateUrl
		})).modelUrl
	}

	if (!this.options.config.setupProxy) {
		this.options.config.setupProxy = (await this.prompt({
			type: "confirm",
			name: "setupProxy",
			message: "Do you want to set up a proxy for the new model?",
			when: this.options.config.modelType.includes("OData")
		})).setupProxy
	}

	if (!this.options.config.setupRouteAndDest) {
		if (["Application Router", "SAP HTML5 Application Repository", "SAP Build Work Zone, standard edition"].includes(this.options.config.platform)) {
			this.options.config.setupRouteAndDest = (await this.prompt({
				type: "confirm",
				name: "setupRouteAndDest",
				message: "Do you want to set up a route (xs-app.json) and destination for your new model?",
				when: this.options.config.setUpProxy
			})).setupRouteAndDest
		}
	}

	if (!this.options.config.destName) {
		this.options.config.destName = (await this.prompt({
			type: "input",
			name: "destName",
			message: "How do you want to name your new destination?",
			when: this.options.config.setupRouteAndDest,
			validate: validateAlphaNumeric
		})).destName
	}
}
