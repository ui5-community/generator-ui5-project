const Generator = require("yeoman-generator");
const ui5Writer = require("@sap-ux/ui5-application-writer");
const fpmWriter = require("@sap-ux/fe-fpm-writer");
const serviceWriter = require("@sap-ux/odata-service-writer");
const axios = require("@sap-ux/axios-extension");

module.exports = class extends Generator {
    static displayName = "Create a new Fiori element flexible program model project";

    async prompting() {
        this.answers = await this.prompt([
            {
                type: "input",
                name: "projectname",
                message: "How do you want to name this project?",
                validate: (s) => {
                    if (/^\d*[a-zA-Z][a-zA-Z0-9]*$/g.test(s)) {
                        return true;
                    }
                    return "Please use alpha numeric characters only for the project name.";
                },
                default: "myUI5App"
            },
            {
                type: "input",
                name: "namespaceUI5",
                message: "Which namespace do you want to use?",
                validate: (s) => {
                    if (/^[a-zA-Z0-9_\.]*$/g.test(s)) {
                        return true;
                    }
                    return "Please use alpha numeric characters and dots only for the namespace.";
                },
                default: "com.myorg"
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
            }, {
                type: 'input',
                name: 'url',
                message: 'Service url',
                default: 'https://sapes5.sapdevcenter.com/sap/opu/odata/sap/SEPMRA_PROD_MAN',
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
                    generator.log.error(error.cause.statusText);
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
    }

    async writing() {
        this.destinationRoot(this.answers.projectname);
        ui5Writer.generate(this.destinationRoot(), {
            app: {
                id: this.answers.projectname
            },
            package: {
                name: `${this.answers.namespaceUI5}.${this.answers.projectname}`
            }
        }, this.fs);
        fpmWriter.enableFPM(this.destinationRoot(), {
            replaceAppComponent: true
        }, this.fs);
        serviceWriter.generate(this.destinationRoot(), {
            url: this.answers.host,
            path: this.answers.path,
            version: serviceWriter.OdataVersion.v4,
            metadata: this.answers.metadata
        }, this.fs);
        fpmWriter.generateCustomPage(
            this.destinationRoot(),
            {
                name: this.answers.viewname,
                entity: 'FakeEntity'
            },
            this.fs
        );
    }
}