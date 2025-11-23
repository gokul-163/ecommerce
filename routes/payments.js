const express = require('express');
const { body, validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/payments/create-payment-intent
// @desc    Create payment intent for Stripe
// @access  Private
router.post('/create-payment-intent', protect, [
  body('amount')
    .isFloat({ min: 0.5 })
    .withMessage('Amount must be at least $0.50'),
  body('currency')
    .optional()
    .isIn(['usd', 'eur', 'gbp'])
    .withMessage('Invalid currency')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { amount, currency = 'usd' } = req.body;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      metadata: {
        userId: req.user.id,
        userName: req.user.name
      }
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed'
    });
  }
});

// @route   POST /api/payments/confirm-payment
// @desc    Confirm payment and update order
// @access  Private
router.post('/confirm-payment', protect, [
  body('paymentIntentId')
    .notEmpty()
    .withMessage('Payment intent ID is required'),
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { paymentIntentId, orderId } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update order payment info
      const Order = require('../models/Order');
      const order = await Order.findById(orderId);

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

      order.paymentInfo = {
        id: paymentIntentId,
        status: 'succeeded',
        method: 'stripe'
      };

      await order.save();

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          orderId: order._id,
          paymentStatus: 'succeeded'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment confirmation failed'
    });
  }
});

// @route   POST /api/payments/webhook
// @desc    Stripe webhook handler
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      // Handle successful payment
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      // Handle failed payment
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// @route   GET /api/payments/methods
// @desc    Get available payment methods
// @access  Public
router.get('/methods', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'credit_card',
        name: 'Credit Card',
        description: 'Pay with Visa, Mastercard, American Express',
        icon: '💳'
      },
      {
        id: 'debit_card',
        name: 'Debit Card',
        description: 'Pay with your debit card',
        icon: '💳'
      },
      {
        id: 'paypal',
        name: 'PayPal',
        description: 'Pay with your PayPal account',
        icon: '🔵'
      },
      {
        id: 'cash_on_delivery',
        name: 'Cash on Delivery',
        description: 'Pay when you receive your order',
        icon: '💰'
      }
    ]
  });
});

module.exports = router;




