import assert from "yeoman-assert";
import path from "path";
import helpers from "yeoman-test";
import nock from "nock";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generate(prompts) {
    const context = helpers.run(path.join(__dirname, "../generators/app"));
    if (process.env.DEBUG) {
        context.inDir(path.join(__dirname, 'test-output'));
    }
    context.withPrompts({
        namespaceUI5: "test",
        newdir: false,
        ...prompts
    });
    return context;
}

describe("open-ux-tools", function () {
    this.timeout(200000);

    describe("create a project using the fiori-freestyle-writer", () => {
        let context;
        before(async () => {
            context = await generate({
                projectname: "myFioriFreestylApp",
                viewtype: 'XML'
            });
        });

        after(() => {
            context && context.restore();
        });

        it("files that are not relevant for easy-ui5 are removed", () => {
            assert.noFile([
                "uimodule/package.json",
                "uimodule/ui5-local.yaml"
            ]);
        });

        it("all relevant files are generated", () => {
            assert.file([
                "uimodule/ui5.yaml",
                "uimodule/webapp/index.html",
                "uimodule/webapp/manifest.json",
                "uimodule/webapp/view/MainView.view.xml",
                "uimodule/webapp/controller/MainView.controller.js",
                "uimodule/webapp/view/App.view.xml",
                "uimodule/webapp/controller/App.controller.js"
            ]);
        });

        it("MainView contoller is extending the easy-ui5 BaseController", () => {
            assert.fileContent(
                "uimodule/webapp/controller/MainView.controller.js",
                "./BaseController"
            );
        });

        it("the flpSandbox.html is in test/ and bootstraps SAPUI5", () => {
            assert.file("uimodule/webapp/test/flpSandbox.html");
            assert.fileContent("uimodule/webapp/test/flpSandbox.html", "https://ui5.sap.com");
        });

    });

    describe("create project with the flexible programming model enabled", () => {
        const host = "http://localhost:4004";
        const service = "/travel";
        let context;
        before(async () => {
            nock.disableNetConnect();

            nock(host)
                .get(`${service}/$metadata`)
                .replyWithFile(200, path.join(__dirname, 'mock/metadata.xml'))
                .persist(true);

            context = await generate({
                projectname: "fpmTravelApp",
                enableFPM: true,
                enableTypescript: true,
                serviceUrl: `${host}${service}`,
                mainEntity: "BookedFlights",
                newdir: false
            });

        });

        after(() => {
            context && context.restore();
            nock.cleanAll();
            nock.enableNetConnect();
        });

        it("custom page and local annotation file is generated", () => {
            assert.file([
                "uimodule/webapp/ext/main/Main.view.xml",
                "uimodule/webapp/ext/main/Main.controller.ts",
                "uimodule/webapp/annotations/annotation.xml"
            ]);
        });

        it("check that fe components are used", () => {
            assert.fileContent("uimodule/webapp/manifest.json", "sap.fe.core.fpm");
            assert.fileContent("uimodule/webapp/Component.ts", "sap/fe/core/AppComponent");
        });

        it("check that Fiori tools are enabled", () => {
            assert.fileContent('package.json', 'sapux');
            assert.fileContent('package.json', '@sap/ux-specification');
        });

        it("check that typescript is configured correctly", () => {
            assert.file([
                "tsconfig.json",
                ".babelrc.json"
            ]);
            assert.fileContent('tsconfig.json', `"rootDir": "uimodule/webapp"`);
            assert.fileContent('package.json', 'ui5-tooling-transpile');
            assert.fileContent('package.json', 'ts:check');
        });
    });
});