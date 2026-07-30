import mongoose, { Schema } from 'mongoose'; // used to create schema and models for mongodb
// jsonwebtoken(jwt) -> used to generate and verify login tokens, after a user logs in successfully, we create a token so that user doesn't need to log in again on every request
import jwt from 'jsonwebtoken';
// used to hash (encrypt) passwords before storing them in the db and compare passwords during login
import bcrypt from 'bcrypt';

// define the structure of a user document that will be stored in the users collection
const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String,
            required: true,
        },
        coverImage: {
            type: String,
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Video',
            },
        ],
        password: {
            type: String,
            required: [true, 'Password is required'],
        },
        refreshToken: {
            type: String,
        },
    },
    { timestamps: true }
);

// runs automatically before a user document is saved
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return next(); // if password wasn't changed, skip hashing
    this.password = await bcrypt.hash(this.password, 10); // hash the password before storing it in the database
});

// custom method attached to every user document, compares the entered password with the hashed password stored in the db
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// custom method to generate a short-lived access token, this token is sent with protected requests to verify the user's identity
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        // data stored inside the jwt payload
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET, // secret key used to sign the token
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY, // token expiry time
        }
    );
};

// custom method to generate a long-lived refresh token used to generate a new access token after the old one expires
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        // refresh token only needs the user's id
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET, // secret key used to sign the refresh token
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const User = mongoose.model('User', userSchema);