# Same MLI Connect Backend

Backend API for Same MLI Connect - A service marketplace platform connecting service providers with customers.

## Features

- User authentication and authorization (JWT)
- Service provider and customer management
- Service listings and categories
- Booking and appointment system
- HTTP-based messaging with polling
- File upload with Cloudinary integration
- Email notifications
- Rate limiting and security middleware
- API documentation with Swagger

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary
- **Messaging**: HTTP API with polling
- **Language**: TypeScript
- **Testing**: Jest
- **Documentation**: Swagger

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB database
- Cloudinary account (for file uploads)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/GlowyManYt/SameliServer.git
cd SameliServer
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your configuration values.

4. Build the project:
```bash
npm run build
```

5. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## API Documentation

Once the server is running, visit `http://localhost:5000/api-docs` to view the Swagger documentation.

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set the following environment variables in Vercel dashboard
4. Deploy!

The project includes a `vercel.json` configuration file for seamless deployment.

## Environment Variables

See `.env.example` for all required environment variables.

## License

MIT License
