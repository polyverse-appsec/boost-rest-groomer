import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';

import serverless from 'serverless-http';
import axios from 'axios';


export const app = express();

app.use(express.json); // Make sure to use express.json middleware to parse json request body
app.use(express.text); // Make sure to use express.text middleware to parse text request body


app.post("/groom", (req: Request, res: Response) => {

    try {
        logRequest(req);

        const data = req.body;

        return res
            .status(HTTP_SUCCESS)
            .contentType("text/plain")
            .send(`Test HTTP POST Ack: ${data}`);
    } catch (error) {
        return handleErrorResponse(error, req, res);
    }
});

module.exports.handler = serverless(app);