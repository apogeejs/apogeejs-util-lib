import _ from "/apogeejs-releases/releases/ext/lodash/v4.17.21/lodash.es.js";

/** 
 * This namespace includes some utility functions available to the user.
 * @namespace
 */
let apogeeutil = {};

export {apogeeutil as default};

//export lodash in apogee util
//Internally to the code we will use this version rather than a global definition of _
apogeeutil._ = _;

/** None State - used by members. This indicates no state information is present. */
apogeeutil.STATE_NONE = "none";

/** Normal State - used by members */
apogeeutil.STATE_NORMAL = "normal";

/** Pending State - used by members */
apogeeutil.STATE_PENDING = "pending";

/** Error State - used by members */
apogeeutil.STATE_ERROR = "error";

/** Invalid State - used by members */
apogeeutil.STATE_INVALID = "invalid";

/** 
 * This value can be assigned to a data member to signify that data is not valid.
 * Any other member depending on this value will withhold the calcalation and also
 * return this invalid value.
 */
apogeeutil.INVALID_VALUE = {"apogeeValue":"INVALID VALUE"};

/**
 * This is a special throwable that is used to exit a function when the function definition depends
 * on another invalid value. I don't like to use exceptions for non-exceptional cases, which 
 * I consider this to be, but I couldn't figure out how else to exit the function.  */
apogeeutil.MEMBER_FUNCTION_INVALID_THROWABLE = {"apogeeException":"invalid"};

/**
 * This is a special throwable that is used to exit a function when the function definition depends
 * on another pending value. I don't like to use exceptions for non-exceptional cases, which 
 * I consider this to be, but I couldn't figure out how else to exit the function.  */
apogeeutil.MEMBER_FUNCTION_PENDING_THROWABLE = {"apogeeException":"pending"};

/** 
 * This function should be called from the body of a function member
 * to indicate the function will not return a valid value. (The actual invalid value
 * can not be returned since this typically will not have the desired effect.)
 */
apogeeutil.invalidFunctionReturn = function() {
    throw apogeeutil.MEMBER_FUNCTION_INVALID_THROWABLE;
}

/** This function reads any proeprty of the mixinObject and adds it
 * fo the prototypr of the destObject. This is intended to apend functions and
 * other properties to a cless directly without going through inheritance. 
 * Note this will overwrite and similarly named object in the dest class.
 * @private */
apogeeutil.mixin = function(destObject,mixinObject) {
    for(var key in mixinObject) {
        destObject.prototype[key] = mixinObject[key];
    }
}

/** 
 * This method creates an integer hash value for a string. 
 * 
 * @param {String} string - This is the string for which a hash number is desired.
 * @return {integer} This is the hash value for the string.
 */
apogeeutil.stringHash = function(string) {
    var HASH_SIZE = 0xffffffff;
    var hash = 0;
    var ch;
    for (var i = 0; i < string.length; i++) {
        ch = string.charCodeAt(i);
        hash = (31 * hash + ch) & HASH_SIZE;
    }
    return hash;
}

/** 
 * This method creates an integer hash value for a JSON object. 
 * 
 * @param {JSON} object - This is the json valued object for which a hash number is desired.
 * @return {integer} This is the hash value for the JSON.
 */
apogeeutil.objectHash = function(object) {
    //this is not real efficient. It should be implemented differently
    var string = JSON.stringify(object);
    return stringHash(string);
}

/**
 * @private
 */
apogeeutil.constructors = {
    "String": ("").constructor,
    "Number": (3).constructor,
    "Boolean": (true).constructor,
    "Date": (new Date()).constructor,
    "Object": ({}).constructor,
    "Array": ([]).constructor,
    "Function": (function(){}).constructor
}

/** This method returns the object type. The Allowed types are:
 * String, Number, Boolean, Date, Object, Array, Function, null, undefined.
 * @param {Object} object - This is the object for which the type is desired.
 * @returns {String} This is the type for the object. 
 */
apogeeutil.getObjectType = function(object) {
    if(object === null) return "null";
    if(object === undefined) return "undefined";
    
    var constructor = object.constructor;
    for(var key in apogeeutil.constructors) {
        if(constructor == apogeeutil.constructors[key]) {
            return key;
        }	
    }
    //not found
    return "Unknown";
}

/** This returns true if the object is a string. */
apogeeutil.isString = function(object) {
    return ((typeof object == "string")||(object instanceof String));
}

/** This method creates a deep copy of an object, array or value. Note that
 * undefined is not a valid value in JSON. 
 * 
 * @param {JSON} data - This is a JSON valued object
 * @returns {JSON} A JSON object which is a deep copy of the input.
 */
apogeeutil.jsonCopy = function(data) {
    if(data === null) return null;
    if(data === undefined) return undefined;
    return JSON.parse(JSON.stringify(data));
}

/** This method takes a field which can be an object, 
 *array or other value. If it is an object or array it 
 *freezes that object and all of its children, recursively.
 * Warning - this does not check for cycles (which are not in JSON 
 * objects but can be in javascript objects)
 * Implementation from Mozilla */
apogeeutil.deepFreeze = function(obj) {
    ///////////////////////////////////////////
    // old freeze all recursively logic

    // if((obj === null)||(obj === undefined)) return;
    
    // //retrieve the property names defined on obj
    // var propNames = Object.getOwnPropertyNames(obj);

    // //freeze properties before freezing self
    // propNames.forEach(function(name) {
    //     var prop = obj[name];

    //     //freeze prop if it is an object
    //     if(typeof prop == 'object' && prop !== null) apogeeutil.deepFreeze(prop);
    // });

    // //freeze self (no-op if already frozen)
    // return Object.freeze(obj);

    /////////////////////////////////////////

    //////////////////////////////////////
    // logic to freeze recursively unless already frozen
    // Here we risk not freezing something, but we won't 
    // run indefinitely if there is an internal looping reference 

    if((!_.isObjectLike(obj))||(Object.isFrozen(obj))) {
        return;
    }

    Object.freeze(obj);

    _.forOwn(obj, function (value) {
        apogeeutil.deepFreeze(value);
    });

    ////////////////////////////////////////

}

/** This method does format string functionality. Text should include
 * {i} to insert the ith string argument passed. 
 * @deprecated
 *  @param {String} format - This is a format string to format the output.
 *  @param {Array} stringArgs - These are the values which should be placed into the format string.
 *  @returns {String} The format string with the proper inserted values is returned.  
 */
apogeeutil.formatString = function(format,stringArgs) {
    var formatParams = arguments;
    return format.replace(/{(\d+)}/g, function(match,p1) {
        var index = Number(p1) + 1;
        return formatParams[index]; 
    });
};

/** This method reads the query string from a url
 * 
 *  @param {String} field - This is the field that should be read from the url query string
 *  @param {String} url - This is the url from which we read the query string
 *  @returns {String} The value associated with the query string key passed in. 
 */
apogeeutil.readQueryField = function(field,url) {
    var href = url ? url : window.location.href;
    var reg = new RegExp( '[?&]' + field + '=([^&#]*)', 'i' );
    var string = reg.exec(href);
    return string ? string[1] : null;
}

/** 
 * This is a equals for json objects. For JSON objects it
 * does not require order matching of the keys. For JSON arrays it does require
 * order matching of the array values.
 * 
 *  @param {JSON} json1 - This is a JSON valued object 
 *  @param {JSON} json1 - This is a JSON valued object 
 *  @returns {Boolean}  - Returns whether or not the objects are equal
 */
apogeeutil.jsonEquals = function(json1,json2) {
    return _.isEqual(json1,json2);
}

/** 
 * This method returns a copied json that has the order in all JSON objects/"maps" normalized to alphabetical. 
 * The order of JSON arrays is NOT modified.
 * This is intended for the purpose of comparing json objects. 
 * @deprecated 
 * 
 *  @param {JSON} json1 - This is a JSON valued object 
 *  @returns {JSON} - Returns a order-modified version of the object
 */  
apogeeutil.getNormalizedCopy = function(json) {
    var copiedJson;

    var objectType = apogeeutil.getObjectType(json);
    
    switch(objectType) {
        case "Object":
            copiedJson = apogeeutil.getNormalizedObjectCopy(json);
            break;
            
        case "Array": 
            copiedJson = apogeeutil.getNormalizedArrayCopy(json);
            break;
            
        default:
            copiedJson = json;
    }
    
    return copiedJson;
}

/** this orders the keys apphabetically, since order is not important in a json object 
 * @deprecated
 * @private
 */
apogeeutil.getNormalizedObjectCopy = function(json) {
    var copiedJson = {};
    
    var keys = [];
    var key;
    for(key in json) {
        keys.push(key);
    }
    
    keys.sort();
    
    for(var i = 0; i < keys.length; i++) {
        key = keys[i];
        copiedJson[key] = apogeeutil.getNormalizedCopy(json[key]);
    }
    return copiedJson;
}

/** This method counts the properties in a object. 
 * @deprecated
*/
apogeeutil.jsonObjectLength = function(jsonObject) {
    _.size(jsonObject);
}

/** This makes a copy of with any contained objects normalized. 
 * @deprecated
 * @private 
 */
apogeeutil.getNormalizedArrayCopy = function(json) {
    var copiedJson = [];
    for(var i = 0; i < json.length; i++) {
        var element = json[i];
        copiedJson.push(apogeeutil.getNormalizedCopy(element));
    }
    return copiedJson;
}

/** This returns true if the mime type is JSON. */
apogeeutil.isJsonMimeType = function(mimeType) {
    return (mimeType.startsWith(apogeeutil.MIME_TYPE_JSON));
}

apogeeutil.MIME_TYPE_JSON = "application/json"

//=================
// Some other generic utils
//=================

/** This methdo parses an arg list string to make an arg list array. It is
 * also used outisde this class. */
apogeeutil.parseStringArray = function(argListString) {
    var argList = argListString.split(",");
    for(var i = 0; i < argList.length; i++) {
        argList[i] = argList[i].trim();
    }
    return argList;
}

//=================
// Error utility methods
//=================

/** This method adds the extended info to the error. It allows for multiple
 * error infos to be added. */
apogeeutil.appendErrorInfo = function(error,errorInfo) {
    if(!error.errorInfoList) {
        error.errorInfoList = [];
    }
    error.errorInfoList.push(errorInfo);
}

//=================
// Network request utils
//=================

/** This is an http request. The url and options argument matches the options in fetch:
 * @url - the url to request
 * @options - the options for the request, as formatted for the function "fetch"
 * @bodyFormat - specifies how to return the body
 * -- "mime" - The output format matches the mime type (currently supporting JSON and text). This is used as the default.
 * -- "text" - The output is forced to text, ignoring mime type
 * -- "json" - The output is given as JSON, ignoring mime type
 * -- "none" - The body is not returned.
 * 
 * @saveMetaData - If this flag is set to true, the response status and headers are included in the output.
 * - noFailedRequestError - If this is set to true, an error will nto be thrown if fetch does no report status "OK"
 *      There are still scenarios where an error will be thrown if this flag is true. If this flag is false or otherwise falsey, 
 *      then an error will be thrown if fetch reports the reponse.ok = false;
 * 
 * If there is a successful request but an error loading the body, this will cause an exception if noFailedRequestError is false, 
 * In noFailedRequestError is true an empty body will be returned. The value "bodyError" will be populated with a descrition of the error.
 * 
 * @return:
 * {
 *      "body": (the body, if applicable)
 *      "meta": (if applicable) {
 *          "status": (status)
 *          "headers": (headers)
 *      }
 *      "bodyError": (body error description, if noFailedRequestError is set true and there is a body error. In this case, the body is an empty string)
 * }
 * 
 * If an exception is thrown, the Error object will include the field "valueData" which has the data in the format of the return value above if applicable.
 * for example, if noFailedRequestError = false (or maybe undefined), an exception can be thrown even though there is response data.
 * -- meta
 * --- status
 * --- headers
 * }
 */ 
apogeeutil.httpRequest = function(url,options,bodyFormat,saveMetadata,noFailedRequestError) {

    /////////////////////////////////////////
    //legacy addition
    //Originally, before fetch was used, the headers options was called "header"
    //This fix will support people using "header" instead of "headers"
    //It does not support arbitrary use of both together. The field "header" is used only if "headers" is not defined
    //It copies the options object, to prevent an error for the case the options object is immutable
    if((options)&&(options.header)&&(options.headers === undefined)) {
        let newOptions = {};
        Object.assign(newOptions,options);
        newOptions.headers = options.header;
        options = newOptions;
    }
    //end legacy addition
    //////////////////////////////////////////

	return fetch(url,options).then(response => {
        let returnValue = {};
        let error = null;

        //check for response with status error
        if((!response.ok)&&(!noFailedRequestError)) {
            let msg = "Error in request. Status code: " + response.status;
            if(response.statusText) msg += "; " + response.statusText
            error = new Error(msg);
        }

        //read request meta data, if needed
        let meta;
        if(saveMetadata) {
            meta = {};
            meta.status = response.status;
            meta.headers = {};
            for (let pair of response.headers.entries()) {
                meta.headers[pair[0]] = pair[1];
            }
            returnValue.meta = meta;
        }

		//save the body
		let responseBodyPromise;
		let selectedBodyFormat;
        switch(bodyFormat) {
            case "text":
		    case "json":
            case "none":
                selectedBodyFormat = bodyFormat;
                break;

            case "mime": 
            default: 
            {
                let contentType = response.headers.get("content-type");
                if((contentType)&&(apogeeutil.isJsonMimeType(contentType))) selectedBodyFormat = "json";
                else selectedBodyFormat = "text";
                break;
            }
        }
		
		switch(selectedBodyFormat) {
			case "text":
				responseBodyPromise = response.text();
				break;
				
			case "json": 
				responseBodyPromise = response.text().then(jsonString => {
                    try {
                        return JSON.parse(jsonString);
                    }
                    catch(error) {
                        //append the unparsed data to the error
                        error.valueData = {
                            value: {
                                meta: meta,
                                body: jsonString
                            },
                            nominalType: apogeeutil.MIME_TYPE_JSON
                        };
                        throw error;
                    }
                });
				break;
				
			case "none":
				responseBodyPromise = Promise.resolve("");
				break;
		}
		
		return responseBodyPromise.then(body => {
            //save the body to the return value
            returnValue.body = body;
		}).catch(bodyLoadError => {
            if(!bodyLoadError instanceof Error) {
                error = new Error(bodyLoadError.toString());
            }
            else {
                error = bodyLoadError;
            }
        }).then( () => {
            //get final return value
            if(!error) {
                return returnValue;
            }
            else {
				return Promise.reject(error)
			}
        })
	})
}

/** 
 * This method returns a promise object for an HTTP request. The promist object
 * returns the text body of the URL if it resolves successfully.
 *  
 * @param {String} url - This is the url to be requested
 * @param {Object} options - These are options for the request, matching the options in fetch.
 * @return {Promise} This method returns a promise object with the URL body as text.
 */
apogeeutil.textRequest = function(url,options) {
    return apogeeutil.httpRequest(url,options,"text").then(result => result.body);
}

/** 
 * This method returns a promise object for an HTTP request. The promist object
 * returns the JSON body of the URL if it resolves successfully.
 *  
 * @param {String} url - This is the url to be requested
 * @param {Object} options - These are options for the request, matching the options in fetch.
 * @return {Promise} This method returns a promise object with the URL body as text.
 */
apogeeutil.jsonRequest = function(url,options) {
    return apogeeutil.httpRequest(url,options,"json").then(result => result.body);
}

/** This method returns a random string which should be unique. */
apogeeutil.getUniqueString = function() {
    return Math.random().toString(36).substring(2, 15);
}


//======================================================================
// deprecated
//======================================================================

/** 
 * This method does a standard callback request. It includes the following options:
 * - "method" - HTTP method, default value is "GET"
 * - "body" - HTTP body for the request
 * - "header" - HTTP headers, example: {"Content-Type":"text/plain","other-header":"xxx"}
 * @param {String} url - This is the url to be requested
 * @param {function} onSuccess - This is a callback that will be called if the request succeeds. It should take a String request body argument.
 * @param {function} onError - This is the callback that will be called it the request fails. It should take a String error message argument. 
 * @param {Object} options - These are options for the request.
 * 
 * @deprecated
 */
 apogeeutil.callbackRequest = function(url,onSuccess,onError,options) {
    
    var xmlhttp=new XMLHttpRequest();

    xmlhttp.onreadystatechange=function() {
        var msg;
        if(xmlhttp.readyState==4) {
            if((xmlhttp.status>=200)&&(xmlhttp.status<=399)) {
                try {
                    onSuccess(xmlhttp.responseText);
                }
                catch(error) {
                    onError(error.message);
                }

            }
            else if(xmlhttp.status >= 400)  {
                msg = "Error in http request. Status: " + xmlhttp.status;
                onError(msg);
            }
            else if(xmlhttp.status == 0) {
                msg = "Preflight error in request. See console";
                onError(msg);
            }
        }
    }

    if(!options) options = {};
    
    var method = options.method ? options.method : "GET";
    xmlhttp.open(method,url,true);
    
    if(options.header) {
        for(var key in options.header) {
            xmlhttp.setRequestHeader(key,options.header[key]);
        }
    }
    
    xmlhttp.send(options.body);
}
