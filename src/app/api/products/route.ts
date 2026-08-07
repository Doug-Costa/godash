import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const currentUserRole = (session?.user as any)?.role;

    if (currentUserRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem gerenciar produtos.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, category, subType, basePrice } = body;

    if (!name || !category || !subType) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios ausentes.' },
        { status: 400 }
      );
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        category,
        subType,
        basePrice: basePrice ? Number(basePrice) : null,
        price: basePrice ? Number(basePrice) : null
      }
    });

    return NextResponse.json({ success: true, data: newProduct });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
