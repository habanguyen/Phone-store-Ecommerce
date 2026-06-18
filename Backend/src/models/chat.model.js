const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    messages: [{
        sender: { type: String, enum: ["user", "admin"], required: true },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        slots: { type: Object, default: {} }
    }],
    // Slots context - lưu trữ các slot đã được fill
    slots: {
        budget: { type: Object, default: null },
        brand: { type: String, default: null },
        color: { type: String, default: null },
        storage: { type: Object, default: null },
        features: { type: [String], default: [] },
        usage: { type: String, default: null }
    },
    memory: {
        budget: { type: Object, default: null },
        preferred_brand: { type: String, default: null },
        usage: { type: String, default: null },
        rejected_products: { type: [String], default: [] },
        previous_intents: { type: [String], default: [] }
    },
    currentIntent: { type: String, default: null },
    pendingSlot: { type: String, default: null },
    // Session management
    sessionConfirmed: { type: Boolean, default: true },
    sessionStartedAt: { type: Date, default: Date.now },
    lastActivityAt: { type: Date, default: Date.now },
    sessionResetsAt: { type: Date, default: null },
    // Chat status
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// TTL Index - auto delete inactive chats after 24 hours
chatSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model("Chat", chatSchema);