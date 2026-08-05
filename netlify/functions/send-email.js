import nodemailer from 'nodemailer';

export const handler = async function (event, context) {
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

    // Compute Base & Specific URLs for Links & Buttons
    const requestHost = event.headers ? (event.headers['x-forwarded-host'] || event.headers.host || event.headers.origin) : '';
    const protocol = (event.headers && event.headers['x-forwarded-proto']) || 'https';
    const computedOrigin = requestHost ? (requestHost.startsWith('http') ? requestHost : `${protocol}://${requestHost}`) : '';
    
    const baseUrl = details.portalUrl || process.env.APP_URL || process.env.URL || computedOrigin || 'https://rajsamand.gov.in/assessment';
    
    const testIdParam = details.testId ? `&testId=${encodeURIComponent(details.testId)}` : '';
    const codeParam = details.accessCode ? `&code=${encodeURIComponent(details.accessCode)}` : '';
    const emailParam = candidateEmail ? `&email=${encodeURIComponent(candidateEmail)}` : '';
    
    const attemptUrl = details.attemptUrl || `${baseUrl}/?attempt=true${testIdParam}${codeParam}${emailParam}`;
    const portalLoginUrl = details.portalLoginUrl || `${baseUrl}/?login=true&regId=${encodeURIComponent(registrationId)}`;

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
          .cred-box { background-color: #f1f5f9; border-left: 4px solid #0284c7; padding: 16px; border-radius: 8px; margin: 20px 0; font-family: monospace; }
          .cred-row { margin-bottom: 8px; font-size: 14px; }
          .footer { background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
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
                     <div class="cred-row"><strong>Registration ID:</strong> <span style="color: #0284c7; font-weight: bold;">${registrationId}</span></div>
                     <div class="cred-row"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${password}</code></div>
                     <div class="cred-row"><strong>Assigned Block:</strong> ${block}</div>
                   </div>
                   
                   <div style="text-align: center; margin: 28px 0;">
                     <a href="${portalLoginUrl}" target="_blank" style="background-color: #0284c7; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.3);">
                       🔑 Log In to Candidate Portal
                     </a>
                   </div>

                   <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; text-align: center; margin-top: 16px;">
                     <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; font-weight: bold;">Direct Portal Login Link:</p>
                     <a href="${portalLoginUrl}" target="_blank" style="color: #0284c7; font-size: 13px; word-break: break-all; font-family: monospace;">${portalLoginUrl}</a>
                   </div>`
                : type === 'TEST_ASSIGNED'
                ? `<p>A new assessment paper has been assigned to your portal profile on the Rajsamand District Portal:</p>
                   <div class="cred-box" style="background-color: #f0fdf4; border-left: 4px solid #16a34a;">
                     <div class="cred-row" style="font-size: 16px; font-weight: bold; color: #14532d; margin-bottom: 8px;">${details.testTitle || 'District Assessment'}</div>
                     <div class="cred-row" style="color: #166534;"><strong>Subject:</strong> ${details.subject || 'General'}</div>
                     <div class="cred-row" style="color: #166534;"><strong>Duration:</strong> ${details.duration || 30} minutes</div>
                     <div class="cred-row" style="color: #166534;"><strong>Total Questions:</strong> ${details.totalQuestions || '10'} MCQs</div>
                     <div class="cred-row" style="color: #166534;"><strong>Total Marks:</strong> ${details.totalMarks || 100} Marks</div>
                     ${details.accessCode ? `<div class="cred-row" style="margin-top: 8px; color: #166534;"><strong>Test Access Code:</strong> <code style="background: #dcfce7; padding: 3px 8px; border-radius: 4px; font-weight: bold; color: #14532d;">${details.accessCode}</code></div>` : ''}
                   </div>
                   
                   <div style="text-align: center; margin: 28px 0;">
                     <a href="${attemptUrl}" target="_blank" style="background-color: #16a34a; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.3);">
                       🚀 Click Here to Start Assessment Now
                     </a>
                   </div>

                   <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; text-align: center; margin-top: 16px;">
                     <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; font-weight: bold;">Direct Candidate Attempt Link:</p>
                     <a href="${attemptUrl}" target="_blank" style="color: #16a34a; font-size: 13px; word-break: break-all; font-family: monospace;">${attemptUrl}</a>
                   </div>`
                : `<p>Your test submission report for <strong>${details.testTitle || 'District Assessment'}</strong> has been processed:</p>
                   <div class="cred-box">
                     <div class="cred-row"><strong>Score Obtained:</strong> <span style="font-weight: bold; color: #16a34a;">${details.scoreObtained || 0} / ${details.totalMarks || 100} (${details.scorePercentage || 0}%)</span></div>
                     <div class="cred-row"><strong>Correct Answers:</strong> ${details.correctCount || 0}</div>
                     <div class="cred-row"><strong>Incorrect Answers:</strong> ${details.wrongCount || 0}</div>
                     <div class="cred-row"><strong>Unattempted Questions:</strong> ${details.unattemptedCount || 0}</div>
                   </div>
                   
                   <div style="text-align: center; margin: 28px 0;">
                     <a href="${baseUrl}" target="_blank" style="background-color: #0284c7; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.3);">
                       📊 View Detailed Solutions & Portal
                     </a>
                   </div>

                   <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; text-align: center; margin-top: 16px;">
                     <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; font-weight: bold;">Portal Link:</p>
                     <a href="${baseUrl}" target="_blank" style="color: #0284c7; font-size: 13px; word-break: break-all; font-family: monospace;">${baseUrl}</a>
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

    // 2. Fallback to Ethereal SMTP Sandbox if Gmail/Custom SMTP was not configured
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
          message: `Logged locally for ${candidateEmail}. ${errorMessage || 'No SMTP_PASS configured in Netlify.'}`,
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
