// this file is the entry point of our backend application
// every node js application starts executing from its entry file, and in our project that file is index.js

// older commonJS way of loading environment variables
// we are not using this approach because StreamHive uses ES modules (import/export syntax) instead of commonJS (require/module.exports)
// require('dotenv').config({ path: './env' })

// environment variables allow us to keep sensitive information such as database URLs, API keys, and secrets outside of our source code
import dotenv from 'dotenv';

// import the function responsible for connecting to the mongodb database
import connectDB from './db/index.js';

// import the configures express application
// all middlewares, routes and application settings are defined in app.js
// index.js imports this app and starts the server after the db connection is established successfully
import { app } from './app.js';

// load all environment variables into process.env
// the 'path' property tells dotenv where our environment file is located
// after this runs, values such as: process.env.PORT, process.env.MONGODB_URI and more become available throughout the application
dotenv.config({
    path: './env',
});

// establish a connection with mongodb
// this should always happen before starting the Express server because most of our application depends on the database being available
connectDB()
    .then(() => {
        // if an unexpected server-level error occurs after the server has started (for eg -> a port conflict or another runtime server error), this callback executes
        app.on('error', (error) => {
            console.log('Error: ', error);
            throw error;
        });
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port ${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.log('MongoDB connection failed! ', error);
    });

// this is one way to start an Express application
// in this approach, everything is written inside a single file:
// - connect to mongodb
// - create a express app
// - handle server errors
// - start the server
// this works perfectly for small applications or while learning. However, as the project grows, this file becomes large and difficult to manage so a better approach is to separate responsibilities into different files
// import mongoose from 'mongoose';
// import { DB_NAME } from './constants';

// import express from 'express';
// const app = express()(async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

//         app.on('error', (error) => {
//             console.log('Error: ', error);
//             throw error;
//         });

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on port ${process.env.PORT}`);
//         });
//     } catch (error) {
//         console.error('Error: ', error);
//         throw error;
//     }
// })();
