const path = require("path");
const Generator = require("yeoman-generator");
const fpmWriter = require("@sap-ux/fe-fpm-writer");
const serviceWriter = require("@sap-ux/odata-service-writer");
const UI5Config = require("@sap-ux/ui5-config").UI5Config;
const axios = require("@sap-ux/axios-extension");
const utils = require("../utils");
const { join } = require("path");

module.exports = class extends Generator {
    static displayName = "Enables the Fiori elements flexible program model";

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
                type: "input",
                name: "viewName",
                message: "What is the name of the page view?",
                validate: utils.validateAlhpaNumericStartingWithLetter,
                default: 'Main'
            },
            
        ]);

        const manifest = this.fs.readJSON(this.destinationPath(this.answers.moduleName || this.options.modulename, 'webapp', 'manifest.json'));
        if (!manifest) {
            this.answers.serviceUrl = (await this.prompt([{
                type: 'input',
                name: 'serviceUrl',
                message: 'What is the url of the main service?',
                validate: utils.validatHttpUrl
            }])).serviceUrl;
        
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
                    if (error.cayse && error.cause.status === 401) {
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
    
            this.answers.mainEntity = (await this.prompt({
                type: "input",
                name: "mainEntity",
                message: "What entity should be used for the new page?",
                validate: utils.validateAlhpaNumericStartingWithLetter
            })).mainEntity;
        }

        this.config.set(this.answers);
    }

    async writing() {
        const target = this.destinationPath(this.options.modulename || this.answers.moduleName || '');
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
                metadata: this.answers.metadata
            }, this.fs);
        }
        fpmWriter.generateCustomPage(target, {
            name: this.answers.viewName,
            entity: this.answers.mainEntity
        }, this.fs);
    }
}