import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb'; // Adjusted import path
import User from '@/models/User'; // Adjusted import path

// Handler for GET requests to fetch all users
export async function GET() {
  try {
    await dbConnect();
    const users = await User.find({});
    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error) {
    console.error('GET /api/users error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: 'Server Error: ' + errorMessage }, { status: 500 });
  }
}

// Handler for POST requests to create a new user
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Basic validation
    if (!body.username || !body.email) {
      return NextResponse.json({ success: false, error: 'Username and email are required' }, { status: 400 });
    }

    const user = await User.create(body);
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/users error:', error);
    if (error.name === 'ValidationError') {
      // Extract validation messages
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({ success: false, error: messages.join(', ') }, { status: 400 });
    }
    if (error.code === 11000) { // Duplicate key error
      return NextResponse.json({ success: false, error: 'User with this username or email already exists.' }, { status: 409 }); // 409 Conflict
    }
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: 'Server Error: ' + errorMessage }, { status: 500 });
  }
}
