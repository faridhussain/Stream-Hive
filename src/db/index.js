// this file is responsible for establishing a connection between our application and the mongodb database
import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

// this fnc is called before starting the express server
// if the database connection is successful, the server can safely start accepting requests
// if connection fails, the application exits because most features depend on the database
const connectDB = async () => {
    try {
        // connect the mongodb using mongoose
        // the connection URL is created by combining: process.env.MONGODB_URI
        // the final URL will be something like mongodb://localhost:27017/streamhive
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`MongoDB connected! DB HOST: ${connectionInstance.connection.host}`)    // once connected successfully , mongoose returns a connection object containing information about the current database connection
    } catch (error) {
        console.log('MONGODB connection error: ', error)
        
        // exit the node js process with a non-zero exit code 
        // exit code 1 indicates that the application terminated because of an error
        // since our application relies on the db, there's no point in keeping the server running if the db connection cannot be established
        process.exit(1)
    }
}

export default connectDB