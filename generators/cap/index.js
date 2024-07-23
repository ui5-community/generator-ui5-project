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
		// go with the defaults (no auth required in dev)
		delete packageJson["cds"]
		if (!packageJson["devDependencies"]) packageJson["devDependencies"] = {}
		packageJson["devDependencies"]["@sap/cds-dk"] = dependencies["@sap/cds-dk"]
		packageJson["devDependencies"]["cds-plugin-ui5"] = dependencies["cds-plugin-ui5"]
		packageJson["devDependencies"][this.options.config.uimoduleName] = `../${this.options.config.uimoduleName}`
		packageJson["scripts"]["dev"] = "cds watch"
		packageJson["scripts"]["build"] = "cds build --production"
		fs.writeFileSync(this.destinationPath(`${this.options.config.moduleName}/package.json`), JSON.stringify(packageJson, null, 4))

		// TO-DO: check whether target platform is approuter and connect srv-api by adding route to xs-app.json, redirect uri to xs-security.json, destination to mta.yaml
		//   - name: com.myorg.myui5project-destination-service
		// type: org.cloudfoundry.managed-service
		// requires:
		//   - name: srv-api
		// parameters:
		//   service: destination
		//   service-name: com.myorg.myui5project-destination-service
		//   service-plan: lite
		//   config:
		//     init_data:
		//       instance:
		//         existing_destinations_policy: update
		//         destinations:
		//           - Name: srv-api
		//             Authentication: NoAuthentication
		//             ProxyType: Internet
		//             Type: HTTP
		//             URL: ~{srv-api/srv-url}
		//             HTML5.DynamicDestination: true
		//             HTML5.ForwardAuthToken: true

		// use generated mta.yaml from "cds init" to enrich root mta.yaml
		const moduleMtaYaml = yaml.parse(fs.readFileSync(this.destinationPath(`${this.options.config.moduleName}/mta.yaml`)).toString())
		const srv = moduleMtaYaml.modules.find(module => module.name === `${this.options.config.moduleName}-srv`)
		srv.path = this.options.config.moduleName + "/" + srv.path
		const deployer = moduleMtaYaml.modules.find(module => module.name === `${this.options.config.moduleName}-postgres-deployer`)
		deployer.path = this.options.config.moduleName + "/" + deployer.path
		const auth = moduleMtaYaml.resources.find(resource => resource.name === `${this.options.config.moduleName}-auth`)
		auth.parameters.path = this.options.config.moduleName + "/xs-security.json"
		const postgres = moduleMtaYaml.resources.find(resource => resource.name === `${this.options.config.moduleName}-postgres`)
		const rootMtaYaml = yaml.parse(fs.readFileSync(this.destinationPath("mta.yaml")).toString())
		rootMtaYaml.modules.push(srv)
		rootMtaYaml.modules.push(deployer)
		if (!rootMtaYaml.resources) rootMtaYaml.resources = []
		rootMtaYaml.resources.push(postgres)
		rootMtaYaml.resources.push(auth)
		fs.unlinkSync(this.destinationPath(`${this.options.config.moduleName}/mta.yaml`))
		this.writeDestination(this.destinationPath("mta.yaml"), yaml.stringify(rootMtaYaml))
	}

}
