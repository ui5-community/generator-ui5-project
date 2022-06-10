const path = require("path");
const Generator = require("yeoman-generator");
const fpmWriter = require("@sap-ux/fe-fpm-writer");
const serviceWriter = require("@sap-ux/odata-service-writer");
const axios = require("@sap-ux/axios-extension");
const utils = require("../utils");

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
                default: 'https://iccsrm.sap.com:44300/sap/opu/odata4/iwbep/v4_sample/default/iwbep/v4_gw_sample_basic/0001',
                validate: utils.validatHttpUrl
            }])).serviceUrl;
        
            const url = new URL(this.answers.serviceUrl);
            this.answers.host = url.origin;
            this.answers.path = url.pathname;
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
                    if (error.cause.status === 401) {
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
                validate: utils.validateAlhpaNumericStartingWithLetter,
                default: "Product"
            })).mainEntity;
        }

        this.config.set(this.answers);
    }

    writing() {
        const target = this.destinationPath(this.options.modulename || this.answers.moduleName || '');
        if (this.answers.metadata) {
            serviceWriter.generate(target, {
                url: this.answers.host,
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