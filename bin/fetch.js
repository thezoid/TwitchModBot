const axios = require('axios');

/**
 * Calls the endpoint with authorization bearer token.
 * @param {string} endpoint 
 * @param {string} accessToken 
 * @param {string} method
 */
async function callApi(endpoint, accessToken, method, value = null) {
    const options = {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    };

    //console.log('request made to web API at: ' + new Date().toString());

    try {
        switch (method) {
            case "post":
                if (value) {
                    const response = await axios.default.post(endpoint, value, options);
                    return response.status
                }
                break;
            case "get":
                const response = await axios.default.get(endpoint, options);
                return response.data;
                break;
            default:
                console.error("invalid method provided")
                return null;
                break;
        }

    } catch (error) {
        console.log(error)
        return error;
    }
};

module.exports = {
    callApi: callApi
};