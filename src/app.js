// this file is responsible for creating and configuring our express application
// this file does not start the server, the server is started from index.js after the database connection is establishes successfully
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

// middleware are function that execute between receiving a request and sending a response
// every incoming request passes through these middleware in the order they are registered
// by default , browser block requests coming from different origins for security reasons, CORS allows our frontend and backend to communicate even if they are running on different domains or ports
// eg -> frontend :- http://localhost:5173, backend :- http://localhost:8000
// without CORS, the browser would block these requests
app.use(
    cors({
        origin: process.env.CORS_ORIGIN, // allow requests only from this origin
        credentials: true, // allow cookies and other credentials to be sent along with requests, this is commonly required when using authentication with cookies
    })
);

// parse incoming JSON request bodies
// eg -> { 'username': 'farid' }
// express converts the JSON into a JS object and stores it inside req.body
// the limit helps prevent excessively large requests
app.use(express.json({ limit: '16kb' }));

// parse URL-encoded form data
// this is commonly used when data is submitted through HTML forms
// eg -> username=farid&age=21
// this parsed data is also available in req.body
// extended: true allows parsing of nested objects
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// serve static files from the 'public' folder
// files inside this folder can be accessed directly through the browser without creating a route
// eg -> public/logo.png
// accessible as http://localhost:8000/logo.png
app.use(express.static('public'));

// parse cookies sent by the client
// after this middleware runs, cookies become available through req.cookies
// this is especially useful for authentication using access tokens or refresh token stored inside cookies
app.use(cookieParser());

// import the user routes, this router contains all endpoints related to user operations such as register, login, logout, profile update and many more
import userRouter from './routes/user.route.js';

// register the user routes with the express application, every route defined inside userRouter will automatically start with '/api/v1/users'
// examples:
// POST     /api/v1/users/register
// POST     /api/v1/users/login
// GET      /api/v1/users/profile
app.use('/api/v1/users', userRouter);

export { app };