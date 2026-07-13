import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import fs from 'fs';
import path from 'path';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'prisma_data', 'settings.json');

function getSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading settings file:', err);
  }
  return {
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: '',
    voipProvider: 'twilio',
    voipApiKey: '',
    voipAccountSid: '',
    voipLineNumber: '',
    whatsappUrl: '',
    whatsappApiKey: '',
    whatsappInstance: ''
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response('Unauthorized', { status: 403 });
    }

    const settings = getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response('Unauthorized', { status: 403 });
    }

    const body = await request.json();
    
    // Garantir que a pasta exista
    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(body, null, 2), 'utf-8');
    
    // Atualizar process.env dinamicamente para o NotificationService ler
    if (body.whatsappUrl) process.env.EVOLUTION_API_URL = body.whatsappUrl;
    if (body.whatsappApiKey) process.env.EVOLUTION_API_KEY = body.whatsappApiKey;
    if (body.whatsappInstance) process.env.EVOLUTION_API_INSTANCE = body.whatsappInstance;
    
    // Se configurar SMTP próprio, podemos mapear também
    if (body.smtpHost) {
      process.env.SMTP_SERVICE_URL = body.smtpHost; 
    }

    return NextResponse.json({ success: true, data: body });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
