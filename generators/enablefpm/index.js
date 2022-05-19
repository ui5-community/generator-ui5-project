const path = require("path");
const Generator = require("yeoman-generator");
const fpmWriter = require("@sap-ux/fe-fpm-writer");
const serviceWriter = require("@sap-ux/odata-service-writer");
const axios = require("@sap-ux/axios-extension");

module.exports = class extends Generator {
    static displayName = "Enables the Fiori elements flexible program model";

    async prompting() {
        const modules = this.config.get("uimodules") || [];
        this.answers = await this.prompt([
            {
                type: "list",
                name: "moduleName",
                message: "For which module do you want to enable FPM?",
                choices: modules,
                when: !!modules && modules.length > 1
            },
            {
                type: "confirm",
                name: "replaceComponent",
                message: "Do you want to replace your App Component?",
                default: false,
                when: !this.options.isSubgeneratorCall
            },
            {
                type: "input",
                name: "viewname",
                message: "What is the name of the main view?",
                validate: (s) => {
                    if (/^\d*[a-zA-Z][a-zA-Z0-9]*$/g.test(s)) {
                        return true;
                    }
                    return "Please use alpha numeric characters only for the view name.";
                },
                default: 'Main'
            }, 
            {
                type: 'input',
                name: 'url',
                message: 'What is the url of the main service?',
                default: 'https://iccsrm.sap.com:44300/sap/opu/odata4/iwbep/v4_sample/default/iwbep/v4_gw_sample_basic/0001',
                validate: (s) => !!s
            }]);

        const url = new URL(this.answers.url);
        this.answers.host = url.origin;
        this.answers.path = url.pathname;
        const service = axios.createServiceForUrl(this.answers.url, {
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
                            validate: (answer) => !!answer
                        },
                        {
                            type: 'password',
                            name: 'password',
                            message: 'Password',
                            validate: (answer) => !!answer
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
            message: "What is the entity for the main page?",
            validate: (s) => {
                if (/^\d*[a-zA-Z][a-zA-Z0-9]*$/g.test(s)) {
                    return true;
                }
                return "Please use alpha numeric characters only for the project name.";
            },
            default: "Product"
        })).mainEntity;

        this.config.set(this.answers);
    }

    writing() {
        fpmWriter.enableFPM(
            this.destinationPath(this.options.modulename || this.answers.moduleName || ''), {
                replaceAppComponent: this.options.isSubgeneratorCall || this.answers.replaceAppComponent 
            }, this.fs
        );
        serviceWriter.generate(this.destinationRoot(), {
            url: this.answers.host,
            path: this.answers.path,
            version: serviceWriter.OdataVersion.v4,
            metadata: this.answers.metadata
        }, this.fs);
    }
}