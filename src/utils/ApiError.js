// ApiError is a custom error class that extends JS build-in error class
// it is used to create consistent error objects throughout the application
// instead of throwing: throw new Error('User not found')
// we can throw: throw new ApiError(404, 'User not found')
// this allows us to include additional info like: 
// - HTTP status code
// - success status
// - error details
// - stack trace
// a custom error object makes it easier for the global error-handling middleware to send a consistent response to the client
class ApiError extends Error {
    constructor(
        statusCode,
        message = 'Something went wrong',
        errors = [],
        stack = ''
    ) {
        super(message); // call the parent error class constructor, this initializes built-in properties like 'message'
        this.statusCode = statusCode;   // store the HTTP status code (eg, 400, 401, 404, 500)
        this.data = null;   // error responses usually don't contain any data
        this.message = message; // store the error message, super(message) already sets this.message, but many projects assign it again for readability
        this.success = false;   // indicates that the request was unsuccessful
        this.errors = errors;   // store any additional error details, this is useful for validation errors where multiple error messages may exist

        // if a custom stack trace is provided, use that stack trace
        if (stack) {
            this.stack = stack;
        // otherwise generate a new stack trace automatically
        // 'this' refers to the current ApiError object
        // 'this.constructor' tells JS to start the stack trace from where ApiError was created, instead of including internal constructor calls
        // this produces a cleaner and more useful stack trace for debugging
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };