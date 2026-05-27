# Payment System Setup Guide

This document explains how to set up and use the payment system for RideWave, which implements a production-level payment flow with Razorpay integration.

## Overview

The payment system follows this flow:
1. **Booking Time**: Passenger pays 25% upfront
2. **Ride Completion**: Passenger pays remaining 75%
3. **3-Hour Delay**: Driver earnings are released to wallet (after 10% platform commission)
4. **Payout**: Driver can withdraw earnings to bank account

## Prerequisites

### 1. Razorpay Account
- Sign up at [Razorpay](https://razorpay.com)
- Get your API Key ID and Key Secret from Dashboard
- Enable RazorpayX for payouts (optional, for automatic bank transfers)

### 2. Redis Server
- Install Redis locally or use a cloud Redis service
- Default: `localhost:6379`

### 3. Environment Variables

Add the following to your `backend/.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_ACCOUNT_NUMBER=your_razorpay_account_number

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Installation

Install the required npm packages:

```bash
cd backend
npm install
```

The following packages are included:
- `razorpay` - Razorpay SDK
- `bullmq` - Job queue for delayed payouts
- `ioredis` - Redis client

## Database Schema Updates

The payment system adds new fields to existing models and creates new models:

### Updated Models

**Ride Model** - Added payment fields:
- `totalFare` - Total fare for the ride
- `upfrontPaid` - 25% upfront amount paid
- `remainingAmount` - 75% remaining amount
- `commissionPercent` - Platform commission (default 10%)
- `driverEarning` - Driver's earning after commission
- `paymentStatus` - PENDING, PARTIAL_PAID, FULL_PAID, RELEASED
- `razorpayOrderId` - Razorpay order ID
- `razorpayPaymentId` - Razorpay payment ID
- `payoutReleaseAt` - Timestamp for scheduled payout

**Booking Model** - Added status:
- `status` - Now includes "pending_payment" state

### New Models

**Wallet Model** - Driver wallet:
- `userId` - Reference to User
- `balance` - Available balance for withdrawal
- `pendingBalance` - Balance waiting for release
- `totalEarnings` - Total lifetime earnings
- `totalWithdrawn` - Total amount withdrawn

**Transaction Model** - Payment tracking:
- `userId` - User reference
- `rideId` - Ride reference
- `type` - CREDIT, DEBIT, PENDING_CREDIT, RELEASED_CREDIT
- `amount` - Transaction amount
- `description` - Transaction description
- `status` - PENDING, COMPLETED, FAILED, CANCELLED
- `razorpayPaymentId` - Razorpay payment reference
- `razorpayOrderId` - Razorpay order reference
- `razorpayPayoutId` - Razorpay payout reference
- `metadata` - Additional data

## API Endpoints

### Payment Endpoints

#### Create Upfront Payment Order
```http
POST /api/payments/upfront-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "rideId": "ride_id_here"
}
```

Response:
```json
{
  "orderId": "order_xxxxx",
  "amount": 250,
  "currency": "INR",
  "keyId": "rzp_xxxxx"
}
```

#### Verify Upfront Payment
```http
POST /api/payments/verify-upfront
Authorization: Bearer <token>
Content-Type: application/json

{
  "rideId": "ride_id_here",
  "paymentId": "pay_xxxxx",
  "signature": "signature_here"
}
```

#### Create Remaining Payment Order
```http
POST /api/payments/remaining-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "rideId": "ride_id_here"
}
```

#### Verify Remaining Payment
```http
POST /api/payments/verify-remaining
Authorization: Bearer <token>
Content-Type: application/json

{
  "rideId": "ride_id_here",
  "paymentId": "pay_xxxxx",
  "signature": "signature_here"
}
```

### Updated Booking Endpoints

#### Create Booking (Now Requires Payment)
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "rideId": "ride_id_here",
  "seatNumbers": ["1", "2"]
}
```

Response (with payment requirement):
```json
{
  "booking": { ... },
  "paymentOrder": {
    "orderId": "order_xxxxx",
    "amount": 250,
    "currency": "INR",
    "keyId": "rzp_xxxxx"
  },
  "requiresPayment": true,
  "upfrontAmount": 250
}
```

#### Confirm Booking After Payment
```http
POST /api/bookings/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": "booking_id_here",
  "paymentId": "pay_xxxxx",
  "signature": "signature_here"
}
```

### Updated Ride Endpoints

#### Complete Ride (Triggers 75% Payment)
```http
POST /api/rides/:id/complete-order
Authorization: Bearer <token>
```

#### Complete Ride with Payment
```http
POST /api/rides/:id/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentId": "pay_xxxxx",
  "signature": "signature_here"
}
```

## Frontend Integration

### Booking Flow

1. User selects seats and clicks "Book"
2. Backend creates pending booking and Razorpay order
3. Frontend loads Razorpay checkout
4. User pays 25% upfront
5. Payment verified → Booking confirmed → Seats booked

Example code:
```typescript
const bookRide = async () => {
  // Lock seats first
  await api.post(`/api/rides/${rideId}/seats/lock`, { seatNumbers });
  
  // Create booking (returns payment order)
  const bookingResponse = await api.post("/api/bookings", { rideId, seatNumbers });
  
  if (bookingResponse.requiresPayment) {
    // Load Razorpay and open checkout
    const options = {
      key: bookingResponse.paymentOrder.keyId,
      amount: bookingResponse.paymentOrder.amount * 100,
      currency: "INR",
      order_id: bookingResponse.paymentOrder.orderId,
      handler: async (response) => {
        // Verify and confirm booking
        await api.post("/api/bookings/confirm", {
          bookingId: bookingResponse.booking._id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });
      },
    };
    const rzp = new Razorpay(options);
    rzp.open();
  }
};
```

### Ride Completion Flow

1. Driver clicks "Complete Ride"
2. Backend creates Razorpay order for 75% remaining
3. Passenger pays remaining amount
4. Payment verified → Ride completed → Driver earning calculated
5. Driver earning added to pending balance
6. Payout scheduled for 3 hours later

## Payout System

### How It Works

1. When ride completes with full payment:
   - Driver earning calculated (75% - 10% commission)
   - Amount added to driver's `pendingBalance`
   - Transaction created with status "PENDING_CREDIT"
   - Job added to BullMQ queue with 3-hour delay

2. After 3 hours:
   - Worker processes the job
   - Amount moved from `pendingBalance` to `balance`
   - Transaction status updated to "RELEASED_CREDIT"
   - Driver can now withdraw

3. RazorpayX Payout (Optional):
   - If configured, automatic bank transfer triggered
   - Funds transferred to driver's bank account

### Payout Worker

The payout worker runs automatically when the backend starts:
- Listens to "driver-payouts" queue
- Processes delayed jobs after 3 hours
- Moves funds from pending to available balance
- Handles retries on failure

## Commission Calculation

The platform takes a 10% commission on the remaining 75% payment:

Example:
- Total fare: ₹1000
- Upfront (25%): ₹250
- Remaining (75%): ₹750
- Commission (10% of ₹750): ₹75
- Driver earning: ₹750 - ₹75 = ₹675

## Testing

### Test Mode

Razorpay provides test mode for development:
- Use test API keys
- Use test card numbers for payments
- No real money is charged

### Test Card Numbers

Razorpay test cards:
- Success: `4242 4242 4242 4242`
- Any expiry date (future)
- Any CVV
- Any name

### Local Testing

1. Start Redis:
```bash
redis-server
```

2. Start backend:
```bash
cd backend
npm run dev
```

3. Test booking flow in frontend

## Security Considerations

1. **Never expose Razorpay Key Secret** in frontend
2. **Always verify payment signatures** on backend
3. **Use HTTPS in production** for payment pages
4. **Implement idempotency** to prevent duplicate payments
5. **Secure Redis** with password in production
6. **Monitor payout jobs** for failures

## Troubleshooting

### Redis Connection Failed
- Ensure Redis is running: `redis-server`
- Check REDIS_HOST and REDIS_PORT in .env
- Verify Redis password if set

### Razorpay Payment Failed
- Check API keys are correct
- Verify order amount is in paise (amount * 100)
- Check Razorpay dashboard for payment status

### Payout Not Released
- Check BullMQ worker is running
- Verify Redis connection
- Check job logs in Redis
- Manually trigger: `releaseDriverPayment(rideId)`

## Production Checklist

- [ ] Use production Razorpay API keys
- [ ] Enable RazorpayX for automatic payouts
- [ ] Set up Redis with persistence
- [ ] Configure Redis password
- [ ] Enable HTTPS
- [ ] Set up Razorpay webhooks
- [ ] Monitor BullMQ queue
- [ ] Set up payout failure alerts
- [ ] Configure driver bank account collection
- [ ] Implement refund system
- [ ] Add fraud detection

## Webhooks (Optional)

Set up Razorpay webhooks to handle:
- `payment.captured` - Payment successful
- `payment.failed` - Payment failed
- `refund.processed` - Refund processed

Webhook endpoint to be implemented at `/api/payments/webhook`

## Support

For issues:
1. Check backend logs
2. Verify Redis connection
3. Check Razorpay dashboard
4. Review BullMQ job status
