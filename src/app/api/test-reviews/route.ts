import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Test GET endpoint working',
    timestamp: new Date().toISOString(),
    method: 'GET'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      message: 'Test POST endpoint working',
      timestamp: new Date().toISOString(),
      method: 'POST',
      receivedData: body
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      message: 'Test POST endpoint working but failed to parse JSON',
      timestamp: new Date().toISOString(),
      method: 'POST',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 });
  }
} 