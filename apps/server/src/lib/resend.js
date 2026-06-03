// apps/server/src/lib/resend.js
// Graceful Resend initialisation — works without real API key in dev/demo mode
const key = process.env.RESEND_API_KEY;
const isLive = key && !key.startsWith('re_...') && key !== 're_...' && key.length > 10;

let resend;

if (isLive) {
  const { Resend } = await import('resend');
  resend = new Resend(key);
} else {
  // Mock Resend — logs email content to console instead of sending
  resend = {
    emails: {
      send: async (opts) => {
        console.log(`\n📧 [Resend Mock] Email would be sent:`);
        console.log(`   To: ${opts.to}`);
        console.log(`   Subject: ${opts.subject}`);
        console.log(`   (HTML body omitted — ${opts.html?.length || 0} chars)\n`);
        return { id: 'mock_email_' + Date.now() };
      }
    },
    _isMock: true,
  };
  console.log('⚠  Resend running in MOCK mode (no live key configured)');
}

export default resend;
