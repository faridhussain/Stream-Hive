// this utility is used to automatically catch errors that occur inside asynchronous controllers
// with this utility, every async controller would require its own try...catch block, resulting in repetitive code
// instead, asyncHandler wraps the controller and forwards any error to express's error-handling middleware using next(error)

// asyncHandler catches any error thrown while executing an asynchronous controller
// eg -> database query failures, cloudinary upload failures, JWT generation errors
// it does not handle server startup errors, database connection errors, syntax errors, those are handled elsewhere in the application

// asyncHandler is a higher-order function, it accepts another function (the controller) as an argument
const asyncHandler = (requestHandler) => {
    // return a new function that express will call whenever a request is made to the route
    return (req, res, next) => {
        // execute the controller and wrap its return value inside a promise
        // if requestHandler already returns a promise (because it is async), Promise.resolve() simply returns it
        // if it returns a normal value, Promise.resolve() converts it into a resolved Promise so we always have a Promise to work with
        Promise.resolve(requestHandler(req, res, next))
            // if the promise is rejected or the controller throws an error, .catch() executes
            .catch(
                (error) => next(error) // pass the error to express, express then forwards it to the global error-handling middleware
            );
    };
};

export { asyncHandler };

// another way
// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next);
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };
