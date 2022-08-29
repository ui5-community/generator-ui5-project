const path = require("path");
const Generator = require("yeoman-generator");
const fpmWriter = require("@sap-ux/fe-fpm-writer");
const serviceWriter = require("@sap-ux/odata-service-writer");
const UI5Config = require("@sap-ux/ui5-config").UI5Config;
const axios = require("@sap-ux/axios-extension");
const utils = require("../utils");
const { join } = require("path");

module.exports = class extends Generator {
    static displayName = "Add a page to a Fiori elements FPM application";

    async prompting() {
        const modules = this.config.get("uimodules");
        
        this.answers = await this.prompt([
            {
                type: "list",
                name: "moduleName",
                message: "To which module do you want add a custom FPM page?",
                choices: modules,
                when: utils.isArrayWithMoreThanOneElement(modules)
            },
            {
                type: "list",
                name: "pageType",
                message: "What type of page should be use for the main page?",
                choices: [
                    { value: "custom", name: "Custom Page",  }, 
                    { value: "list", name: "List Report" }, 
                    { value: "object", name: "Object Page" }],
                default: "custom"
            }
        ]);

        if (this.answers.pageType === 'custom') {
            this.answers.viewName = (await this.prompt({
                type: "input",
                name: "viewName",
                message: "What is the name of the page view?",
                validate: utils.validateAlhpaNumericStartingWithLetter,
                default: 'Main'
            })).viewName;
        }

        // only ask for service etc. if called as part of the fpm enablement on app
        const manifest = this.fs.readJSON(this.destinationPath(this.answers.moduleName || this.options.modulename || 'uimodule', 'webapp', 'manifest.json')); 
        if (this.config.get("enableFPM") && !manifest) {
            this.answers.serviceUrl = (await this.prompt({
                type: 'input',
                name: 'serviceUrl',
                message: 'What is the url of the main service?',
                validate: utils.validatHttpUrl
            })).serviceUrl;
        
            const url = new URL(this.answers.serviceUrl);
            this.answers.host = url.origin;
            this.answers.path = url.pathname;
            if (url.searchParams.has('sap-client')) {
                this.answers.client = url.searchParams.get('sap-client');
            }
            const service = axios.createServiceForUrl(this.answers.serviceUrl, {
                ignoreCertErrors: true
            });
    
            while (!this.answers.metadata) {
                try {
                    this.answers.metadata = await service.metadata();
                } catch (error) {
                    if (service.defaults?.auth?.username) {
                        this.log.error(error.cause.statusText);
                    }
                    if (error.cause && error.cause.status === 401) {
                        const { username, password } = await this.prompt([
                            {
                                type: 'input',
                                name: 'username',
                                message: 'Username',
                                validate: Boolean
                            },
                            {
                                type: 'password',
                                name: 'password',
                                message: 'Password',
                                validate: Boolean
                            }
                        ]);
                        service.defaults.auth = {
                            username,
                            password
                        };
                    } else {
                        throw error;
                    }
                }
            }
        } else {   
            const targets = manifest[ "sap.ui5"]?.["routing"]?.["targets"];
            if (targets) {
                this.answers.navigation = await this.prompt({
                    type: "list",
                    name: "sourcePage",
                    message: "From what page do you want to navigate?",
                    choices: Object.keys(targets)
                });
            } else {
                this.answers.navigation = {};
            }
            this.answers.navigation.navKey = this.answers.pageType !== 'list';
        }
        
        this.answers.mainEntity = (await this.prompt({
            type: "input",
            name: "mainEntity",
            message: "What entity should be used for the new page?",
            validate: utils.validateAlhpaNumericStartingWithLetter
        })).mainEntity;

        // assign entity to navigation object if it was created
        if (this.answers.navigation) {
            this.answers.navigation.navEntity = this.answers.mainEntity;
        }

        this.config.set(this.answers);
    }

    async writing() {
        const target = this.destinationPath(this.options.modulename || this.answers.moduleName || 'uimodule');
        if (this.answers.metadata) {
            // add fiori-tools-proxy 
            const ui5Yaml = await UI5Config.newInstance(this.fs.read(join(target, 'ui5.yaml')));
            ui5Yaml.addFioriToolsProxydMiddleware({ });
            this.fs.write(join(target, 'ui5.yaml'), ui5Yaml.toString());
            // add the service to manifest and ui5.yaml
            await serviceWriter.generate(target, {
                url: this.answers.host,
                client: this.answers.client,
                path: this.answers.path,
                version: serviceWriter.OdataVersion.v4,
                metadata: this.answers.metadata,
                localAnnotationsName: "annotation"
            }, this.fs);
        }
        switch (this.answers.pageType) {
            case 'object':
                fpmWriter.generateObjectPage(target, { entity: this.answers.mainEntity, navigation: this.answers.navigation }, this.fs);
                break;
            case 'list': 
                fpmWriter.generateListReport(target, { entity: this.answers.mainEntity }, this.fs);
                break;
            default:
                fpmWriter.generateCustomPage(target, {
                    name: this.answers.viewName,
                    entity: this.answers.mainEntity,
                    navigation: this.answers.navigation,
                    typescript: this.options.enableTypescript
                }, this.fs);
                break;
        }

    }
}