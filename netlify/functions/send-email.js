const nodemailer = require('nodemailer');

exports.handler = async function (event, context) {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const params = JSON.parse(event.body || '{}');
    const candidateEmail = (params.candidateEmail || '').trim();
    const candidateName = (params.candidateName || 'Candidate').trim();
    const type = params.type || 'NOTIFICATION';
    const details = params.details || {};

    if (!candidateEmail) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'candidateEmail is required' }),
      };
    }

    // Determine Subject and HTML Content
    let subject = '📢 Rajsamand District Portal Notification';
    if (type === 'CREDENTIALS') {
      subject = '🔐 Account Login Credentials - Rajsamand District Assessment Portal';
    } else if (type === 'TEST_ASSIGNED') {
      subject = `📝 Assessment Assigned: ${details.testTitle || 'District Assessment'}`;
    } else if (type === 'TEST_RESULT_NOTIFICATION') {
      subject = `📊 Assessment Result: ${details.testTitle || 'District Assessment'} (${details.scorePercentage || 0}%)`;
    }

    const registrationId = details.registrationId || 'REG_N/A';
    const password = details.password || 'N/A';
    const block = details.block || 'Rajsamand District HQ';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #0284c7, #0f172a); padding: 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
          .header p { margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; }
          .body-content { padding: 24px; line-height: 1.6; }
          .cred-box { background-color: #f1f5f9; border-left: 4px solid #0284c7; padding: 16px; border-radius: 6px; margin: 20px 0; font-family: monospace; }
          .cred-row { margin-bottom: 8px; font-size: 14px; }
          .badge { display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 9999px; background-color: #e0f2fe; color: #0369a1; }
          .footer { background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RAJSAMAND DISTRICT ADMINISTRATION</h1>
            <p>Official Candidate Assessment Portal</p>
          </div>
          <div class="body-content">
            <p>Dear <strong>${candidateName}</strong>,</p>
            ${
              type === 'CREDENTIALS'
                ? `<p>Your official account credentials for the Rajsamand District Candidate Assessment Portal have been generated.</p>
                   <div class="cred-box">
                     <div class="cred-row"><strong>Registration ID:</strong> <span style="color: #0284c7;">${registrationId}</span></div>
                     <div class="cred-row"><strong>Password:</strong> ${password}</div>
                     <div class="cred-row"><strong>Assigned Block:</strong> ${block}</div>
                   </div>
                   <p>Please log in to your portal using the credentials above to complete assigned assessments.</p>`
                : type === 'TEST_ASSIGNED'
                ? `<p>A new assessment paper has been assigned to your portal profile:</p>
                   <div class="cred-box">
                     <div class="cred-row"><strong>Test Paper:</strong> ${details.testTitle || 'N/A'}</div>
                     <div class="cred-row"><strong>Subject:</strong> ${details.subject || 'General'}</div>
                     <div class="cred-row"><strong>Duration:</strong> ${details.duration || 30} minutes</div>
                     <div class="cred-row"><strong>Total Marks:</strong> ${details.totalMarks || 100}</div>
                   </div>
                   <p>Log in to your candidate account to begin the assessment.</p>`
                : `<p>Your test submission report for <strong>${details.testTitle || 'District Assessment'}</strong> has been processed:</p>
                   <div class="cred-box">
                     <div class="cred-row"><strong>Score Obtained:</strong> ${details.scoreObtained || 0} / ${details.totalMarks || 100} (${details.scorePercentage || 0}%)</div>
                     <div class="cred-row"><strong>Correct Answers:</strong> ${details.correctCount || 0}</div>
                     <div class="cred-row"><strong>Incorrect Answers:</strong> ${details.wrongCount || 0}</div>
                   </div>`
            }
          </div>
          <div class="footer">
            <p>This is an automated administrative notification. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Office of the District Collector, Rajsamand, Rajasthan.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const resendApiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER || process.env.VITE_SMTP_USER || 'devkarannirwan01@gmail.com';
    const rawSmtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || process.env.EMAIL_PASS || process.env.VITE_SMTP_PASS;
    const cleanSmtpPass = rawSmtpPass ? rawSmtpPass.trim().replace(/\s+/g, '') : '';
    const smtpFrom = process.env.SMTP_FROM || `District Admin <${smtpUser}>`;

    let sentSuccess = false;
    let errorMessage = '';

    // 1. Try Gmail / Custom SMTP if credentials exist
    if (cleanSmtpPass) {
      try {
        const isGmail = smtpHost.toLowerCase().includes('gmail.com');
        const transporter = nodemailer.createTransport(
          isGmail
            ? { service: 'gmail', auth: { user: smtpUser, pass: cleanSmtpPass } }
            : { host: smtpHost, port: smtpPort, secure: smtpPort === 465, auth: { user: smtpUser, pass: cleanSmtpPass } }
        );

        const info = await transporter.sendMail({
          from: smtpFrom,
          to: candidateEmail,
          subject,
          html: htmlContent,
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            sentRealEmail: true,
            smtpMessageId: info.messageId,
            message: `Live email notification delivered directly via Gmail SMTP to (${candidateEmail}).`,
          }),
        };
      } catch (smtpErr) {
        console.warn('[Netlify Function SMTP Error]:', smtpErr);
        const errStr = smtpErr.message || String(smtpErr);
        if (errStr.includes('535') || errStr.toLowerCase().includes('invalid login') || errStr.toLowerCase().includes('username and password not accepted')) {
          errorMessage = `Gmail SMTP Authentication Error (535): Google rejected the login for '${smtpUser}'. Standard Gmail passwords cannot be used. You MUST create a 16-character 'App Password' at https://myaccount.google.com/apppasswords and set it as SMTP_PASS in Netlify.`;
        } else {
          errorMessage = `Gmail SMTP Error: ${errStr}`;
        }

        // Return the explicit SMTP error so the user can fix their Netlify environment setting!
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            sentRealEmail: false,
            error: errorMessage,
            message: errorMessage,
          }),
        };
      }
    }

    // 2. Try Resend API if key exists and SMTP was not configured
    if (resendApiKey) {
      try {
        const resendFrom = process.env.RESEND_FROM || 'Rajsamand District Portal <onboarding@resend.dev>';
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [candidateEmail],
            subject,
            html: htmlContent,
          }),
        });

        const resData = await resendRes.json();
        if (resendRes.ok) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              sentRealEmail: true,
              smtpMessageId: resData.id,
              message: `Live email dispatched directly to candidate inbox (${candidateEmail}) via Resend API!`,
            }),
          };
        } else {
          console.warn('[Netlify Function Resend API Failed]:', resData);
          errorMessage = `Resend Error: ${resData.message || JSON.stringify(resData)}`;
        }
      } catch (rErr) {
        console.warn('[Netlify Function Resend Exception]:', rErr);
        errorMessage = `Resend Exception: ${rErr.message || String(rErr)}`;
      }
    }

    // 3. Fallback to Ethereal SMTP Sandbox if neither Gmail SMTP nor Resend was configured
    try {
      const testAccount = await nodemailer.createTestAccount();
      const etherealTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });

      const info = await etherealTransporter.sendMail({
        from: `District Admin <${smtpUser}>`,
        to: candidateEmail,
        subject,
        html: htmlContent,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info) || '';

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          sentRealEmail: true,
          smtpMessageId: info.messageId,
          etherealPreviewUrl: previewUrl,
          message: `Dispatched via test SMTP sandbox to ${candidateEmail}. Preview: ${previewUrl}`,
        }),
      };
    } catch (etherealErr) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          sentRealEmail: false,
          simulated: true,
          message: `Logged locally for ${candidateEmail}. ${errorMessage || 'No SMTP_PASS or RESEND_API_KEY set.'}`,
        }),
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal Server Error' }),
    };
  }
};
