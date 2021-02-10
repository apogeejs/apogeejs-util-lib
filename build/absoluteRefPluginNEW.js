const path = require('path');

/** This function creates a resolveId plugin to resolve absolute paths in import statements and
 * to remap the paths using the given remap data. Arguments:
 * - currentSystemDirectory - the system directory as referenced by the caller.
 * - pathFromCurrentSystemDirToDesiredAbsoluteRoot - The relative path from the currentSystemDirectory to the desired absolute root directory.
 * - pathRemapMap - A mapping from an input path prefix to an output path prefix. Any import path starting with one of the input path prefixes
 *      will be mapped to its corresponding output prefix. The paths in the map should be POSIX style, as should the paths in the import statements. 
 */
function createResolveIdPlugin(currentSystemDirectory,pathFromCurrentSystemDirToDesiredAbsoluteRoot,pathRemapMap) {

    //get the base directory for any absolute reference
    let ABS_IMPORT_BASE_DIR;
    if(pathFromCurrentSystemDirToDesiredAbsoluteRoot) {
        ABS_IMPORT_BASE_DIR = path.join(currentSystemDirectory,pathFromCurrentSystemDirToDesiredAbsoluteRoot);
    }
    else {
        ABS_IMPORT_BASE_DIR = currentSystemDirectory;
    }

    //here we make sure the path prefixes in the remap file contain an ending "/"
    let cleanedPathRemapMap = pathRemapMap ? cleanPathRemapMap(pathRemapMap) : {};
    
    //This function creates the file path from the input file and the path that is being imported
    let resolveId = (importedFile, importingFile) => {

        if(importedFile == "/apogeebase/FieldObject.js") {
            return {
                id: "xxx/apogeebase/FieldObject.js",
                external: true
            }
        }

        console.log("importedFile: " + importedFile + "; importingFile: " + importingFile);

        //this is to handle the initial file for the cjs case
        if(!importingFile) return null;

        let importedBaseDir;
        let importedFileFromBase;
        if (isAbsolutePath(importedFile)) {
            console.log("Absolute ref: " + importedFile);
            let remappedImportedFile = remapFile(importedFile,cleanedPathRemapMap);
            console.log("Remapped ref: " + remappedImportedFile);
            importedBaseDir = ABS_IMPORT_BASE_DIR;
            importedFileFromBase = path.relative("/", remappedImportedFile);
        } else {
            importedBaseDir = path.dirname(importingFile);
            importedFileFromBase = importedFile;

        }
        return ensureExtension(path.resolve(importedBaseDir, importedFileFromBase));
    }



    return resolveId;
}

module.exports = createResolveIdPlugin;

//-----------------
// internal Functions
//-----------------

//returns true if entered path starts with "/"
function isAbsolutePath(path) {
    return /^[\\\/]/.test(path);
}

//adds the ".js" extension if it is missing
function ensureExtension(fn) {
    return /\.js$/.test(fn) ? fn : fn + '.js';
}

/** This remaps the input file isomg the pathRemapFile. The import statement
 * and the pathRemapMap should us the POSIX naming format. */
function remapFile(importedFile, cleanedPathRemapMap) {
    for(let inputPrefix in cleanedPathRemapMap) {
        console.log("trying: " + inputPrefix);
        if(importedFile.startsWith(inputPrefix)) {
            return cleanedPathRemapMap[inputPrefix] + importedFile.substr(inputPrefix.length);
        }
    }
    //no remap done
    return importedFile;
}

/** This makes a new remap file, ensuring each path ends in a "/". Note - use posix format for pathRemapMap.*/
function cleanPathRemapMap(pathRemapMap) {
    let cleanedPathRemapMap = {};
    for(let inputPrefix in pathRemapMap) {
        let outputPrefix = pathRemapMap[inputPrefix];
        if(!inputPrefix.endsWith("/")) inputPrefix += "/"; 
        if(!outputPrefix.endsWith("/")) outputPrefix += "/";
        cleanedPathRemapMap[inputPrefix] = outputPrefix;
    }
    return cleanedPathRemapMap;
}