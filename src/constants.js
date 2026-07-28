// this file stores values that are used in multiple places throughout the application
// instead of hardcoding the same value in different files, we keep it here and import it whenever needed

// name of the mongodb database
// this value is combines with the mongodb connection URL while connecting to the database
// eg ->  MONGODB_URI = mongodb://localhost:27017 | DB_NAME = streamhive
// final connection URL: mongodb://localhost:27017/streamhive
export const DB_NAME = 'streamhive'