import dependencies from "../dependencies.js"
import fs from "fs"
import Generator from "yeoman-generator"
import yaml from "yaml"

export default class extends Generator {
	writing() {
		// required when called from fpmpage subgenerator
		if (!this.destinationPath().endsWith(this.options.config.uimoduleName)) {
			this.destinationRoot(this.destinationPath(this.options.config.uimoduleName))
		}

		const ui5YamlLocal = yaml.parse(fs.readFileSync(this.destinationPath("ui5-local.yaml")).toString())
		const ui5Yaml = ui5YamlLocal

		// pick up ui5.yaml config done by other subgenerators
		// execution order of subgenerators is unfortunately not very predictable
		const oldUi5Yaml = yaml.parse(fs.readFileSync(this.destinationPath("ui5.yaml")).toString())
		if (oldUi5Yaml.builder) {
			ui5Yaml.builder = oldUi5Yaml.builder
		}

		const indexHtml = fs.readFileSync(this.destinationPath("webapp/index.html")).toString()
		const manifestJSON = JSON.parse(fs.readFileSync(this.destinationPath("webapp/manifest.json")))

		// remove fiori-tools-proxy, except when its needed for flpSandbox.html to proxy to cdn or for fpm
		if (
			this.options.config.platform !== "SAP Build Work Zone, standard edition"
			&& !this.options.config.enableFPM
		) {
			ui5Yaml.server.customMiddleware = ui5Yaml.server.customMiddleware.filter(middleware => middleware.name !== "fiori-tools-proxy")
		} else {
			ui5Yaml.server.customMiddleware.forEach(middleware => {
				if (middleware.name === "fiori-tools-proxy") {
					middleware.configuration.ui5 = {
						path: ["/resources", "/test-resources"],
						url: "https://ui5.sap.com"
					}
				}
			})

		}

		switch (this.options.config.ui5Libs) {
			case "Content delivery network (OpenUI5)":
				delete ui5Yaml.framework
				fs.writeFileSync(
					this.destinationPath("webapp/index.html"),
					indexHtml.replace(`src="resources/sap-ui-core.js"`, `src="https://sdk.openui5.org/${dependencies["OpenUI5"]}/resources/sap-ui-core.js"`)
				)
				manifestJSON["sap.ui5"]["dependencies"]["minUI5Version"] = dependencies["OpenUI5"]
				break
			case "Content delivery network (SAPUI5)":
				delete ui5Yaml.framework
				fs.writeFileSync(
					this.destinationPath("webapp/index.html"),
					indexHtml.replace(`src="resources/sap-ui-core.js"`, `src="https://ui5.sap.com/${dependencies["SAPUI5"]}/resources/sap-ui-core.js"`)
				)
				manifestJSON["sap.ui5"]["dependencies"]["minUI5Version"] = dependencies["SAPUI5"]
				break
			case "Local resources (OpenUI5)":
				ui5Yaml.framework.name = "OpenUI5"
				ui5Yaml.framework.version = dependencies["OpenUI5"]
				manifestJSON["sap.ui5"]["dependencies"]["minUI5Version"] = dependencies["OpenUI5"]
				break
			case "Local resources (SAPUI5)":
				ui5Yaml.framework.version = dependencies["SAPUI5"]
				manifestJSON["sap.ui5"]["dependencies"]["minUI5Version"] = dependencies["SAPUI5"]
				break
		}

		if (this.options.config.enableFPM) {
			ui5Yaml.framework?.libraries?.push({
				name: "sap.fe.templates"
			})
			ui5Yaml.server.customMiddleware = ui5Yaml.server.customMiddleware.filter(middleware => middleware.name !== "sap-fe-mockserver")
			const ui5YamlMock = yaml.parse(fs.readFileSync(this.destinationPath("ui5-mock.yaml")).toString())
			ui5YamlMock.framework = {
				name: "SAPUI5",
				version: dependencies["SAPUI5"],
				libraries: [
					{ name: "sap.m" },
					{ name: "sap.ui.core" },
					{ name: "themelib_sap_horizon" },
					{ name: "sap.fe.templates" }
				]
			}
			for (const file of [ui5Yaml, ui5YamlMock]) {
				file.server.customMiddleware.forEach(middleware => {
					if (middleware.name === "fiori-tools-proxy") {
						delete middleware.configuration["ui5"]
					}
				})
			}
			fs.writeFileSync(this.destinationPath("ui5-mock.yaml"), yaml.stringify(ui5YamlMock))
		}


		fs.writeFileSync(this.destinationPath("ui5.yaml"), yaml.stringify(ui5Yaml))
		fs.unlinkSync(this.destinationPath("webapp/manifest.json")) // avoid conflict/auto-prompt by yeoman
		fs.writeFileSync(this.destinationPath("webapp/manifest.json"), JSON.stringify(manifestJSON, null, 4))

		// remove option to bootstrap from local UI5 sources, as UI5 source is part of user selection
		fs.unlinkSync(this.destinationPath("ui5-local.yaml"))
		const packageJson = JSON.parse(fs.readFileSync(this.destinationPath("package.json")))
		delete packageJson.scripts["start-local"]
		fs.unlinkSync(this.destinationPath("package.json")) // avoid conflict/auto-prompt by yeoman
		fs.writeFileSync(this.destinationPath("package.json"), JSON.stringify(packageJson, null, 4))
	}
}
