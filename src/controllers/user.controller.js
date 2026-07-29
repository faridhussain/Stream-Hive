// this file contains controller functions related to users
// controllers contain the business logic of the application, they receive the request, process it and send the appropriate response
import { asyncHandler } from '../utils/asyncHandler.js';

// controller responsible for registering a new user, currently it only returns a success response, later it will validate user data, upload files
// in simple -> create a user in the db and return the created user
const registerUser = asyncHandler(async (req, res) => {
    // send a successful response to the client
    res.status(200).json({
        message: 'system hang',
    });
});

export { registerUser };