// ApiResponse is a custom class used to create a consistent success response throughout the application
// // instead of sending different response formats from every controller:
// res.json(user)
// res.json({ user, token })
// res.json({ data: videos })
// we can use:
// res.status(200).json(
//     new ApiResponse(200, user, 'User fetched successfully')
// )
// this ensures every successful response has the same structure
// eg ->
// {
//     'statusCode': 200,
//     'data': { ... },
//     'message': 'User fetched successfully',
//     'success': true
// }
class ApiResponse {
    constructor(statusCode, data, message = 'Success') {
        this.statusCode = statusCode; // store the HTTP status code, eg -> 200, 201, 204
        this.data = data; // store the actual data that should be sent back to the client
        this.message = message; // store a success message, if no message is provided, 'Success' is used by default
        this.success = statusCode < 400; // automatically determine whether the request was successful, HTTP status codes below 400 represent successful responses
    }
}