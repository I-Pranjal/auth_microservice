# Authentication Service API Documentation

This microservice handles user authentication, registration, and user information management. It provides secure JWT-based authentication for the chat application.

**Base URL:** `http://localhost:5001/api/auth`

---

## API Endpoints

### 1. User Registration

**Endpoint:** `POST /api/auth/register`

**Purpose:**  
Registers a new user in the authentication system. This endpoint creates a new user account with hashed password storage and automatically initializes the user profile in the connected user service.

**Authentication Required:** No

**Request Body:**
```json
{
  "name": "string (required)",
  "contact": "string (required)",
  "password": "string (required)"
}
```

**Request Parameters:**
- `name` (string, required): Full name of the user
- `contact` (string, required): Unique contact identifier (phone number or email)
- `password` (string, required): User's password (will be hashed before storage)

**Success Response:**
- **Status Code:** `201 Created`
- **Response Body:**
```json
{
  "message": "User registered successfully",
  "userName": "John Doe",
  "userId": "507f1f77bcf86cd799439011",
  "contact": "+1234567890",
  "password": "$2a$10$hashedPasswordString"
}
```

**Error Responses:**

1. **Missing Fields**
   - **Status Code:** `400 Bad Request`
   - **Response Body:**
   ```json
   {
     "message": "All fields are required"
   }
   ```

2. **User Already Exists**
   - **Status Code:** `400 Bad Request`
   - **Response Body:**
   ```json
   {
     "message": "User already exists, try to login"
   }
   ```

3. **Server Error**
   - **Status Code:** `500 Internal Server Error`
   - **Response Body:**
   ```json
   {
     "message": "Internal server error",
     "error": "Error details"
   }
   ```

**Usage Instructions:**
1. Send a POST request with user details in JSON format
2. Ensure all three fields (name, contact, password) are provided
3. Use a unique contact identifier that hasn't been registered before
4. Upon successful registration, save the returned `userId` for future operations
5. The service automatically syncs user data with the user microservice at `http://localhost:5002`

**Example cURL Request:**
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "contact": "+1234567890",
    "password": "securePassword123"
  }'
```

---

### 2. User Login

**Endpoint:** `POST /api/auth/login`

**Purpose:**  
Authenticates existing users and provides JWT access and refresh tokens for subsequent API calls. This endpoint validates user credentials and returns tokens that must be used for accessing protected routes.

**Authentication Required:** No

**Request Body:**
```json
{
  "contact": "string (required)",
  "password": "string (required)"
}
```

**Request Parameters:**
- `contact` (string, required): User's registered contact identifier
- `password` (string, required): User's password

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "contact": "+1234567890"
  }
}
```

**Error Responses:**

1. **User Not Found**
   - **Status Code:** `400 Bad Request`
   - **Response Body:**
   ```json
   {
     "message": "User not found, please register"
   }
   ```

2. **Invalid Credentials**
   - **Status Code:** `400 Bad Request`
   - **Response Body:**
   ```json
   {
     "message": "Invalid credentials"
   }
   ```

3. **Server Error**
   - **Status Code:** `500 Internal Server Error`
   - **Response Body:**
   ```json
   {
     "message": "Internal server error"
   }
   ```

**Usage Instructions:**
1. Send a POST request with the registered contact and password
2. Store the returned `accessToken` securely (e.g., in memory, local storage, or secure cookie)
3. Store the `refreshToken` for obtaining new access tokens when the current one expires
4. Include the `accessToken` in the Authorization header for all protected API calls
5. The access token expires after 1 day (configurable via JWT_SECRET)
6. Use the refresh token to get a new access token without requiring the user to log in again

**Token Usage:**  
After successful login, use the access token in subsequent requests:
```
Authorization: Bearer <accessToken>
```

**Example cURL Request:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "contact": "+1234567890",
    "password": "securePassword123"
  }'
```

---

### 3. Get User Information

**Endpoint:** `GET /api/auth/me`

**Purpose:**  
Retrieves the authenticated user's profile information. This endpoint is protected and requires a valid JWT token. It returns user details excluding sensitive information like passwords.

**Authentication Required:** Yes (Bearer Token)

**Request Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:** None

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "contact": "+1234567890",
  "createdAt": "2025-12-15T10:30:00.000Z",
  "updatedAt": "2025-12-15T10:30:00.000Z"
}
```

**Response Fields:**
- `_id`: Unique user identifier
- `name`: User's full name
- `contact`: User's contact identifier
- `createdAt`: Timestamp when the user account was created
- `updatedAt`: Timestamp when the user account was last updated
- **Note:** Password fields are excluded from the response for security

**Error Responses:**

1. **No Token Provided**
   - **Status Code:** `401 Unauthorized`
   - **Response Body:**
   ```json
   {
     "message": "No token provided"
   }
   ```

2. **Invalid or Expired Token**
   - **Status Code:** `401 Unauthorized`
   - **Response Body:**
   ```json
   {
     "message": "Invalid or expired token"
   }
   ```

3. **User Not Found**
   - **Status Code:** `404 Not Found`
   - **Response Body:**
   ```json
   {
     "message": "User not found"
   }
   ```

4. **Server Error**
   - **Status Code:** `500 Internal Server Error`
   - **Response Body:**
   ```json
   {
     "message": "Internal server error"
   }
   ```

**Usage Instructions:**
1. Obtain an access token by logging in via `/api/auth/login`
2. Include the token in the Authorization header as: `Bearer <accessToken>`
3. Send a GET request to retrieve your user information
4. The endpoint automatically identifies the user from the JWT token
5. Use this endpoint to verify token validity and fetch current user data
6. The password fields are automatically filtered out from the response

**Example cURL Request:**
```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Authentication Middleware

### Token-Based Authentication

The service uses JWT (JSON Web Tokens) for authentication. Protected routes require a valid Bearer token in the Authorization header.

**Token Format:**
```
Authorization: Bearer <your_jwt_token>
```

**Token Validation Process:**
1. The middleware extracts the token from the Authorization header
2. Verifies the token using the JWT_SECRET environment variable
3. Decodes the token to extract the user ID
4. Attaches the `userId` to the request object for use in route handlers
5. Allows the request to proceed if valid, or returns 401 if invalid/expired

**Protected Endpoints:**
- `GET /api/auth/me` - Requires valid JWT token

---

## Environment Variables

The following environment variables must be configured:

```
PORT=5001                          # Server port
MONGODB_URI=<your_mongodb_uri>     # MongoDB connection string
JWT_SECRET=<your_jwt_secret>       # Secret key for JWT signing
```

---

## Data Model

### User Schema

```javascript
{
  name: String (required),
  contact: String (required, unique),
  password: String (required, hashed),
  UnsaltedPassword: String (required),
  createdAt: Timestamp (auto-generated),
  updatedAt: Timestamp (auto-generated)
}
```

**Note:** Passwords are hashed using bcrypt with a salt factor of 10 before storage.

---

## Integration Notes

1. **User Service Integration:**  
   Upon successful registration, this service automatically calls the user microservice at `http://localhost:5002/api/users/init` to initialize the user profile with basic information.

2. **Token Expiration:**  
   - Access tokens expire after 1 day (configurable)
   - Refresh tokens can be used to obtain new access tokens

3. **Password Security:**  
   - Passwords are hashed using bcrypt before storage
   - Original passwords are never returned in API responses (except during registration for backward compatibility)

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "message": "Error description",
  "error": "Detailed error (only in development)"
}
```

Common HTTP status codes used:
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server-side error

---

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env` file

3. Start the service:
   ```bash
   npm start
   ```

4. The service will be available at `http://localhost:5001`

5. Root endpoint (`/`) returns: "Auth Service Running 🚀"

---

## Security Considerations

1. **Password Storage:** Passwords are hashed using bcrypt before storage
2. **JWT Tokens:** Use strong JWT_SECRET in production
3. **CORS:** Enable appropriate CORS settings for your frontend domain
4. **HTTPS:** Always use HTTPS in production environments
5. **Token Expiration:** Tokens expire after 1 day; implement refresh token logic
6. **Rate Limiting:** Consider implementing rate limiting for login/register endpoints

---

## Support

For issues or questions, please contact the development team or refer to the main project documentation.