# MERN Stack E-commerce Website

A modern, full-stack e-commerce application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring a beautiful UI, secure authentication, payment processing, and comprehensive admin panel.

## 🚀 Features

### Frontend (React.js)
- **Modern UI/UX**: Beautiful, responsive design with smooth animations
- **Product Catalog**: Advanced filtering, sorting, and search functionality
- **Shopping Cart**: Persistent cart with real-time updates
- **User Authentication**: Secure login/register with JWT tokens
- **User Dashboard**: Profile management, order history, wishlist
- **Checkout Process**: Multi-step checkout with payment integration
- **Admin Panel**: Comprehensive admin dashboard for managing products, orders, and users
- **Responsive Design**: Mobile-first approach with excellent mobile experience

### Backend (Node.js + Express.js)
- **RESTful API**: Well-structured API endpoints with proper error handling
- **Authentication**: JWT-based authentication with role-based access control
- **File Upload**: Image upload with Cloudinary integration
- **Payment Processing**: Stripe integration for secure payments
- **Email Notifications**: Order confirmations and status updates
- **Data Validation**: Input validation and sanitization
- **Security**: Rate limiting, CORS, helmet, and other security measures

### Database (MongoDB)
- **User Management**: User profiles, authentication, and role management
- **Product Management**: Comprehensive product catalog with categories, brands, and variants
- **Order Management**: Complete order lifecycle with status tracking
- **Review System**: Product reviews and ratings
- **Inventory Management**: Stock tracking and management

## 🛠️ Tech Stack

### Frontend
- **React.js 18** - UI library
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **React Query** - Server state management
- **Framer Motion** - Animations
- **Styled Components** - CSS-in-JS
- **React Icons** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload
- **Cloudinary** - Image hosting
- **Stripe** - Payment processing
- **Nodemailer** - Email sending

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Nodemon** - Development server
- **Concurrently** - Run multiple commands

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mern-ecommerce
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `config.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mern-ecommerce
   JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
   STRIPE_SECRET_KEY=your_stripe_secret_key_here
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Start the backend server**
   ```bash
   npm run server
   ```

### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Start the frontend development server**
   ```bash
   npm start
   ```

### Running Both Servers

From the root directory:
```bash
npm run dev
```

This will start both the backend (port 5000) and frontend (port 3000) servers concurrently.

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `config.env`

### Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Create database: `mern-ecommerce`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT secret key | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | No |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | No |
| `CLOUDINARY_API_KEY` | Cloudinary API key | No |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | No |

### Third-Party Services

#### Stripe (Payments)
1. Create a Stripe account
2. Get your API keys
3. Update `STRIPE_SECRET_KEY` in environment

#### Cloudinary (Image Hosting)
1. Create a Cloudinary account
2. Get your cloud name and API credentials
3. Update Cloudinary variables in environment

## 📁 Project Structure

```
mern-ecommerce/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux store and slices
│   │   ├── utils/         # Utility functions
│   │   └── App.js         # Main App component
│   └── package.json
├── models/                # MongoDB models
├── routes/                # API routes
├── middleware/            # Custom middleware
├── uploads/               # File uploads
├── server.js             # Express server
├── package.json
└── README.md
```

## 🚀 Deployment

### Backend Deployment (Heroku)
1. Create a Heroku account
2. Install Heroku CLI
3. Create a new Heroku app
4. Set environment variables
5. Deploy:
   ```bash
   git push heroku main
   ```

### Frontend Deployment (Netlify/Vercel)
1. Build the React app:
   ```bash
   cd client
   npm run build
   ```
2. Deploy the `build` folder to your preferred platform

## 🧪 Testing

### Backend Testing
```bash
npm test
```

### Frontend Testing
```bash
cd client
npm test
```

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update-profile` - Update user profile

### Product Endpoints
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Order Endpoints
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/pay` - Update payment status

### Payment Endpoints
- `POST /api/payments/create-payment-intent` - Create Stripe payment intent
- `POST /api/payments/confirm-payment` - Confirm payment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/mern-ecommerce/issues) page
2. Create a new issue with detailed information
3. Contact the maintainers

## 🙏 Acknowledgments

- [React.js](https://reactjs.org/) - UI library
- [Express.js](https://expressjs.com/) - Web framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Stripe](https://stripe.com/) - Payment processing
- [Cloudinary](https://cloudinary.com/) - Image hosting

---

**Happy Coding! 🎉**




