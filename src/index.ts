import express, { Request, Response } from 'express';
import fetch from 'node-fetch';
import process from 'process';

import serverless from 'serverless-http';

import { logRequest, handleErrorResponse, HTTP_SUCCESS } from './utility/dispatch';
import { header_X_Signed_Identity, signedAuthHeader } from './auth';

export const app = express();

app.use(express.json()); // Make sure to use express.json middleware to parse json request body
app.use(express.text()); // Make sure to use express.text middleware to parse text request body

if (process.env.IS_OFFLINE) {
    process.env.DEPLOYMENT_STAGE = "local";
}

// Constants for URL options
const stage_rest_url: { [key: string]: string } = {
    "local": "http://localhost:3000",
    "dev": "https://3c27qu2ddje63mw2dmuqp6oa7u0ergex.lambda-url.us-west-2.on.aws",
    "test": "https://sztg3725fqtcptfts5vrvcozoe0nxcew.lambda-url.us-west-2.on.aws",
    "prod": "https://33pdosoitl22c42c7sf46tabi40qwlae.lambda-url.us-west-2.on.aws"
}

const grooming_timer_interval = `api/timer/interval`;
const local_admin_email = "root@localhost";

app.post("/groom", async (req: Request, res: Response) => {

    console.log('Grooming request received');

    try {
        logRequest(req);

        if (!process.env.DEPLOYMENT_STAGE) {
            return handleErrorResponse(new Error("STAGE environment variable not set"), req, res);
        }

        // get the string from the rest url map, based on process.env.STAGE
        const this_stage_url : string = stage_rest_url[process.env.DEPLOYMENT_STAGE.toLocaleLowerCase()]; 

        const response = await fetch(`${this_stage_url}/${grooming_timer_interval}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [header_X_Signed_Identity]: (await signedAuthHeader(local_admin_email))[header_X_Signed_Identity]
            },
            body: JSON.stringify({ "interval": process.env.GROOMING_INTERVAL?parseInt(process.env.GROOMING_INTERVAL):0 })
        });

        if (!response.ok) {
            return handleErrorResponse(new Error(`Failed to groom: ${response.statusText}`), req, res);
        }

        console.log('Grooming successful');

        const responseData = await response.text();

        return res
            .status(HTTP_SUCCESS)
            .contentType("text/plain")
            .send(responseData);

    } catch (error) {
        return handleErrorResponse(error, req, res, "Grooming failed");
    }
});

module.exports.handler = serverless(app);