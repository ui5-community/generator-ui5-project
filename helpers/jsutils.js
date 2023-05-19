// removes duplicates from an array
function removeDuplicates(aArray) {
    let sourceSet = new Set(aArray);
    let reducedSet = sourceSet.values();
    return Array.from(reducedSet);
};

function transformToPathWithLeadingSlash(sFilePath) {
    const regexCUT = /^[\.]?\/?([^.]+[\.]?[^.]+|)\/?$/;
    let result = sFilePath.replace(regexCUT, "/$1") || "./";
    return result;
};

export default {
    removeDuplicates,
    transformToPathWithLeadingSlash
}