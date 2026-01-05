require('dotenv').config();

// Get Service Account Email from GSC Credentials
function getServiceAccountEmail() {
  try {
    const envCredentials = process.env.GSC_CREDENTIALS_BASE64;
    if (!envCredentials) {
      console.error('❌ GSC_CREDENTIALS_BASE64 not found in .env file');
      return null;
    }

    const decoded = Buffer.from(envCredentials, 'base64').toString('utf-8');
    const credentials = JSON.parse(decoded);
    const serviceAccountEmail = credentials.client_email;

    console.log('\n📧 Service Account Email:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(serviceAccountEmail);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 Steps to Add Permission in Google Search Console:\n');
    console.log('1. Copy the email above ☝️');
    console.log('2. Go to: https://search.google.com/search-console');
    console.log('3. Select property: https://cricketaddictor.com');
    console.log('4. Click "Settings" (⚙️ gear icon) in left sidebar');
    console.log('5. Click "Users and permissions"');
    console.log('6. Click "Add user" button');
    console.log('7. Paste the service account email');
    console.log('8. Select permission: "Full" (recommended)');
    console.log('9. Click "Add"');
    console.log('10. Wait 5-10 minutes for permissions to propagate');
    console.log('11. Then run the automation again\n');
    
    return serviceAccountEmail;
  } catch (err) {
    console.error('❌ Error getting service account email:', err.message);
    return null;
  }
}

// Run
getServiceAccountEmail();

