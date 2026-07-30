// this file defines all routes related to users
// routes map incoming requests to their corresponding controller functions, they decide which controller should handle a specific request

import { Router } from 'express'; // import the Router class from express, Router allows us to group related routes together instead of defining every route inside app.js
import { loginUser, logoutUser, registerUser } from '../controllers/user.controller.js'; // import the controllers responsible for registering, logging and logout a user
import { upload } from '../middlewares/multer.middleware.js'; // import the multer middleware used to handle file uploads
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router(); // create a new router instance, all user-related routes will be attached to this router

// define the '/register' route
// before the request reaches the registerUser controller, multer processes the uploaded files and temporarily stores them on the local server
// expected files: avatar(maximum 1 file), coverImage(maximum 1 file)
// after the files are processed, th registerUser controller executes
// since app.js uses: app.use('/api/v1/users', userRouter)
// the final endpoint becomes: POST  /api/v1/users/register
router.route('/register').post(
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 },
    ]),
    registerUser
);

router.route('/login').post(loginUser)

router.route('/logout').post(verifyJWT, logoutUser)

export default router;