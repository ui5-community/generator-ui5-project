import chalk from "chalk"
import fs from "fs"
import Generator from "yeoman-generator"
import { lookForParentUI5ProjectAndPrompt } from "../helpers.js"
import prompts from "./prompts.js"
import yaml from "yaml"

export default class extends Generator {
	static displayName = "Create a new model for an existing uimodule."

	async prompting() {
		if (!this.options.config) {
			this.standaloneCall = true
			await lookForParentUI5ProjectAndPrompt.call(this, prompts)
		}
	}

	async writing() {
		this.log(chalk.green(`✨ creating new ${this.options.config.modelType} model for ${this.options.config.uimoduleName}`))

		const manifestPath = `${this.options.config.uimoduleName}/webapp/manifest.json`
		const manifestJSON = JSON.parse(fs.readFileSync(this.destinationPath(manifestPath)))

		const dataSource = `${this.options.config.modelName || "default"}DataSource`

		let serviceUrl
		if (this.options.config.modelUrl) {
			serviceUrl = new URL(this.options.config.modelUrl)
			serviceUrl.pathname = serviceUrl.pathname + (serviceUrl.pathname.endsWith("/") ? "" : "/")
		}

		manifestJSON["sap.ui5"]["models"][this.options.config.modelName] = {}
		if (!manifestJSON["sap.app"]["dataSources"]) {
			manifestJSON["sap.app"]["dataSources"] = {}
		}

		if (this.options.config.modelType === "JSON") {
			manifestJSON["sap.app"]["dataSources"][dataSource] = {
				uri: "<REPLACE-WITH-URI>",
				type: "JSON",
			}
			manifestJSON["sap.ui5"]["models"][this.options.config.modelName] = {
				dataSource: dataSource,
				type: "sap.ui.model.json.JSONModel"
			}
		}

		if (this.options.config.modelType === "OData v2") {
			manifestJSON["sap.app"]["dataSources"][dataSource] = {
				uri: serviceUrl.pathname,
				type: "OData",
				settings: {
					annotations: [],
					localUri: "localService/metadata.xml",
					odataVersion: "2.0"
				}
			}
			manifestJSON["sap.ui5"]["models"][this.options.config.modelName] = {
				dataSource: dataSource,
				preload: true,
				settings: {}
			}
		}

		if (this.options.config.modelType === "OData v4") {
			manifestJSON["sap.app"]["dataSources"][dataSource] = {
				uri: serviceUrl.pathname,
				type: "OData",
				settings: {
					annotations: [],
					localUri: "localService/metadata.xml",
					odataVersion: "4.0"
				}
			}
			manifestJSON["sap.ui5"]["models"][this.options.config.modelName] = {
				dataSource: dataSource,
				preload: true,
				settings: {
					synchronizationMode: "None",
					operationMode: "Server",
					autoExpandSelect: true,
					earlyRequests: true
				}
			}
		}

		this.writeDestinationJSON(this.destinationPath(manifestPath), manifestJSON, null, 4)

		// set up proxy
		if (this.options.config.modelType.includes("OData")) {
			if (this.options.config.setupProxy) {
				const ui5YamlPath = `${this.options.config.uimoduleName}/ui5.yaml`
				const ui5Yaml = yaml.parse(fs.readFileSync(this.destinationPath(ui5YamlPath)).toString())
				if (!ui5Yaml.server) {
					ui5Yaml.server = {
						customMiddleware: []
					}
				}
				const middleware = ui5Yaml.server.customMiddleware.find(m => m.name === "fiori-tools-proxy")
				if (middleware) {
					if (!middleware.configuration.backend) {
						middleware.configuration.backend = []
					}
					middleware.configuration.backend.push({
						path: serviceUrl.pathname,
						url: serviceUrl.origin
					})
				} else {
					ui5Yaml.server.customMiddleware.push({
						name: "fiori-tools-proxy",
						afterMiddleware: "compression",
						configuration: {
							backend: [
								{
									path: serviceUrl.pathname,
									url: serviceUrl.origin
								}
							]
						}
					})
				}
				this.writeDestination(this.destinationPath(ui5YamlPath), yaml.stringify(ui5Yaml))
			}
		}

		// set up route and destination
		if (this.options.config.setupRouteAndDest) {
			const rootMtaYaml = yaml.parse(fs.readFileSync(this.destinationPath("mta.yaml")).toString())
			const destination = rootMtaYaml.resources.find(resource => resource.name === `${this.options.config.projectId}-destination-service`)
			if (!destination.parameters.config) destination.parameters.config = {}
			if (!destination.parameters.config.init_data) destination.parameters.config.init_data = {}
			if (!destination.parameters.config.init_data.instance) destination.parameters.config.init_data.instance = {
				existing_destinations_policy: "update",
				destinations: []
			}
			destination.parameters.config.init_data.instance.destinations.push({
				Name: this.options.config.destName,
				Authentication: "NoAuthentication",
				ProxyType: "Internet",
				Type: "HTTP",
				URL: this.standaloneCall ? serviceUrl.origin : "~{srv-api/srv-url}",
				"HTML5.DynamicDestination": true,
				"HTML5.ForwardAuthToken": true
			})
			if (!this.standaloneCall) {
				if (!destination.requires) destination.requires = []
				destination.requires.push({ name: "srv-api" })
			}
			this.writeDestination(this.destinationPath("mta.yaml"), yaml.stringify(rootMtaYaml))

			let xsappJsonPath
			switch (this.options.config.platform) {
				case "Application Router":
					xsappJsonPath = this.destinationPath("approuter/xs-app.json")
					break

				case "SAP HTML5 Application Repository Service":
				case "SAP Build Work Zone, standard edition":
					// check if file is stored in webapp folder or project root
					const webappPath = this.destinationPath(`${this.options.config.uimoduleName}/webapp/xs-app.json`)
					if (fs.existsSync(webappPath)) {
						xsappJsonPath = webappPath
					} else {
						xsappJsonPath = this.destinationPath(`${this.options.config.uimoduleName}/xs-app.json`)
					}
					break
			}
			const xsappJson = JSON.parse(fs.readFileSync(xsappJsonPath))
			xsappJson.routes.unshift({
				source: `${serviceUrl.pathname}(.*)`,
				destination: this.options.config.destName,
				authenticationType: "none"
			})
			const wildcardRoute = xsappJson.routes.find(route => route.source === "^(.*)$")
			wildcardRoute.authenticationType = "xsuaa"
			this.writeDestinationJSON(xsappJsonPath, xsappJson, null, 4)
		}
	}
}
