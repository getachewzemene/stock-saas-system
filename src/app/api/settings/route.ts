import { NextRequest, NextResponse } from 'next/server';

// Mock settings data - in a real app, this would come from a database
const mockSettings = {
  company: {
    name: "Stock Pro Demo",
    email: "info@stockpro.com",
    phone: "+251911123456",
    address: "Addis Ababa, Ethiopia",
    website: "https://stockpro.com",
  },
  inventory: {
    lowStockThreshold: 10,
    expiryWarningDays: 30,
    autoGenerateSku: false,
    trackBatchByDefault: false,
    allowNegativeStock: false,
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    lowStockAlerts: true,
    expiryAlerts: true,
    transferAlerts: true,
    dailyReports: false,
  },
  security: {
    sessionTimeout: 30,
    passwordMinLength: 8,
    requirePasswordChange: true,
    twoFactorAuth: false,
    loginAttempts: 5,
  },
  appearance: {
    theme: "light",
    language: "en",
    dateFormat: "MM/DD/YYYY",
    currency: "USD",
    timezone: "UTC",
  },
};

export async function GET(request: NextRequest) {
  try {
    // In a real app, you would fetch settings from your database
    // For now, we'll return mock data
    return NextResponse.json(mockSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // In a real app, you would update settings in your database
    // For now, we'll just log the changes and return success
    console.log('Settings updated:', body);
    
    // Update the mock settings with the new values
    Object.keys(body).forEach(key => {
      if (mockSettings[key as keyof typeof mockSettings]) {
        mockSettings[key as keyof typeof mockSettings] = {
          ...mockSettings[key as keyof typeof mockSettings],
          ...body[key],
        };
      }
    });
    
    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
