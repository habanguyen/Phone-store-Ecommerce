const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'resolved', 'closed'],
      default: 'new'
    },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reply: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contact', contactSchema);
