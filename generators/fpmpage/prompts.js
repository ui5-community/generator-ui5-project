import axios from "@sap-ux/axios-extension"
import fs from "fs"
import {
	validateAlphaNumeric,
	validateAlphaNumericStartingWithLetterNonEmpty,
	validateUrl
} from "../helpers.js"

export default async function prompts() {
	const manifestPath = `${this.options.config.uimoduleName}/webapp/manifest.json`
	const manifestJSON = JSON.parse(fs.readFileSync(this.destinationPath(manifestPath)))

	if (!manifestJSON["sap.ui5"]["models"][""]) {
		this.options.config.serviceUrl = (await this.prompt({
			type: "input",
			name: "serviceUrl",
			message: "What is the URL of your main service?",
			validate: validateUrl
		})).serviceUrl

		const serviceUrl = new URL(this.options.config.serviceUrl)
		this.options.config.host = serviceUrl.origin
		this.options.config.path = serviceUrl.pathname
		if (serviceUrl.searchParams.has("sap-client")) {
			this.options.config.client = serviceUrl.searchParams.get("sap-client")
		}
		const service = axios.createServiceForUrl(serviceUrl, {
			ignoreCertErrors: true
		})

		while (!this.options.config.metadata) {
			try {
				this.options.config.metadata = await service.metadata()
			} catch (error) {
				if (service.defaults?.auth?.username) {
					this.log.error(error.cause.statusText)
				}
				if (error.cause && error.cause.status === 401) {
					const { username, password } = await this.prompt([
						{
							type: "input",
							name: "username",
							message: "Username",
							validate: Boolean
						},
						{
							type: "password",
							name: "password",
							message: "Password",
							validate: Boolean
						}
					])
					service.defaults.auth = {
						username,
						password
					}
				} else {
					throw error
				}
			}
		}

	}

	const pageOptions = [
		{ value: "custom", name: "Custom Page", },
		{ value: "list report", name: "List Report" },
	]
	const listReportExists = JSON.stringify(manifestJSON["sap.ui5"]["routing"]["targets"]).includes("sap.fe.templates.ListReport")
	if (listReportExists) {
		pageOptions.push({ value: "object", name: "Object Page" }
		)
	}
	this.options.config.pageType = (await this.prompt({
		type: "list",
		name: "pageType",
		message: "What type of page do you want to add?",
		choices: pageOptions,
		default: "custom"
	})).pageType

	const targets = manifestJSON["sap.ui5"]?.["routing"]?.["targets"]
	this.options.config.navigationSourcePage = (await this.prompt({
		type: "list",
		name: "navigationSourcePage",
		message: "From what page do you want to navigate to your new page?",
		choices: Object.keys(targets),
		when: Object.keys(targets).length > 0
	})).navigationSourcePage

	this.options.config.mainEntity = (await this.prompt({
		type: "input",
		name: "mainEntity",
		message: "What entity should be used for the new page?",
		validate: validateAlphaNumeric
	})).mainEntity

	this.options.config.viewName = (await this.prompt({
		type: "input",
		name: "viewName",
		message: "How do you want to name your custom page view?",
		validate: validateAlphaNumericStartingWithLetterNonEmpty,
		when: this.options.config.pageType === "custom",
		default: "Main"
	})).viewName

}
