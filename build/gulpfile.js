const {series, parallel, src, dest} = require('gulp');
const rollup = require('rollup');
const {getJsFileHeader, getReleaseFolder, makeSureReleaseNotPresent, createResolveId} = require("../../apogeejs-admin/build-src/build-utils.js");

const releasePackageJson = require("../package.json");

//read data from the release package.json
let isDevRelease = releasePackageJson.DEV_RELEASE;
let version = releasePackageJson.version;
let repoName = releasePackageJson.name;
let esModuleFileName = releasePackageJson.module;
let npmModuleFileName = releasePackageJson.main;

//for absolute references
const PATH_TO_ABSOLUTE_ROOT = "../..";
let resolveId = createResolveId(__dirname,PATH_TO_ABSOLUTE_ROOT);

const outputFolder = getReleaseFolder(repoName,version,isDevRelease);

//======================================
// Release Info
//======================================


//base files - version info
const BASE_FILES = [
    "../package.json"
]

let copyReleaseInfoTask = parallel(
    () => copyFilesTask(BASE_FILES,outputFolder)
)

/** This function is a gulp task that copies files to a destination folder. */
function copyFilesTask(fileList,destFolder) {
    return src(fileList,{allowEmpty: true})
        .pipe(dest(destFolder));
}


//==============================
// Library Module
//==============================

function packageLibTask() {
    return rollup.rollup({
        input: '../src/' + esModuleFileName,
        plugins: [
            {resolveId}
        ]
    }).then(bundle => {
        return Promise.all([
            bundle.write(
                { 
                    file: outputFolder + "/" + esModuleFileName,
                    format: 'es',
                    banner: getJsFileHeader(esModuleFileName,version)
                }
            ),
            bundle.write(
                { 
                    file: outputFolder + "/" + npmModuleFileName,
                    format: 'cjs',
                    banner: getJsFileHeader(npmModuleFileName,version)
                }
            )
        ]);
    });
}

//============================
// Exports
//============================

//This task executes the complete release
exports.release = series(
    () => makeSureReleaseNotPresent(outputFolder),
    parallel(
        copyReleaseInfoTask,
        packageLibTask
    )
);


