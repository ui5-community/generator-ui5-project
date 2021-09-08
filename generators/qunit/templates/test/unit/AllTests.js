sap.ui.define([<% for (let [index, codeUnderTest] of qunittests.entries()) { %>
  ".<%=codeUnderTest%>"<% if (index < qunittests.length-1) { %>, <% } } %>
  ], function() {
    "use strict";
});