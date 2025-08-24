import { NextRequest, NextResponse } from 'next/server';

// Mock backup info - in a real app, this would come from your backup system
const mockBackupInfo = {
  lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
  nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  backupSchedule: "daily",
  retentionDays: 30,
  size: "45.2 MB",
};

export async function GET(request: NextRequest) {
  try {
    // In a real app, you would fetch backup info from your backup system
    return NextResponse.json(mockBackupInfo);
  } catch (error) {
    console.error('Error fetching backup info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backup information' },
      { status: 500 }
    );
  }
}
