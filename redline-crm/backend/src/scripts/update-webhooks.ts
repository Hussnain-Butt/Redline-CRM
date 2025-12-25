import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const ngrokUrl = process.env.NGROK_URL || 'https://your-ngrok-url.ngrok.io';

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

    const webhookUrl = `${ngrokUrl}/api/calls/voice`;
    const statusCallbackUrl = `${ngrokUrl}/api/calls/status`;

    for (const number of phoneNumbers) {
      console.log(`\n📞 Phone Number: ${number.phoneNumber}`);
      console.log(`   Current Voice URL: ${number.voiceUrl || 'Not set'}`);
      console.log(`   Current Status Callback: ${number.statusCallback || 'Not set'}`);

      // Update webhook URLs
      await client.incomingPhoneNumbers(number.sid).update({
        voiceUrl: webhookUrl,
        voiceMethod: 'POST',
        statusCallback: statusCallbackUrl,
        statusCallbackMethod: 'POST',
      });

      console.log(`   ✅ Updated Voice URL: ${webhookUrl}`);
      console.log(`   ✅ Updated Status Callback: ${statusCallbackUrl}`);
    }

    console.log('\n\n✅ All webhooks updated successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Ngrok URL: ${ngrokUrl}`);
    console.log(`   Voice Webhook: ${webhookUrl}`);
    console.log(`   Status Webhook: ${statusCallbackUrl}`);
    console.log('\n💡 Make sure ngrok is running and the URL in .env is correct!');

  } catch (error: any) {
    console.error('❌ Error updating webhooks:', error.message);
    if (error.code === 20003) {
      console.error('\n💡 Authentication failed. Check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
    }
  }
}

updateWebhooks();
