import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // For now, we'll return basic alert rules configuration
    // In a real application, this would be stored in a database table
    const alertRules = {
      lowStockThreshold: 10, // Default low stock threshold
      expiryWarningDays: 30, // Days before expiry to warn
      autoResolveAlerts: true,
      notificationMethods: {
        email: true,
        inApp: true,
        sms: false,
      },
      alertTypes: {
        LOW_STOCK: {
          enabled: true,
          severity: 'medium',
          autoCreate: true,
        },
        EXPIRY: {
          enabled: true,
          severity: 'medium',
          autoCreate: true,
        },
        REORDER: {
          enabled: false,
          severity: 'low',
          autoCreate: false,
        },
      },
    };

    return NextResponse.json(alertRules);
  } catch (error) {
    console.error('Error fetching alert rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      lowStockThreshold,
      expiryWarningDays,
      autoResolveAlerts,
      notificationMethods,
      alertTypes,
    } = body;

    // In a real application, this would update the alert rules in the database
    // For now, we'll just return success
    console.log('Alert rules updated:', body);

    return NextResponse.json({ 
      message: 'Alert rules updated successfully',
      rules: body 
    });
  } catch (error) {
    console.error('Error updating alert rules:', error);
    return NextResponse.json(
      { error: 'Failed to update alert rules' },
      { status: 500 }
    );
  }
}