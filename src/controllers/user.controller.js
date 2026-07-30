// this file contains controller functions related to users
// controllers contain the business logic of the application, they receive the request, process it and send the appropriate response
import { asyncHandler } from '../utils/asyncHandler.js';    // catches async errors automatically
import { ApiError } from '../utils/ApiError.js';    // used to throw standardized api errors
import { User } from '../models/user.model.js'; // user model for db operations
import { uploadOnCloudinary } from '../utils/cloudinary.js';    // uploads files to cloudinary
import { ApiResponse } from '../utils/ApiResponse.js';  // used to send standardized success responses

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
    const existedUser = User.findOne({
        $or: [{ username }, { email }],
    });
    if (existedUser) {
        throw new ApiError(409, 'User with email or username already exists');
    }

    // get uploaded file paths from multer, multer stores uploaded files temporarily on our server
    // these paths will be used to upload the files to cloudinary
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // avatar is mandatory
    if (avatarLocalPath) {
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
        fullName
    })

    // fetch the newly created user (exclude sensitive fields before sending the response)
    const createdUser = await User.findById(user._id).select(
        '-password -refreshToken'
    )
    if(!createdUser) {
        throw new ApiError(500, 'Something went wrong while registering the user')
    }

    // send a success response to the client
    return res.status(201).json(
        new ApiResponse(200, createdUser, 'User registered successfully')
    )
});

export { registerUser };