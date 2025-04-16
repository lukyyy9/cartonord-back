# 🗺️ CartNord Backend

Backend API for the CartNord application, providing a robust interface for managing interactive maps.

## Technologies Used

- **Node.js & Express**: Fast, minimalist web framework for Node.js
- **TypeScript**: Typed JavaScript for better developer experience
- **MariaDB**: Open-source relational database
- **JWT**: JSON Web Tokens for secure authentication
- **AWS S3**: Cloud storage for map files
- **Docker**: Containerization for easy deployment

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MariaDB or MySQL server
- AWS S3 account or S3-compatible storage

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy the example environment file:
   ```
   cp .env.example .env
   ```
4. Update the `.env` file with your configuration:
   - Database credentials
   - JWT secret
   - AWS credentials

### Database Setup

The application uses Sequelize ORM to automatically create and manage database tables. When you start the server:

1. Sequelize will automatically create all needed tables from the model definitions
2. The default admin user will be automatically created
   
Make sure your database credentials are properly set in the `.env` file:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=cartonord
DB_FORCE_RESET=false  # Set to true to recreate tables (development only)
```

### Running the Application

Development mode:
```
npm run dev
```

Production build:
```
npm run build
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/profile` - Get user profile (authenticated)
- `PUT /api/auth/profile` - Update user profile (authenticated)

### Maps

- `GET /api/maps` - Get all maps (public & published)
- `GET /api/maps/:id` - Get a map by ID
- `GET /api/maps/slug/:slug` - Get a map by slug
- `POST /api/maps` - Create a new map (authenticated)
- `PUT /api/maps/:id` - Update a map (authenticated)
- `DELETE /api/maps/:id` - Delete a map (authenticated)
- `GET /api/maps/user` - Get maps for the authenticated user

### File Uploads

- `POST /api/maps/upload-url` - Get a presigned URL for file upload (authenticated)
- `PUT /api/maps/:id/file` - Update file URL in map record after upload (authenticated)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected endpoints:

1. Obtain a token via login or registration
2. Include the token in the Authorization header:
   ```
   Authorization: Bearer <your_token>
   ``` 