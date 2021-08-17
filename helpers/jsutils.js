// removes duplicates from an array
exports.removeDuplicates = function (aArray) {
    let sourceSet = new Set(aArray);
    let reducedSet = sourceSet.values();
    return Array.from(reducedSet);
}

exports.transformToRelativePath = function(sFilePath) {
    const regexCUT = /^[\.]?\/?([^.]+(?:\/]+)*|)\/?$/;
    return sFilePath.replace(regexCUT, '/$1') || './';
}
