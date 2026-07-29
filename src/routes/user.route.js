// this file defines all routes related to users
// routes map incoming requests to their corresponding controller functions, they decide which controller should handle a specific request

import { Router } from 'express';   // import the Router class from express, Router allows us to group related routes together instead of defining every route inside app.js
import { registerUser } from '../controllers/user.controller.js';   // import the controller responsible for registering a new user

const router = Router() // create a new router instance, all user-related routes will be attached to this router

// define the '/register' route
// when a POST request is made to this route, the registerUser controller will be executed
// since app.js uses: app.use('/api/v1/users', userRouter)
// the final endpoint becomes: POST  /api/v1/users/register
router.route('/register').post(registerUser)

export default router