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

	this.options.config.modelType = (await this.prompt({
		type: "list",
		name: "modelType",
		message: "Which type of model do you want to add?",
		choices: ["OData v4", "OData v2", "JSON"],
		default: "OData v4"
	})).modelType

	this.options.config.modelUrl = (await this.prompt({
		type: "input",
		name: "modelUrl",
		message: "What is the data source url of your service?",
		when: this.options.config.modelType.includes("OData"),
		validate: validateUrl
	})).modelUrl

	this.options.config.setupProxy = (await this.prompt({
		type: "confirm",
		name: "setupProxy",
		message: "Do you want to set up a proxy for the new model?",
		when: this.options.config.modelType.includes("OData")
	})).setupProxy

}
