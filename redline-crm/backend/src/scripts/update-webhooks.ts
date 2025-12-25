import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const baseUrl = process.env.RAILWAY_URL || process.env.NGROK_URL || 'https://redline-crm-production.up.railway.app';

if (!accountSid || !authToken) {
  console.error('❌ Missing Twilio credentials in .env file');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function updateWebhooks() {
  try {
    console.log('🔍 Fetching Twilio phone numbers...\n');
    
    const phoneNumbers = await client.incomingPhoneNumbers.list();
    
    if (phoneNumbers.length === 0) {
      console.log('⚠️  No phone numbers found in your Twilio account');
      return;
    }

    console.log(`📱 Found ${phoneNumbers.length} phone number(s)\n`);

    // Voice webhooks
    const voiceUrl = `${baseUrl}/api/calls/voice`;
    const voiceStatusCallback = `${baseUrl}/api/calls/status`;
    
    // SMS webhooks
    const smsUrl = `${baseUrl}/api/sms/incoming`;
    const smsStatusCallback = `${baseUrl}/api/sms/status`;

    for (const number of phoneNumbers) {
      console.log(`\n📞 Phone Number: ${number.phoneNumber}`);
      console.log(`   Current Voice URL: ${number.voiceUrl || 'Not set'}`);
      console.log(`   Current SMS URL: ${number.smsUrl || 'Not set'}`);

      // Update webhook URLs for both voice and SMS
      await client.incomingPhoneNumbers(number.sid).update({
        // Voice webhooks
        voiceUrl: voiceUrl,
        voiceMethod: 'POST',
        statusCallback: voiceStatusCallback,
        statusCallbackMethod: 'POST',
        
        // SMS webhooks
        smsUrl: smsUrl,
        smsMethod: 'POST',
      });

      console.log(`   ✅ Updated Voice URL: ${voiceUrl}`);
      console.log(`   ✅ Updated Voice Status: ${voiceStatusCallback}`);
      console.log(`   ✅ Updated SMS URL: ${smsUrl}`);
      console.log(`   ✅ Updated SMS Status: ${smsStatusCallback}`);
    }

    console.log('\n\n✅ All webhooks updated successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Base URL: ${baseUrl}`);
    console.log(`\n   📞 Voice Webhooks:`);
    console.log(`      Voice URL: ${voiceUrl}`);
    console.log(`      Status Callback: ${voiceStatusCallback}`);
    console.log(`\n   💬 SMS Webhooks:`);
    console.log(`      SMS URL: ${smsUrl}`);
    console.log(`      Status Callback: ${smsStatusCallback}`);
    console.log('\n💡 Make sure your backend is deployed and accessible at the base URL!');

  } catch (error: any) {
    console.error('❌ Error updating webhooks:', error.message);
    if (error.code === 20003) {
      console.error('\n💡 Authentication failed. Check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
    }
  }
}

updateWebhooks();
