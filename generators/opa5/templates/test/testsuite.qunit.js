window.suite = function () {
    "use strict";

    // eslint-disable-next-lin
    var oSuite = new parent.jsUnitTestSuite(),
        sContextPath = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1);

    // eslint-disable-next-lin
    oSuite.addTestPage(sContextPath + "integration/opaTests.qunit.html");

    // eslint-disable-next-lin
    return oSuite;
};
