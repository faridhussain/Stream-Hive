// this file contains controller functions related to users
// controllers contain the business logic of the application, they receive the request, process it and send the appropriate response
import { asyncHandler } from '../utils/asyncHandler.js'; // catches async errors automatically
import { ApiError } from '../utils/ApiError.js'; // used to throw standardized api errors
import { User } from '../models/user.model.js'; // user model for db operations
import { uploadOnCloudinary } from '../utils/cloudinary.js'; // uploads files to cloudinary
import { ApiResponse } from '../utils/ApiResponse.js'; // used to send standardized success responses
import jwt from 'jsonwebtoken';

// generate new access and refresh tokens for a user, the refresh token is also saved in the db so it can be verified later
const generateAccessAndRefreshTokens = async (userId) => {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken; // store the newly generated refresh token in the db, this allows us to verify it later when the user requests a new access token
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
};

// controller responsible for registering a new user
const registerUser = asyncHandler(async (req, res) => {
    // get user data sent from the client (req.body) contains all the text fields sent in the request
    const { fullName, username, email, password } = req.body;
    console.log('Email: ', email);

    // if any field is empty, stop the request immediately
    if (
        [fullName, username, email, password].some(
            (field) => field?.trim() === ''
        )
    ) {
        throw new ApiError(400, 'All fields are required');
    }

    // check whether a user already exists (search by either username or email)
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });
    if (existedUser) {
        throw new ApiError(409, 'User with email or username already exists');
    }

    // get uploaded file paths from multer, multer stores uploaded files temporarily on our server
    // these paths will be used to upload the files to cloudinary
    const avatarLocalPath = req.files?.avatar[0]?.path;

    // cover image is optional, if a cover image was uploaded, get its local file path
    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    // avatar is mandatory
    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar file is required');
    }

    // upload files to cloudinary (cloudinary returns information including the file urls)
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(400, 'Avatar file is required');
    }

    // create a new user in mongodb
    // save cloudinary urls instead of local file paths
    const user = await User.create({
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || '',
        email,
        password,
        fullName,
    });

    // fetch the newly created user (exclude sensitive fields before sending the response)
    const createdUser = await User.findById(user._id).select(
        '-password -refreshToken'
    );
    if (!createdUser) {
        throw new ApiError(
            500,
            'Something went wrong while registering the user'
        );
    }

    // send a success response to the client
    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, 'User registered successfully')
        );
});

// controller responsible for logging in an existing user
const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body; // get login credentials sent by the client

    if (!email && !username) {
        throw new ApiError(400, 'username or email is required');
    }

    // find the user using either the username or email
    const user = await User.findOne({
        $or: [{ username }, { email }],
    });
    // if no matching user is found, stop the login process
    if (!user) {
        throw new ApiError(404, 'User does not exist');
    }

    const isPasswordValid = await user.isPasswordCorrect(password); // verify whether the entered password matches the hashed password stored in the db
    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid user credentials');
    }

    // generate new access and refresh tokens for the authenticated user
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    // fetch the user again, excluding sensitive fields before sending the response
    const loggedInUser = await User.findById(user._id).select(
        '-password -refreshToken'
    );

    // cookie options to improve security
    // httpOnly prevents JS from accessing the cookies
    // secure ensures the browser sends these cookies only over https connections
    const options = {
        httpOnly: true,
        secure: true,
    };

    // send the token as cookies and also include them in the response body
    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                'User logged in successfully'
            )
        );
});

// controller responsible for logging out the currently logged-in user
const logoutUser = asyncHandler(async (req, res) => {
    // remove the refresh token from the db
    // once removed, the old refresh token can no longer be used to generate new access tokens
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        { new: true }
    );

    // cookie options used while clearing the cookies, these should match the options used when the cookies were created
    const options = {
        httpOnly: true,
        secure: true,
    };

    // remove both access and refresh token cookies from the user's browser
    // finally send a success response indicating the user has been logged out
    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, 'User logged out'));
});

// controller responsible for generating a new access token using a valid refresh token
const refreshAccessToken = asyncHandler(async (req, res) => {
    // get the refresh token from cookies or the request body
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;
    // if no refresh token is provided, deny the request
    if (!incomingRefreshToken) {
        throw new ApiError(401, 'unauthorized request');
    }

    try {
        // verify the refresh token using the refresh token secret, if valid then jwt.verify() returns the decoded payload
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        // find the user whose id is stored inside the refresh token
        const user = await User.findById(decodedToken?._id);
        // if the user no longer exists, the refresh token is invalid
        if (!user) {
            throw new ApiError(401, 'Invalid refresh token');
        }

        // compare the received refresh token with the one stored in the db, if they don't match, reject the request
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, 'Refresh token is expired or used');
        }

        // cookie options used while sending the newly generated tokens
        const options = {
            httpOnly: true,
            secure: true,
        };

        // generate a new access token and a new refresh token
        const { accessToken, newRefreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        // send the new tokens as cookies and also include them in the response body
        return res
            .status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    'Access token refreshed'
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid refresh token');
    }
});

// controller responsible for allowing the currently logged-in user to change their password
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body; // get the old password and the new password sent by the client

    const user = await User.findById(req.user?._id); // fetch the currently authenticated user from the db, req.user is added by the verifyJWT middleware

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword); // verify whether the old password entered by the user is correct
    // if old password is incorrect, deny the request
    if (!isPasswordCorrect) {
        throw new ApiError(401, 'Invalid password');
    }

    user.password = newPassword; // replace the old password with the new one, the pre('save') middleware will automatically hash it before saving
    await user.save({ validateBeforeSave: false }); // save the updated password in the db

    // send a success response
    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Password changed successfully'));
});

// controller responsible for returning the details of the currently authenticated user
const getCurrentUser = asyncHandler(async (req, res) => {
    // req.user is attached by the verifyJWT middleware
    // since the user has already been authenticated, simply return their information
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, 'current user fetched successfully')
        );
});

// controller responsible for updating the logged-in user's account details
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body; // get the updated account details sent by the client
    // both full name and email are required
    if (!fullName || !email) {
        throw new ApiError(400, 'All fields are required');
    }

    // update the user's full name and email in the db
    // $set updates only the specified fields without affecting the rest of the document
    // { new: true } returns the updated document instead of the old one
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email,
            },
        },
        { new: true }
    ).select('-password');

    // send the updated user information back to the client
    res.status(200).json(
        new ApiResponse(200, user, 'Account detail updated successfully')
    );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
};