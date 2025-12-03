/**
 * Script to delete all attendance records
 * 
 * Usage:
 * 1. Make sure your server is running
 * 2. Update the API_URL below if needed
 * 3. Run: node scripts/delete-all-attendance.js
 * 
 * WARNING: This will permanently delete ALL attendance records!
 */

const API_URL = 'http://localhost:3000/api/attendance/delete-all';

async function deleteAllAttendance() {
  try {
    console.log('⚠️  WARNING: This will delete ALL attendance records!');
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
    
    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Sending DELETE request to:', API_URL);
    
    const response = await fetch(API_URL, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      // Note: You'll need to be authenticated as admin
      // If running from Node.js, you may need to pass a session cookie
      // or use a different authentication method
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Success!');
      console.log('Deleted records:', data.deletedCount);
      console.log('Total records before:', data.totalRecordsBefore);
    } else {
      console.error('❌ Error:', data.error);
      console.log('Status:', response.status);
    }
  } catch (error) {
    console.error('❌ Failed to delete attendance:', error.message);
  }
}

deleteAllAttendance();

