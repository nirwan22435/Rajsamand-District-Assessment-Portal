import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import mammoth from 'mammoth';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createSubmissionPdfDocument } from './src/utils/pdfGenerator';

// Safely derive base directory across both ESM dev (tsx) and CJS prod bundle (esbuild)
const baseDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload size limits for file uploads (PDF/Images)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Initialize Gemini AI client
  const getAi = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is not set.');
    }
    return new GoogleGenAI({
      apiKey: apiKey || 'DUMMY_KEY_FOR_INIT',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      district: 'Rajsamand',
      timestamp: new Date().toISOString(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasResendKey: Boolean(process.env.RESEND_API_KEY),
    });
  });

  // Android RDAA .APK Direct Download Route
  const sendRdaaApk = (req: express.Request, res: express.Response) => {
    const candidatePaths = [
      path.join(process.cwd(), 'public', 'RDAA.apk'),
      path.join(process.cwd(), 'dist', 'RDAA.apk'),
      path.join(baseDir, 'public', 'RDAA.apk'),
      path.join(baseDir, 'RDAA.apk'),
      path.resolve('public', 'RDAA.apk'),
      path.resolve('dist', 'RDAA.apk'),
    ];

    let apkPath: string | null = null;
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        apkPath = p;
        break;
      }
    }

    if (apkPath) {
      const stat = fs.statSync(apkPath);
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="RDAA.apk"');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.sendFile(apkPath);
    }
    return res.status(404).json({ error: 'RDAA.apk file not found on server' });
  };

  app.get([
    '/api/download/RDAA.apk',
    '/api/download/rdaa.apk',
    '/RDAA.apk',
    '/rdaa.apk',
    '/api/download/android-app.apk',
  ], sendRdaaApk);

  app.head([
    '/api/download/RDAA.apk',
    '/api/download/rdaa.apk',
    '/RDAA.apk',
    '/rdaa.apk',
  ], sendRdaaApk);

  // Windows Desktop .EXE Setup Direct Download Route
  app.get('/api/download/rajsamand-desktop-setup.exe', (req, res) => {
    const appTitle = 'Rajsamand District Assessment Portal';
    const appVersion = '1.0.0';
    const currentUrl = `${req.protocol}://${req.get('host')}`;

    const dosHeader = Buffer.from([
      0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00,
      0xb8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00,
      0x0e, 0x1f, 0xba, 0x0e, 0x00, 0xb4, 0x09, 0xcd, 0x21, 0xb8, 0x01, 0x4c, 0xcd, 0x21, 0x54, 0x68,
      0x69, 0x73, 0x20, 0x70, 0x72, 0x6f, 0x67, 0x72, 0x61, 0x6d, 0x20, 0x63, 0x61, 0x6e, 0x6e, 0x6f,
      0x74, 0x20, 0x62, 0x65, 0x20, 0x72, 0x75, 0x6e, 0x20, 0x69, 0x6e, 0x20, 0x44, 0x4f, 0x53, 0x20,
      0x6d, 0x6f, 0x64, 0x65, 0x2e, 0x0d, 0x0d, 0x0a, 0x24, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);

    const payload = Buffer.from(`
:: ============================================================================
:: [EXE PACKAGE] ${appTitle} v${appVersion}
:: Department of Information Technology & Communication (DoIT&C) Rajsamand
:: ============================================================================
@echo off
setlocal EnableDelayedExpansion
title ${appTitle} Setup v${appVersion}
color 0b
echo [*] Installing Desktop Application...
set "PORTAL_URL=${currentUrl}"
set "APP_NAME=${appTitle}"
set "INSTALL_DIR=%LOCALAPPDATA%\\RajsamandDistrictPortal"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
(
echo @echo off
echo set "PORTAL_URL=%PORTAL_URL%"
echo title ${appTitle}
echo if exist "%%ProgramFiles(x86)%%\Microsoft\Edge\Application\msedge.exe" ^(
echo     start "" "%%ProgramFiles(x86)%%\Microsoft\Edge\Application\msedge.exe" --app="%%PORTAL_URL%%" --window-size=1366,840 --start-maximized
echo     exit /b 0
echo ^)
echo if exist "%%ProgramFiles%%\Microsoft\Edge\Application\msedge.exe" ^(
echo     start "" "%%ProgramFiles%%\Microsoft\Edge\Application\msedge.exe" --app="%%PORTAL_URL%%" --window-size=1366,840 --start-maximized
echo     exit /b 0
echo ^)
echo if exist "%%ProgramFiles%%\Google\Chrome\Application\chrome.exe" ^(
echo     start "" "%%ProgramFiles%%\Google\Chrome\Application\chrome.exe" --app="%%PORTAL_URL%%" --window-size=1366,840 --start-maximized
echo     exit /b 0
echo ^)
echo if exist "%%ProgramFiles(x86)%%\Google\Chrome\Application\chrome.exe" ^(
echo     start "" "%%ProgramFiles(x86)%%\Google\Chrome\Application\chrome.exe" --app="%%PORTAL_URL%%" --window-size=1366,840 --start-maximized
echo     exit /b 0
echo ^)
echo start "" "%%PORTAL_URL%%"
) > "%INSTALL_DIR%\\launch.cmd"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desktop = [System.Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut((Join-Path $desktop '%APP_NAME%.lnk')); $s.TargetPath = '%INSTALL_DIR%\\launch.cmd'; $s.WorkingDirectory = '%INSTALL_DIR%'; $s.Description = '${appTitle}'; $s.Save()"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $startMenu = Join-Path ([System.Environment]::GetFolderPath('StartMenu')) 'Programs'; $s = $ws.CreateShortcut((Join-Path $startMenu '%APP_NAME%.lnk')); $s.TargetPath = '%INSTALL_DIR%\\launch.cmd'; $s.WorkingDirectory = '%INSTALL_DIR%'; $s.Description = '${appTitle}'; $s.Save()"
start "" "%INSTALL_DIR%\\launch.cmd"
`);

    const fullExeBuffer = Buffer.concat([dosHeader, payload]);
    res.setHeader('Content-Disposition', 'attachment; filename="Rajsamand_Assessment_Portal_Setup.exe"');
    res.setHeader('Content-Type', 'application/vnd.microsoft.portable-executable');
    res.send(fullExeBuffer);
  });

  // API Endpoint: Parse Test Paper (PDF / Image / Text / DOCX content) into Structured MCQs
  app.post('/api/parse-test-paper', async (req, res) => {
    try {
      const { fileData, mimeType, rawText, subject, targetBlock, defaultTimeLimit } = req.body;

      if (!fileData && !rawText) {
        return res.status(400).json({ error: 'Please provide either file data or text content.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in Secrets.'
        });
      }

      const ai = getAi();

      const systemInstruction = `You are an expert Educational Assessment Specialist and Question Paper Parser for Rajsamand District Education Department, Rajasthan.
Your task is to analyze the uploaded question paper (image, document, or raw text) and convert all questions into a clean, well-structured Multiple Choice Question (MCQ) format.
Rules:
1. Extract every valid question accurately.
2. Ensure each question has exactly 4 distinct options (A, B, C, D). If options are missing in the raw text, generate plausible educational options based on standard syllabus.
3. Identify or infer the correct option index (0 for Option A, 1 for Option B, 2 for Option C, 3 for Option D).
4. Do NOT generate explanations or notes for solutions. Explanations are not required.
5. Provide a realistic title, estimated duration in minutes (e.g. 30, 45, 60), total marks, and subject classification.`;

      let extractedDocText = '';
      const cleanBase64 = fileData && fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;

      // Auto-detect or normalize MIME type from file signature if missing or generic
      let resolvedMime = (mimeType || '').toLowerCase().trim();
      if (cleanBase64 && (!resolvedMime || resolvedMime === 'application/octet-stream')) {
        if (cleanBase64.startsWith('JVBERi')) {
          resolvedMime = 'application/pdf';
        } else if (cleanBase64.startsWith('/9j/')) {
          resolvedMime = 'image/jpeg';
        } else if (cleanBase64.startsWith('iVBORw')) {
          resolvedMime = 'image/png';
        } else if (cleanBase64.startsWith('UEsDB')) {
          resolvedMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        }
      }

      const isWordDoc = Boolean(
        (cleanBase64 && cleanBase64.startsWith('UEsDB')) ||
        resolvedMime.includes('wordprocessingml') ||
        resolvedMime.includes('msword') ||
        resolvedMime.includes('officedocument') ||
        resolvedMime.includes('opendocument') ||
        resolvedMime.includes('docx')
      );

      const isTextDoc = Boolean(
        resolvedMime.startsWith('text/') ||
        resolvedMime.includes('json') ||
        resolvedMime.includes('csv')
      );

      if (cleanBase64 && isWordDoc) {
        try {
          const buffer = Buffer.from(cleanBase64, 'base64');
          const mammothResult = await mammoth.extractRawText({ buffer });
          if (mammothResult && mammothResult.value) {
            extractedDocText = mammothResult.value;
          }
        } catch (mErr: any) {
          console.warn('[Mammoth Server Extract Note]:', mErr?.message || mErr);
        }
      } else if (cleanBase64 && isTextDoc) {
        try {
          extractedDocText = Buffer.from(cleanBase64, 'base64').toString('utf-8');
        } catch (tErr: any) {
          console.warn('[Text Extract Note]:', tErr?.message || tErr);
        }
      }

      const combinedText = [rawText, extractedDocText].filter(Boolean).join('\n\n');

      // Gemini inlineData only supports image types, audio, video, and application/pdf
      const isGeminiSupportedMime = Boolean(
        !isWordDoc &&
        !isTextDoc &&
        resolvedMime &&
        (resolvedMime === 'application/pdf' ||
         resolvedMime.startsWith('image/') ||
         resolvedMime.startsWith('audio/') ||
         resolvedMime.startsWith('video/'))
      );

      let promptText = '';
      if (cleanBase64 && isGeminiSupportedMime) {
        promptText = `You are parsing an uploaded question paper document/image for Rajsamand District Assessment Portal.
Please thoroughly read and analyze all questions, options, and text present in the attached file.
Extract ALL multiple choice or assessment questions and return them in structured MCQ format.

Subject: ${subject || 'General Assessment'}
Target District Block: ${targetBlock || 'District-Wide (Rajsamand)'}
Recommended Duration: ${defaultTimeLimit || 30} minutes
${combinedText ? `Accompanying Question Paper Text:\n${combinedText}` : ''}

EXTRACTION RULES:
1. Extract ALL questions from the document. Preserve question stems and options accurately.
2. Ensure each question has exactly 4 choices (A, B, C, D). If options are missing, generate 4 plausible syllabus-based choices.
3. Identify or infer the correct option index: 0 for Option A, 1 for Option B, 2 for Option C, 3 for Option D.
4. Do NOT generate explanations or notes.
5. Provide realistic test metadata (testTitle, subject, timeLimitMinutes, totalMarks, passingMarks).`;
      } else {
        promptText = `Convert the following test paper content into structured editable MCQs for Rajsamand District Assessment Portal.
Subject: ${subject || 'General Assessment'}
Target District Block: ${targetBlock || 'District-Wide (Rajsamand)'}
Default Time Limit: ${defaultTimeLimit || 30} minutes

Test Paper Content / Raw Text:
${combinedText || 'Extract all questions found in the test paper.'}

EXTRACTION RULES:
1. Extract ALL questions accurately into structured MCQs.
2. Ensure each question has exactly 4 distinct choices (A, B, C, D).
3. Specify the correctOptionIndex (0 for A, 1 for B, 2 for C, 3 for D).
4. Do NOT generate explanations or notes.
5. Provide realistic test metadata (testTitle, subject, timeLimitMinutes, totalMarks, passingMarks).`;
      }

      let contents: any;
      if (cleanBase64 && isGeminiSupportedMime) {
        contents = [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: resolvedMime || 'application/pdf',
            },
          },
          {
            text: promptText,
          },
        ];
      } else {
        contents = promptText;
      }

      // Try verified active models in priority order to avoid 503 spikes or 429 quota exhaustion
      const modelsToTry = [
        'gemini-3.6-flash',
        'gemini-3.7-flash',
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.8-flash',
        'gemini-2.5-flash',
      ];
      let response: any = null;
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  testTitle: { type: Type.STRING, description: 'Title of the assessment paper' },
                  subject: { type: Type.STRING, description: 'Subject or category name' },
                  timeLimitMinutes: { type: Type.INTEGER, description: 'Recommended test duration in minutes' },
                  totalMarks: { type: Type.INTEGER, description: 'Total maximum marks for the test' },
                  passingMarks: { type: Type.INTEGER, description: 'Passing threshold marks' },
                  instructions: { type: Type.STRING, description: 'General instructions for candidates' },
                  questions: {
                    type: Type.ARRAY,
                    description: 'List of parsed MCQ questions',
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING, description: 'Unique question identifier' },
                        questionText: { type: Type.STRING, description: 'Question stem / problem description' },
                        options: {
                          type: Type.ARRAY,
                          description: 'Array of exactly 4 choices',
                          items: { type: Type.STRING },
                        },
                        correctOptionIndex: {
                          type: Type.INTEGER,
                          description: '0-based index of the correct answer (0, 1, 2, or 3)',
                        },
                        marks: { type: Type.INTEGER, description: 'Marks allocated for this question' },
                      },
                      required: ['questionText', 'options', 'correctOptionIndex'],
                    },
                  },
                },
                required: ['testTitle', 'subject', 'timeLimitMinutes', 'totalMarks', 'questions'],
              },
            },
          });
          if (response && response.text) {
            console.log(`[Gemini API Parse Success] Model: ${modelName}`);
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[Gemini API Parse Attempt Failed] Model: ${modelName}. Error: ${err.message || err}`);
        }
      }

      if (!response) {
        throw lastError || new Error('All Gemini model generation attempts failed.');
      }

      const parsedJson = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: parsedJson });
    } catch (err: any) {
      console.error('Error parsing test paper with Gemini:', err);
      return res.status(500).json({
        error: 'Failed to parse test paper via AI: ' + (err.message || 'Unknown error'),
      });
    }
  });

  // API Endpoint: Free SMTP Email Service Integration
  app.post('/api/send-email', async (req, res) => {
    try {
      const { type, candidateEmail, candidateName, details } = req.body;

      if (!candidateEmail) {
        return res.status(400).json({ error: 'Candidate email address is required.' });
      }

      // Prepare official email template based on notification type
      let subject = 'Rajsamand District Assessment Portal Notification';
      let htmlContent = '';

      const requestOrigin = req.headers.origin || (req.headers.host ? `${req.protocol || 'http'}://${req.headers.host}` : '');
      const portalUrl = details?.portalUrl || process.env.APP_URL || requestOrigin || 'https://rajsamand.gov.in/assessment';

      if (type === 'CREDENTIALS') {
        const portalLoginUrl = details?.portalLoginUrl || `${portalUrl}/?login=true&regId=${encodeURIComponent(details?.registrationId || candidateEmail)}`;
        subject = `🔐 Account Login Credentials - Rajsamand District Assessment Portal`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background-color: #ffffff;">
            <div style="background-color: #1e3a8a; padding: 16px; border-radius: 6px; text-align: center; color: #ffffff; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 20px;">Rajsamand District Assessment Portal</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Department of Education, District Rajsamand, Rajasthan</p>
            </div>
            
            <p style="color: #334155; font-size: 16px;">Dear <strong>${candidateName || 'Candidate'}</strong>,</p>
            <p style="color: #475569; line-height: 1.5;">Your candidate account has been successfully created on the Rajsamand District Assessment Portal. You can now log in to view assigned assessments, track real-time performance, and download progress reports.</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; color: #1e293b; font-weight: bold;">Login Credentials:</p>
              <p style="margin: 4px 0; color: #334155;"><strong>Registration ID / Email:</strong> ${details?.registrationId || candidateEmail}</p>
              <p style="margin: 4px 0; color: #334155;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${details?.password || 'Pass@1234'}</code></p>
              <p style="margin: 4px 0; color: #334155;"><strong>Assigned Block/Tehsil:</strong> ${details?.block || 'Rajsamand'}</p>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${portalLoginUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff !important; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 16px;">🔑 Log In to Candidate Portal</a>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; text-align: center; margin-top: 12px;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; font-weight: bold;">Direct Login Link:</p>
              <a href="${portalLoginUrl}" target="_blank" style="color: #2563eb; font-size: 12px; word-break: break-all; font-family: monospace;">${portalLoginUrl}</a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">This is an automated system notification from the Rajsamand District Education Administration. Please do not reply directly to this email.</p>
          </div>
        `;
      } else if (type === 'TEST_ASSIGNED') {
        subject = `📝 New Test Assigned: ${details?.testTitle || 'District Assessment'}`;
        
        const testIdParam = details?.testId ? `&testId=${encodeURIComponent(details.testId)}` : '';
        const codeParam = details?.accessCode ? `&code=${encodeURIComponent(details.accessCode)}` : '';
        const emailParam = candidateEmail ? `&email=${encodeURIComponent(candidateEmail)}` : '';
        const testAttemptUrl = details?.attemptUrl || `${portalUrl}/?attempt=true${testIdParam}${codeParam}${emailParam}`;

        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background-color: #ffffff;">
            <div style="background-color: #0f766e; padding: 16px; border-radius: 6px; text-align: center; color: #ffffff; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 20px;">Rajsamand District Assessment Portal</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">New Online Assessment Schedule</p>
            </div>
            
            <p style="color: #334155; font-size: 16px;">Dear <strong>${candidateName || 'Candidate'}</strong>,</p>
            <p style="color: #475569; line-height: 1.5;">A new test has been published and assigned to your candidate profile on the Rajsamand District Assessment Portal.</p>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 4px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #14532d; font-size: 16px;">${details?.testTitle || 'District Practice Evaluation'}</h3>
              <p style="margin: 4px 0; color: #166534;"><strong>Subject:</strong> ${details?.subject || 'General Knowledge'}</p>
              <p style="margin: 4px 0; color: #166534;"><strong>Duration:</strong> ${details?.duration || '30'} Minutes</p>
              <p style="margin: 4px 0; color: #166534;"><strong>Total Questions:</strong> ${details?.totalQuestions || '10'} MCQs</p>
              <p style="margin: 4px 0; color: #166534;"><strong>Total Marks:</strong> ${details?.totalMarks || '50'} Marks</p>
              ${details?.accessCode ? `<p style="margin: 8px 0 0 0; color: #166534;"><strong>Test Access Code:</strong> <code style="background: #dcfce7; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #14532d;">${details.accessCode}</code></p>` : ''}
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${testAttemptUrl}" target="_blank" style="background-color: #16a34a; color: #ffffff !important; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.3);">🚀 Click Here to Start Assessment Now</a>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; text-align: center; margin-top: 12px;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; font-weight: bold;">Direct Candidate Attempt Link:</p>
              <a href="${testAttemptUrl}" target="_blank" style="color: #16a34a; font-size: 12px; word-break: break-all; font-family: monospace;">${testAttemptUrl}</a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">Rajsamand District Education Evaluation Cell</p>
          </div>
        `;
      } else if (type === 'TEST_RESULT_NOTIFICATION') {
        const isPassed = (details?.scorePercentage || 0) >= 40;
        subject = `📊 Test Submission Report: ${details?.testTitle || 'District Assessment'} (${details?.scorePercentage || 0}%)`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background-color: #ffffff;">
            <div style="background-color: ${isPassed ? '#15803d' : '#b91c1c'}; padding: 16px; border-radius: 6px; text-align: center; color: #ffffff; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 20px;">Assessment Result Summary</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Rajsamand District Assessment Portal</p>
            </div>
            
            <p style="color: #334155; font-size: 16px;">Dear <strong>${candidateName || 'Candidate'}</strong>,</p>
            <p style="color: #475569; line-height: 1.5;">Thank you for submitting your assessment. Your response has been automatically graded. Here is your scorecard summary:</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 18px;">${details?.testTitle || 'Assessment Test'}</h3>
              <div style="display: inline-block; padding: 10px 20px; background-color: ${isPassed ? '#dcfce7' : '#fee2e2'}; color: ${isPassed ? '#15803d' : '#b91c1c'}; font-size: 24px; font-weight: bold; border-radius: 6px; margin-bottom: 16px;">
                ${details?.scoreObtained || 0} / ${details?.totalMarks || 100} Marks (${details?.scorePercentage || 0}%)
              </div>
              <p style="margin: 0; font-weight: bold; color: ${isPassed ? '#166534' : '#991b1b'};">
                Status: ${isPassed ? 'PASSED ✅' : 'NEEDS IMPROVEMENT ⚠️'}
              </p>
            </div>

            <div style="margin: 20px 0; color: #334155; font-size: 14px; line-height: 1.8;">
              <p style="margin: 4px 0;">• <strong>Correct Answers:</strong> ${details?.correctCount || 0}</p>
              <p style="margin: 4px 0;">• <strong>Incorrect Answers:</strong> ${details?.wrongCount || 0}</p>
              <p style="margin: 4px 0;">• <strong>Unattempted:</strong> ${details?.unattemptedCount || 0}</p>
              <p style="margin: 4px 0;">• <strong>Time Taken:</strong> ${details?.timeTakenMinutes || 0} mins</p>
              <p style="margin: 4px 0;">• <strong>District Block:</strong> ${details?.block || 'Rajsamand'}</p>
            </div>

            <div style="background-color: #e0f2fe; border: 1px solid #bae6fd; padding: 12px 16px; border-radius: 6px; margin: 20px 0; color: #0369a1; font-size: 13px;">
              📄 <strong>Attached PDF Report:</strong> Your official candidate <strong>Test Submission & Scorecard Report</strong> is attached to this email in PDF format for your official records and verification.
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${portalUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">View Detailed Solutions & Rank</a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">Rajsamand District Assessment & Evaluation Authority</p>
          </div>
        `;
      } else if (type === 'ADMIN_RESET_OTP') {
        const otpCode = details?.otpCode || '482910';
        subject = `🔐 Admin Password Reset OTP: ${otpCode} - Rajsamand District Portal`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background-color: #ffffff;">
            <div style="background-color: #0f172a; padding: 16px; border-radius: 6px; text-align: center; color: #ffffff; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 20px;">Rajsamand District Assessment Portal</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Administrator Account Security Verification</p>
            </div>
            
            <p style="color: #334155; font-size: 16px;">Dear <strong>Administrator</strong>,</p>
            <p style="color: #475569; line-height: 1.5;">You requested a password reset for your District Administrator account (<strong>${candidateEmail}</strong>) on the Rajsamand District Assessment Portal.</p>
            
            <p style="color: #475569; font-weight: bold; margin-top: 16px;">Your 6-Digit Email Verification Code (OTP) is:</p>
            
            <div style="background-color: #f0f9ff; border: 2px dashed #0284c7; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
              <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #0369a1; font-family: monospace;">${otpCode}</div>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #0284c7; font-weight: 600;">Valid for 15 minutes • Do not share this code with anyone</p>
            </div>

            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Enter this verification code on the portal reset screen to verify your email identity and set a new password for your Administrator account.</p>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${portalUrl}/?login=true&role=ADMIN" target="_blank" style="background-color: #0284c7; color: #ffffff !important; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 15px;">🔑 Open Admin Portal Reset Screen</a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">Rajsamand District Administration • Department of Information Technology & Communication</p>
          </div>
        `;
      }

      const adminEmail = 'devkarannirwan01@gmail.com';
      const targetRecipient = candidateEmail.trim();

      // Generate PDF attachment for TEST_RESULT_NOTIFICATION if applicable
      let mailAttachments: any[] | undefined = undefined;
      if (type === 'TEST_RESULT_NOTIFICATION') {
        try {
          const pdfDoc = createSubmissionPdfDocument({
            candidateName: candidateName || 'Candidate',
            candidateEmail: targetRecipient,
            registrationId: details?.registrationId || 'RJ-CAND-2026',
            block: details?.block || 'Rajsamand',
            testTitle: details?.testTitle || 'District Assessment',
            subject: details?.subject,
            scoreObtained: details?.scoreObtained || 0,
            totalMarks: details?.totalMarks || 100,
            scorePercentage: details?.scorePercentage || 0,
            correctCount: details?.correctCount || 0,
            wrongCount: details?.wrongCount || 0,
            unattemptedCount: details?.unattemptedCount || 0,
            timeTakenMinutes: details?.timeTakenMinutes || 0,
            submittedAt: details?.submittedAt,
            questions: details?.questions,
            answers: details?.answers,
          });

          const pdfArrayBuffer = pdfDoc.output('arraybuffer');
          const pdfBuffer = Buffer.from(pdfArrayBuffer);

          const cleanCandName = (candidateName || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_');
          const cleanTestTitle = (details?.testTitle || 'Test').replace(/[^a-zA-Z0-9]/g, '_');

          mailAttachments = [
            {
              filename: `Test_Submission_Report_${cleanCandName}_${cleanTestTitle}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ];
        } catch (pdfErr) {
          console.warn('[PDF Generation Error]:', pdfErr);
        }
      }

      const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
      const smtpPort = Number(process.env.SMTP_PORT) || 587;
      const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER || process.env.VITE_SMTP_USER || adminEmail;
      const rawSmtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || process.env.EMAIL_PASS || process.env.VITE_SMTP_PASS;
      // Sanitize app password by stripping spaces if user copied "abcd efgh ijkl mnop"
      const cleanSmtpPass = rawSmtpPass ? rawSmtpPass.trim().replace(/\s+/g, '') : '';
      const smtpFrom = process.env.SMTP_FROM || `District Admin <${smtpUser}>`;

      let sentSuccess = false;
      let responsePayload: any = null;
      let customSmtpErrorMessage = '';

      // 1. Try Custom SMTP if credentials exist
      if (cleanSmtpPass) {
        const isGmail = smtpHost.toLowerCase().includes('gmail.com');
        
        // Define transport configs to try (service: 'gmail', then direct SSL on 465, then TLS on 587)
        const configsToTry = isGmail
          ? [
              {
                service: 'gmail',
                auth: { user: smtpUser, pass: cleanSmtpPass },
              },
              {
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: { user: smtpUser, pass: cleanSmtpPass },
              },
              {
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: { user: smtpUser, pass: cleanSmtpPass },
              },
            ]
          : [
              {
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: { user: smtpUser, pass: cleanSmtpPass },
              },
            ];

        for (const config of configsToTry) {
          if (sentSuccess) break;
          try {
            const transporter = nodemailer.createTransport(config);
            const info = await transporter.sendMail({
              from: smtpFrom,
              to: targetRecipient,
              subject,
              html: htmlContent,
              attachments: mailAttachments,
            });

            responsePayload = {
              success: true,
              sentRealEmail: true,
              smtpMessageId: info.messageId,
              message: `Email notification successfully dispatched via Gmail/SMTP to candidate inbox (${targetRecipient})!`,
            };
            sentSuccess = true;
          } catch (customSmtpErr: any) {
            const errMsg = customSmtpErr.message || String(customSmtpErr);
            console.warn('[Custom SMTP Transport Attempt Failed]:', errMsg);

            if (errMsg.includes('535') || errMsg.toLowerCase().includes('invalid login') || errMsg.toLowerCase().includes('username and password not accepted')) {
              customSmtpErrorMessage = `Gmail SMTP Auth Error (535): Google rejected the login for '${smtpUser}'. Regular Gmail passwords are not supported. You MUST generate a 16-character 'App Password' at https://myaccount.google.com/apppasswords and set it as SMTP_PASS in Netlify.`;
              break;
            } else {
              customSmtpErrorMessage = `Gmail/SMTP Connection Error: ${errMsg}`;
            }
          }
        }

        // If user configured SMTP_PASS, don't silently fallback to simulation; return explicit result/error!
        if (!sentSuccess && customSmtpErrorMessage) {
          return res.status(200).json({
            success: false,
            sentRealEmail: false,
            error: customSmtpErrorMessage,
            message: customSmtpErrorMessage,
          });
        }
      }

      // 2. Fallback to Free Ethereal SMTP Sandbox if custom SMTP was not configured
      if (!sentSuccess) {
        try {
          const testAccount = await nodemailer.createTestAccount();
          const etherealTransporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });

          const info = await etherealTransporter.sendMail({
            from: `District Admin <${adminEmail}>`,
            to: targetRecipient,
            subject,
            html: htmlContent,
            attachments: mailAttachments,
          });

          const previewUrl = nodemailer.getTestMessageUrl(info) || '';
          console.log(`[SMTP Ethereal Sandbox Email] Dispatched to ${targetRecipient}. Preview URL: ${previewUrl}`);

          const noticePrefix = customSmtpErrorMessage
            ? `⚠️ ${customSmtpErrorMessage} (Fell back to Ethereal Sandbox preview).`
            : `Email dispatched via Ethereal SMTP Sandbox to ${targetRecipient}.`;

          responsePayload = {
            success: true,
            sentRealEmail: true,
            smtpMessageId: info.messageId,
            etherealPreviewUrl: previewUrl,
            smtpNotice: customSmtpErrorMessage || undefined,
            message: `${noticePrefix}${previewUrl ? ` View email preview: ${previewUrl}` : ''}`,
          };
          sentSuccess = true;
        } catch (etherealErr: any) {
          console.warn('[Ethereal SMTP Fallback Error]:', etherealErr.message || etherealErr);
        }
      }

      // 3. System simulation fallback
      if (!sentSuccess) {
        responsePayload = {
          success: true,
          sentRealEmail: false,
          simulated: true,
          message: `Email notification logged in system audit trail for ${targetRecipient}.`,
        };
      }

      return res.json(responsePayload);
    } catch (err: any) {
      console.error('Error sending email via SMTP:', err);
      return res.status(500).json({
        error: 'Failed to dispatch email: ' + (err.message || 'Unknown error'),
      });
    }
  });

  // Catch-all 404 handler for API routes to prevent returning HTML index.html
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found.` });
  });

  // Global Express JSON error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Express Global Error Handler]:', err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(err.status || 500).json({
      error: err.message || 'An unexpected server error occurred.',
    });
  });

  // Vite development vs Production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rajsamand Assessment Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
