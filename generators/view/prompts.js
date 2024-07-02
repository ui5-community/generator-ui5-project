import { validateAlphaNumericStartingWithLetterNonEmpty } from "../helpers.js"

export default async function prompts() {

	this.options.config.viewName = (await this.prompt({
		type: "input",
		name: "viewName",
		message: "How do you want to name your new view?",
		validate: validateAlphaNumericStartingWithLetterNonEmpty
	})).viewName

	this.options.config.setupController = (await this.prompt({
		type: "confirm",
		name: "setupController",
		message: "Do you want to set up a JavaScript controller for your new view?"
	})).setupController

	this.options.config.setupRouteTarget = (await this.prompt({
		type: "confirm",
		name: "setupRouteTarget",
		message: "Do you want to set up a route and target for your new view?"
	})).setupRouteTarget

}
