// arn:???

const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');
const syntheticsConfiguration = synthetics.getConfiguration();

const target_rest_server_dev = 'a2udbyp6zqjb3ha6oaqpaxygpq0vdoqy';
const target_rest_server_test = 'gbtt7kksisljk7vpnl7u6rw55y0kqzmy';
const target_rest_server_prod = 'kr5gaaagth4sjoz2jl4ujtjfum0eqzpe';
const target_rest_host_region = '.lambda-url.us-west-2.on.aws';

// pick the rest_server value based on the Env variable for Stage: dev, test, prod
// Default is Dev - so if we make changes to groomer or this script, we can test it in Dev by default
const target_rest_server_for_this_stage =
    process.env.STAGE === 'prod' ? target_rest_server_prod :
    process.env.STAGE === 'test' ? target_rest_server_test :
    target_rest_server_dev; // default

const target_rest_host = `${target_rest_server_for_this_stage}${target_rest_host_region}`;

const target_rest_path_groom = `/groom`;

const url = `https://${target_rest_host}${target_rest_path_groom}`;


const apiSaraBoostGroomingCycle = async function () {
    // Configuration setup remains the same
    syntheticsConfiguration.setConfig({
        restrictedHeaders: ["Authorization"], // Value of these headers will be redacted from logs and reports
        restrictedUrlParameters: [] // Values of these url parameters will be redacted from logs and reports
    });

    // Setup auth header for admin-level access to groomer
    const headers = {
        "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJvb3RAbG9jYWxob3N0In0.bnetk9Voy2YE2ssI0ihwI8gWlHu3NVb24WL1uiL0fLxLmVxG3uU6TVazo3Bgu4N88FCKyG0Poz7JpaFkySOuCW2aEcrhBjkhEeP4iixMCQ-geyBnK6dJiQRadlQYle_Uvi30-_jCNSGIP48MUqo9xr5RJ7jPNDws2ZB2Dnkl5PhviyIVPaUqNdZdocZrVO_CCTvmauP8IiXHVI6GA2M_FloLboiTi_5U0ZlGSog2HgYK3JCYAi9nyIEFENBmaqwwyHa6s7qMFebAuJ-OG9s5qM2glflRVPkbVy_Xck4DDbw1yd2qwlxqqmkr-Ab0vAX-aeG9UoiQa-jeeeIiuVxR1g"
    };

    // Diagnostic validation function
    const validateSuccessful = async function (response) {
        return new Promise((resolve, reject) => {
            // Immediately log response status code and headers for diagnostics
            log.info(`Response Status Code: ${response.statusCode}`);
            log.info(`Response Headers: ${JSON.stringify(response.headers)}`);

            log.debug(`Response: ${JSON.stringify(response.responseBody)}`);

            let responseBody = '';
            response.on('data', (d) => {
                responseBody += d;
            });

            response.on('end', () => {
                // Log the response body for further diagnostics
                log.info('Response body: ' + responseBody);
                
                // Check for successful response status codes
                if (response.statusCode < 200 || response.statusCode > 299) {
                    reject(new Error(`${response.statusCode} ${response.statusMessage}`));
                } else {
                    resolve();
                }
            });
        });
    };

    var stepConfig = {
        'continueOnStepFailure': true
    };

    // Diagnostic step to check internet connectivity and DNS resolution
    const diagnosticStep = async function() {
        await synthetics.executeStep('Verify Step', async function (timeoutInMillis = 1000) {
            console.log("Diagnostic Step completed", stepConfig);
        });
    };

    // Execute diagnostic step
    await diagnosticStep();

    // Diagnostic step to check internet connectivity and DNS resolution
    const diagnosticHttpStep = async function() {

        let requestOptions = {
            'hostname': 'httpbin.org',
            'method': 'GET',
            'path': '/get',
            'port': 443,
            'protocol': 'https:'
        };

        const diagnosticUrl = 'https://httpbin.org/get'; // A known endpoint for testing
        await synthetics.executeHttpStep('Diagnostic Http Step', requestOptions, async function(res) {
            let responseBody = '';
            res.on('data', (chunk) => responseBody += chunk);
            res.on('end', () => log.info('Diagnostic response body: ' + responseBody));
        });
    };

    // Execute diagnostic step
    await diagnosticHttpStep();

    // Diagnostic step to execute and log detailed request and response info
    console.log("Executing HTTP Step with diagnostics...");

    
    // Define the URL to be called
    log.info("Account URL: " + url);

    let groomParams = {
        'hostname': target_rest_host,
        'method': 'POST',
        'path': target_rest_path_groom,
        'port': 443,
        'protocol': 'https:',
        'headers': headers,
    };
    
    log.info("Groom Step Parameters: " + JSON.stringify(groomParams));

    // Execute the HTTP request with detailed diagnostics
    try {
        await synthetics.executeHttpStep('Grooming Interval Information', groomParams, validateSuccessful);
    } catch (error) {
        // Log any errors encountered during the request execution
        log.error('Sara/Boost (REST Backend) Grooming Interval failed:', error);
    }
};

exports.handler = async () => {
    return await apiSaraBoostGroomingCycle();
};
