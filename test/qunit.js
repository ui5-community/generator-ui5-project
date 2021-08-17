const assert = require("yeoman-assert");
const path = require("path");
const helpers = require("yeoman-test");
const execa = require("execa");

const IsCIRun = process.env.CI;

async function runGenerator(sGenerator, oPrompt) { 
    const sGeneratorPath = path.join(__dirname, '../generators/', sGenerator); 
    console.log(sGeneratorPath);   
    return helpers.run(sGeneratorPath)
        //.inDir(path.join(__dirname, sGenerator))
        .withPrompts(oPrompt);
};

describe('generator:qunit', function () {
    let path = require('path');

    it('Should create basic setup', async function () {        
        await runGenerator("qunit", { projectname: 'testproject', namespaceUI5Input: 'test.name.space', addTest: false });
        assert.fileContent("webapp/test/unit/unitTests.qunit.html", "test.name.space.testproject");
        assert.fileContent("webapp/test/unit/unitTests.qunit.js", "test/name/space/testproject/test/unit/AllTests");                        
        assert.file([
            'webapp/test/testsuite.qunit.html',
            'webapp/test/testsuite.qunit.js',
            'webapp/test/unit/AllTests.js',
            'webapp/test/unit/unitTests.qunit.html',
            'webapp/test/unit/unitTests.qunit.js'
        ]);
    });

    it('Should add no reference to SinonJS in test class ', async function () {        
        await runGenerator("qunit", { projectname: 'testproject', namespaceUI5Input: 'test.name.space', addTest: 'Y', codeUnderTest: '/folder/foo', useSinonJS: false });
        assert.noFileContent("webapp/test/unit/folder/foo.js", 'sinon"');
    });

    it('Should add reference to SinonJS in test class', async function () {        
        await runGenerator("qunit", { projectname: 'testproject', namespaceUI5Input: 'test.name.space', addTest: 'Y', codeUnderTest: '/folder/foo', useSinonJS: 'Y' });
        assert.fileContent("webapp/test/unit/folder/foo.js", 'sap/ui/thirdparty/sinon-4"');
        assert.fileContent("webapp/test/unit/folder/foo.js", 'before(');
        assert.fileContent("webapp/test/unit/folder/foo.js", 'afterEach(');
    });

    it('Should create test file if sub generator to add tests is called and refer in AllTests.js', async function () {        
        await runGenerator("qunit", { projectname: 'testproject', namespaceUI5Input: 'test.name.space', addTest: 'Y', codeUnderTest: '/folder/foo' });
        assert.file("webapp/test/unit/folder/foo.js");
        assert.fileContent("webapp/test/unit/folder/foo.js", 'test/name/space/testproject/folder/foo"');                
        assert.fileContent("webapp/test/unit/AllTests.js", '/foo"');        
    });

    it('Should not create any test files if sub generator to add tests is not called', async function () {        
        await runGenerator("qunit", { projectname: 'testproject', namespaceUI5Input: 'test.name.space', addTest: false });
        assert.noFile("webapp/test/unit/foo.js");
    });

});

describe('generator:newqunittest', function () {

    it('Should create single QUnit test', async function () {            
        await runGenerator("newqunittest", { projectname: 'testproject', namespaceUI5Input: 'test.name.space', codeUnderTest: '/folder/foo'});        
        assert.file("webapp/test/unit/folder/foo.js"); 
    });
});
