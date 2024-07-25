import chalk from "chalk"
import fs from "fs"
import Generator from "yeoman-generator"
import prompts from "./prompts.js"
import {
	lookForParentUI5ProjectAndPrompt,
	addModuleToNPMWorkspaces
} from "../helpers.js"
import dependencies from "../dependencies.js"
import yaml from "yaml"

import ModelGenerator from "../model/index.js"
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)

export default class extends Generator {
	static displayName = "Create a new SAP CAP module within an existing OpenUI5/SAPUI5 project"

	async prompting() {
		if (this.config.get("platform") === "SAP NetWeaver") {
			this.log(chalk.red("This subgenerator cannot be run if your target deployment platform is SAP NetWeaver."))
			this.cancelCancellableTasks()
			return
		}
		await lookForParentUI5ProjectAndPrompt.call(this, prompts, true, "Which existing uimodule would you like to connect with your new SAP CAP module?")
	}

	async writing() {
		this.log(chalk.green(`✨ creating new SAP CAP module for ${this.options.config.projectName}`))

		// TO-DO: check for typescript and configure cap project accordingly
		this.spawnCommandSync("npx", ["-p", "@sap/cds-dk", "cds", "init", `${this.options.config.moduleName}`, "--add", "tiny-sample, data, xsuaa, mta, postgres"],
			this.destinationPath()
		)

		addModuleToNPMWorkspaces.call(this, this.options.config.moduleName)
	}

	async install() {
		fs.rmdirSync(this.destinationPath(`${this.options.config.moduleName}/app`))

		const packageJson = JSON.parse(fs.readFileSync(this.destinationPath(`${this.options.config.moduleName}/package.json`)))
		delete packageJson["cds"] // go with the cds defaults (no auth required at dev time)
		if (!packageJson["devDependencies"]) packageJson["devDependencies"] = {}
		packageJson["devDependencies"]["@sap/cds-dk"] = dependencies["@sap/cds-dk"]
		packageJson["devDependencies"]["cds-plugin-ui5"] = dependencies["cds-plugin-ui5"]
		packageJson["devDependencies"][this.options.config.uimoduleName] = `../${this.options.config.uimoduleName}`
		packageJson["scripts"]["dev"] = "cds watch"
		packageJson["scripts"]["build"] = "cds build --production"
		fs.writeFileSync(this.destinationPath(`${this.options.config.moduleName}/package.json`), JSON.stringify(packageJson, null, 4))

		// use parts of generated mta.yaml from "cds init" to enrich root mta.yaml
		const capMtaYaml = yaml.parse(fs.readFileSync(this.destinationPath(`${this.options.config.moduleName}/mta.yaml`)).toString())
		const rootMtaYaml = yaml.parse(fs.readFileSync(this.destinationPath("mta.yaml")).toString())
		if (!rootMtaYaml.resources) rootMtaYaml.resources = []

		const authName = `${this.options.config.projectId}-auth`
		// use auth and xs-security.json from cap module
		if (["Static webserver", "Application Router"].includes(this.options.config.platform)) {
			const capAuth = capMtaYaml.resources.find(resource => resource.name === `${this.options.config.moduleName}-auth`)
			capAuth.name = authName
			capAuth.parameters.path = `${this.options.config.moduleName}/xs-security.json`
			if (this.options.config.platform === "Application Router") {
				capAuth.parameters.config["oauth2-configuration"] = {
					"redirect-uris": ["~{approuter/callback-url}"]
				}
				if (!capAuth.requires) capAuth.requires = []
				capAuth.requires.push({ name: "approuter" })
				const approuter = rootMtaYaml.modules.find(module => module.name === `${this.options.config.projectId}-approuter`)
				if (!approuter.requires) approuter.requires = []
				approuter.requires.push({ name: capAuth.name })
			}
			rootMtaYaml.resources.push(capAuth)
		}
		// use auth and xs-security.json from root
		else if (["SAP HTML5 Application Repository", "SAP Build Work Zone, standard edition"].includes(this.options.config.platform)) {
			fs.rename(this.destinationPath("xs-security.json"), `${this.options.config.moduleName}/xs-security.json`, err => { })
			const rootAuth = rootMtaYaml.resources.find(resource => resource.name === authName)
			rootAuth.parameters.path = `${this.options.config.moduleName}/xs-security.json`
		}

		const capPostgres = capMtaYaml.resources.find(resource => resource.name === `${this.options.config.moduleName}-postgres`)
		capPostgres.name = `${this.options.config.projectId}-${capPostgres.name}`
		rootMtaYaml.resources.push(capPostgres)

		const capDeployer = capMtaYaml.modules.find(module => module.name === `${this.options.config.moduleName}-postgres-deployer`)
		capDeployer.path = this.options.config.moduleName + "/" + capDeployer.path
		capDeployer.name = `${this.options.config.projectId}-${capDeployer.name}`
		capDeployer.requires = [
			{ name: capPostgres.name }
		]
		rootMtaYaml.modules.push(capDeployer)

		const capSrv = capMtaYaml.modules.find(module => module.name === `${this.options.config.moduleName}-srv`)
		capSrv.path = this.options.config.moduleName + "/" + capSrv.path
		capSrv.name = `${this.options.config.projectId}-${capSrv.name}`
		capSrv.requires = [
			{ name: capPostgres.name },
			{ name: authName }
		]
		rootMtaYaml.modules.push(capSrv)

		fs.unlinkSync(this.destinationPath(`${this.options.config.moduleName}/mta.yaml`))
		this.writeDestination(this.destinationPath("mta.yaml"), yaml.stringify(rootMtaYaml))

		if (this.options.config.runModelSubgenerator) {
			this.composeWith(
				{
					Generator: ModelGenerator,
					path: require.resolve("../model")
				},
				{
					config: {
						projectId: this.options.config.projectId,
						uimoduleName: this.options.config.uimoduleName,
						platform: this.options.config.platform,
						modelName: "",
						modelType: "OData v4",
						modelUrl: "http://localhost:4004/odata/v4/catalog",
						setupProxy: true,
						setupRouteAndDest: ["Application Router", "SAP HTML5 Application Repository", "SAP Build Work Zone, standard edition"].includes(this.options.config.platform),
						destName: this.options.config.moduleName
					}

				}
			)
		}
	}
}
