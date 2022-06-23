function validateAlhpaNumericStartingWithLetter(sInput) {
    if (/^\d*[a-z][a-z0-9]*$/gi.test(sInput)) {
        return true;
    }
    return "Please use alpha numeric characters only.";
}

function validatHttpUrl(sInput) {
    var url;
    try {
        url = new URL(sInput);
      } catch (e) {
        return e.message;
      }
    
      if (url.protocol === "http:" || url.protocol === "https:") {
        return true;
      } else {
        return "Please provide a valid http(s) url."
      }; 
}

function isArrayWithMoreThanOneElement(aElements) {
    return !!aElements && aElements.length > 1
}

module.exports = {
    validateAlhpaNumericStartingWithLetter,
    validatHttpUrl,
    isArrayWithMoreThanOneElement
}