import dependencies from "../dependencies.js"
import { ensureCorrectDestinationPath } from "../helpers.js"
import fs from "fs"
import Generator from "yeoman-generator"
import yaml from "yaml"

export default class extends Generator {
	writing() {
		ensureCorrectDestinationPath.call(this)

		const uimodulePackageJson = JSON.parse(fs.readFileSync(this.destinationPath("package.json")))
		const manifestJSON = JSON.parse(fs.readFileSync(this.destinationPath("webapp/manifest.json")))
		const ui5Yaml = yaml.parse(fs.readFileSync(this.destinationPath("ui5.yaml")).toString())

		delete uimodulePackageJson.scripts["deploy"]
		delete uimodulePackageJson.scripts["deploy-config"]

		// we do have a .gitignore at root level
		fs.unlinkSync(this.destinationPath(".gitignore"))

		switch (this.options.config.platform) {
			case "Static webserver":
				uimodulePackageJson.scripts["build"] = `ui5 build --config=ui5.yaml --clean-dest --dest ../dist/${this.options.config.uimoduleName}`
				break

			case "Application Router":
				uimodulePackageJson.scripts["build"] = `ui5 build --config=ui5.yaml --clean-dest --dest ../approuter/dist/${this.options.config.uimoduleName}`
				break

			case "SAP HTML5 Application Repository Service":
			case "SAP Build Work Zone, standard edition":
				uimodulePackageJson.scripts["build"] = "ui5 build --config=ui5.yaml --clean-dest --dest dist"
				uimodulePackageJson.devDependencies["ui5-task-zipper"] = dependencies["ui5-task-zipper"]

				if (!ui5Yaml.builder) ui5Yaml.builder = {}
				if (!ui5Yaml.builder.customTasks) ui5Yaml.builder.customTasks = []
				ui5Yaml.builder.customTasks.push(
					{
						name: "ui5-task-zipper",
						afterTask: "generateVersionInfo",
						configuration: {
							onlyZip: true,
							archiveName: `${this.options.config.uimoduleName}-content`
						}
					}
				)

				const rootMtaYaml = yaml.parse(fs.readFileSync(this.destinationPath("../mta.yaml")).toString())
				rootMtaYaml.modules.forEach(module => {
					if (module.name === `${this.options.config.projectId}-ui-deployer`) {
						module["build-parameters"]["requires"].push({
							"artifacts": [
								`dist/${this.options.config.uimoduleName}-content.zip`
							],
							"name": this.options.config.uimoduleName,
							"target-path": "resources/"
						})
					}
				})
				rootMtaYaml.modules.push({
					"name": this.options.config.uimoduleName,
					"type": "html5",
					"path": this.options.config.uimoduleName,
					"build-parameters": {
						"supported-platforms": []
					}
				})
				fs.writeFileSync(this.destinationPath("../mta.yaml"), yaml.stringify(rootMtaYaml))
				break

			case "SAP NetWeaver":
				uimodulePackageJson.scripts["build"] = `ui5 build --config=ui5.yaml`
				uimodulePackageJson.scripts["deploy"] = `npm run build && fiori deploy --config ui5-deploy.yaml && rimraf archive.zip`
				uimodulePackageJson.devDependencies["rimraf"] = dependencies["rimraf"]

				const ui5DeployYaml = {
					specVersion: "3.1",
					metadata: {
						name: this.options.config.uimoduleName
					},
					type: "application",
					builder: {
						resources: {
							excludes: [
								"/test/**",
								"/localService/**"
							]
						},
						customTasks: [
							{
								name: "deploy-to-abap",
								afterTask: "replaceVersion",
								configuration: {
									target: {
										url: "https://<my-server>:<my-port>",
										client: 200,
										auth: "basic"
									},
									credentials: {
										username: "env:myUser",
										password: "env:myPassword"
									},
									app: {
										name: this.options.config.uimoduleName,
										description: "Generated with easy-ui5",
										package: "<my-package>",
										transport: "<my-transport>",
									},
									exlude: [
										"/test/"
									]
								}
							}
						]
					}
				}

				fs.writeFileSync(this.destinationPath("ui5-deploy.yaml"), yaml.stringify(ui5DeployYaml))
				const env = "myUser=<my-user>\nmyPassword=<my-password>"
				fs.writeFileSync(this.destinationPath(".env"), env)
				break
		}

		if (this.options.config.platform === "SAP Build Work Zone, standard edition") {
			// add launchpad navigation
			manifestJSON["sap.app"]["crossNavigation"] = {
				"inbounds": {
					"intent1": {
						"signature": {
							"parameters": {},
							"additionalParameters": "allowed"
						},
						"semanticObject": "webapp",
						"action": "display",
						"title": this.options.config.tileName,
						"icon": "sap-icon://add"
					}
				}
			}
			manifestJSON["sap.cloud"] = {
				"public": true,
				"service": "basic.service"
			}

			ui5Yaml.server.customMiddleware.push(
				{
					name: "preview-middleware",
					afterMiddleware: "compression",
					configuration: {
						flp: {
							path: "/test/flpSandbox.html"
						}
					}

				}
			)
			uimodulePackageJson.scripts["start-flp"] = "fiori run --open test/flpSandbox.html"
		}

		// freestyle app template includes launchpad, which we don't need as we use the preview-middleware if needed
		if (!this.options.config.enableFPM) {
			fs.unlinkSync(this.destinationPath("webapp/test/flpSandbox.html"))
			fs.unlinkSync(this.destinationPath("webapp/test/locate-reuse-libs.js"))
			uimodulePackageJson.scripts["start"] = "fiori run --open index.html"
			delete uimodulePackageJson.scripts["start-noflp"]
		}

		fs.writeFileSync(this.destinationPath("package.json"), JSON.stringify(uimodulePackageJson, null, 4))
		fs.writeFileSync(this.destinationPath("webapp/manifest.json"), JSON.stringify(manifestJSON, null, 4))
		fs.writeFileSync(this.destinationPath("ui5.yaml"), yaml.stringify(ui5Yaml))
	}
}
