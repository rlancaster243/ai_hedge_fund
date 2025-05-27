// models/User.ts
import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  username: { 
    type: String, 
    required: [true, 'Username is required.'],
    unique: true, // Assuming usernames should be unique
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'Email is required.'],
    unique: true, // Assuming emails should be unique
    trim: true,
    lowercase: true, // Store emails in lowercase
    match: [/.+\@.+\..+/, 'Please fill a valid email address'] // Basic email validation
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// The `models.User` check prevents redefining the model if it's already been compiled,
// which can happen in Next.js's hot-reloading environment.
export default models.User || model('User', UserSchema);
