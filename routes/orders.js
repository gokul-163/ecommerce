const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', protect, [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').isMongoId().withMessage('Invalid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shippingAddress.name').notEmpty().withMessage('Shipping name is required'),
  body('shippingAddress.phone').notEmpty().withMessage('Shipping phone is required'),
  body('shippingAddress.street').notEmpty().withMessage('Shipping street is required'),
  body('shippingAddress.city').notEmpty().withMessage('Shipping city is required'),
  body('shippingAddress.state').notEmpty().withMessage('Shipping state is required'),
  body('shippingAddress.zipCode').notEmpty().withMessage('Shipping zip code is required'),
  body('shippingAddress.country').notEmpty().withMessage('Shipping country is required'),
  body('paymentMethod').isIn(['credit_card', 'debit_card', 'paypal', 'stripe', 'cash_on_delivery']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { items, shippingAddress, billingAddress, paymentMethod } = req.body;

    // Validate products and calculate prices
    let itemsPrice = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.product} not found`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      // Calculate price (consider sale price if available)
      const price = product.onSale && product.salePercentage 
        ? product.price * (1 - product.salePercentage / 100)
        : product.price;

      itemsPrice += price * item.quantity;

      orderItems.push({
        product: item.product,
        name: product.name,
        quantity: item.quantity,
        price: price,
        image: product.images[0]?.url || '',
        size: item.size,
        color: item.color
      });

      // Update stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Calculate shipping and tax
    const shippingPrice = itemsPrice > 100 ? 0 : 10; // Free shipping over $100
    const taxPrice = itemsPrice * 0.08; // 8% tax
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    // Use shipping address as billing address if not provided
    const finalBillingAddress = billingAddress || shippingAddress;

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      billingAddress: finalBillingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paymentInfo: {
        id: 'pending',
        status: 'pending',
        method: paymentMethod
      }
    });

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.product', 'name images');

    const total = await Order.countDocuments({ user: req.user.id });
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/orders/:id/pay
// @desc    Update order to paid
// @access  Private
router.put('/:id/pay', protect, [
  body('paymentInfo.id').notEmpty().withMessage('Payment ID is required'),
  body('paymentInfo.status').notEmpty().withMessage('Payment status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    order.paymentInfo = req.body.paymentInfo;
    await order.save();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Update order payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin'), [
  body('orderStatus')
    .isIn(['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'])
    .withMessage('Invalid order status'),
  body('trackingNumber').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const { orderStatus, trackingNumber } = req.body;

    order.orderStatus = orderStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    // Set timestamps for status changes
    if (orderStatus === 'Shipped' && !order.shippedAt) {
      order.shippedAt = Date.now();
    }
    if (orderStatus === 'Delivered' && !order.deliveredAt) {
      order.deliveredAt = Date.now();
    }

    await order.save();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/orders/admin/all
// @desc    Get all orders (Admin only)
// @access  Private/Admin
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {};

    // Filter by status
    if (req.query.status) {
      query.orderStatus = req.query.status;
    }

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate('items.product', 'name');

    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;




