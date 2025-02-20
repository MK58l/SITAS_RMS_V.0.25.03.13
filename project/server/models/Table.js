import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: Number,
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true
  },
  isReserved: {
    type: Boolean,
    default: false
  },
  qrCode: {
    type: String,
    required: true
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  reservation: {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: Date,
    time: String,
    duration: Number
  }
}, { timestamps: true });

export default mongoose.model('Table', tableSchema);