
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Instructor Portal account.
// Passwords are securely stored using bcrypt.

const instructorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    department: { type: String },
    role: { type: String, default: 'instructor' },

    // Sensitive fields
    apiKey: { type: String },
    privateEmail: { type: String },
    privatePhone: { type: String }
  },
  { timestamps: true }
);

// Hash password before saving if it has been modified.
instructorSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

export const Instructor = mongoose.model(
  'Instructor',
  instructorSchema
);
