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

		// mta is not an option in the prompts, but it is required for the root mta.yaml
		const capCapabilities = [...this.options.config.capCapabilities, 'mta']

		// TO-DO: check for typescript and configure cap project accordingly
		this.spawnCommandSync("cds", ["init", `${this.options.config.capName}`, "--add", capCapabilities.join(",")],
		// this.spawnCommandSync("npx", ["-p", "@sap/cds-dk", "cds", "init", `${this.options.config.capName}`, "--add", capCapabilities.join(",")],
			this.destinationPath()
		)

		addModuleToNPMWorkspaces.call(this, this.options.config.capName)
	}

	async install() {
		fs.rmdirSync(this.destinationPath(`${this.options.config.capName}/app`))

		const packageJson = JSON.parse(fs.readFileSync(this.destinationPath(`${this.options.config.capName}/package.json`)))
		delete packageJson["cds"] // go with the cds defaults (no auth required at dev time)
		if (!packageJson["devDependencies"]) packageJson["devDependencies"] = {}
		packageJson["devDependencies"]["@sap/cds-dk"] = dependencies["@sap/cds-dk"]
		packageJson["devDependencies"]["cds-plugin-ui5"] = dependencies["cds-plugin-ui5"]
		packageJson["devDependencies"][this.options.config.uimoduleName] = `../${this.options.config.uimoduleName}`
		packageJson["scripts"]["dev"] = "cds watch"
		packageJson["scripts"]["build"] = "cds build --production"
		fs.writeFileSync(this.destinationPath(`${this.options.config.capName}/package.json`), JSON.stringify(packageJson, null, 4))

		// use parts of generated mta.yaml from "cds init" to enrich root mta.yaml
		const capMtaYaml = yaml.parse(fs.readFileSync(this.destinationPath(`${this.options.config.capName}/mta.yaml`)).toString())
		const rootMtaYaml = yaml.parse(fs.readFileSync(this.destinationPath("mta.yaml")).toString())
		if (!rootMtaYaml.resources) rootMtaYaml.resources = []

		const authName = `${this.options.config.projectId}-auth`
		const xsuaaCapability = this.options.config.capCapabilities.includes("xsuaa")
		// use auth and xs-security.json from cap module
		if (xsuaaCapability && ["Static webserver", "Application Router"].includes(this.options.config.platform)) {
			const capAuth = capMtaYaml.resources.find(resource => resource.name === `${this.options.config.capName}-auth`)
			capAuth.name = authName
			capAuth.parameters.path = `${this.options.config.capName}/xs-security.json`
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
		else if (xsuaaCapability && ["Application Frontend Service", "SAP HTML5 Application Repository Service", "SAP Build Work Zone, standard edition"].includes(this.options.config.platform)) {
			fs.rename(this.destinationPath("xs-security.json"), `${this.options.config.capName}/xs-security.json`, err => { })
			const rootAuth = rootMtaYaml.resources.find(resource => resource.name === authName)
			rootAuth.parameters.path = `${this.options.config.capName}/xs-security.json`
		}

		const postgresCapability = this.options.config.capCapabilities.includes("postgres")
		let capPostgres = null
		if(postgresCapability) {
			capPostgres = capMtaYaml.resources.find(resource => resource.name === `${this.options.config.capName}-postgres`)
			capPostgres.name = `${this.options.config.projectId}-${capPostgres.name}`
			rootMtaYaml.resources.push(capPostgres)
		

			const capDeployer = capMtaYaml.modules.find(module => module.name === `${this.options.config.capName}-postgres-deployer`)
			capDeployer.path = this.options.config.capName + "/" + capDeployer.path
			capDeployer.name = `${this.options.config.projectId}-${capDeployer.name}`
			capDeployer.requires = [
				{ name: capPostgres.name }
			]
			rootMtaYaml.modules.push(capDeployer)
		}

		const hanaCapability = this.options.config.capCapabilities.includes("hana")
		let capHana = null
		if(hanaCapability) {
			capHana = capMtaYaml.resources.find(resource => resource.name === `${this.options.config.capName}-db`)
			capHana.name = `${this.options.config.projectId}-${capHana.name}`
			rootMtaYaml.resources.push(capHana)
		

			const capDeployer = capMtaYaml.modules.find(module => module.name === `${this.options.config.capName}-db-deployer`)
			capDeployer.path = this.options.config.capName + "/" + capDeployer.path
			capDeployer.name = `${this.options.config.projectId}-${capDeployer.name}`
			capDeployer.requires = [
				{ name: capHana.name }
			]
			rootMtaYaml.modules.push(capDeployer)
		}
	
		const capSrv = capMtaYaml.modules.find(module => module.name === `${this.options.config.capName}-srv`)
		capSrv.path = `${this.options.config.capName}/${capSrv.path}`;
		capSrv.name = `${this.options.config.projectId}-${capSrv.name}`
		capSrv.requires = capSrv.requires ?? []
		if (xsuaaCapability) {
			const xsuaaDependency = capSrv.requires.find(dependency => dependency.name === `${this.options.config.capName}-auth`)
			if(xsuaaDependency) {
				xsuaaDependency.name = authName
			} else {
				capSrv.requires.push({ name: authName })
			}
		}
		if (postgresCapability) {
			const postgresServiceName = `${this.options.config.capName}-postgres`
			const postgresDependency = capSrv.requires.find(dependency => dependency.name === postgresServiceName)
			if(postgresDependency) {
				postgresDependency.name = capPostgres.name
			} else {
				capSrv.requires.push({ name: `${this.options.config.projectId}-${capPostgres.name}` })
			}
		}
	
		rootMtaYaml.modules.push(capSrv)

		fs.unlinkSync(this.destinationPath(`${this.options.config.capName}/mta.yaml`))
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
						setupRouteAndDest: ["Application Router", "Application Frontend Service", "SAP HTML5 Application Repository Service", "SAP Build Work Zone, standard edition"].includes(this.options.config.platform),
						destName: this.options.config.capName
					}

				}
			)
		}
	}
}
