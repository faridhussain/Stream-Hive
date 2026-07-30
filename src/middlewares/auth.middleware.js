// this middleware verifies whether the user is authenticated using a jwt access token, it runs before protected routes and allows only logged-in users to access them
import { User } from '../models/user.model'; // user model used to fetch the authenticated user from the db
import { ApiError } from '../utils/ApiError'; // used to throw standardized api errors
import { asyncHandler } from '../utils/asyncHandler'; // catches async errors automatically
import jwt from 'jsonwebtoken'; // used to verify and decode jwt tokens

// middleware responsible for verifying the user's access token
export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // get the access token
        // first check cookies, if not found then check the authorization header
        const token =
            req.cookies?.accessToken ||
            req.header('Authorization')?.replace('Bearer', '');

        // if no token is provided, the user is not authenticated
        if (!token) {
            throw new ApiError(401, 'Unauthorized request');
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // verify the token using the secret key, if the token is valid, jwt.verify() returns the decoded payload

        // find the user whose id is stored inside the token, exclude sensitive fields before attaching the user to the request
        const user = await User.findById(decodedToken?._id).select(
            '-password -refreshToken'
        );
        // if no user exists, the token is invalid
        if (!user) {
            throw new ApiError(401, 'Invalid access token');
        }

        req.user = user; // attach the authenticated user to the request object, now every next controller can access req.user
        next(); // pass control to the next middleware or controller
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid access token');
    }
});