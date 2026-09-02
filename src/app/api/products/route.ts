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
    const { name, description, category, subType, specialty, basePrice, price, isActive, cohort, startDate, endDate, postSaleCampaignId, nurturingCampaignId } = body;

    if (!name || !category || !subType) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios ausentes.' },
        { status: 400 }
      );
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        category,
        subType,
        specialty: specialty || null,
        basePrice: basePrice !== undefined ? Number(basePrice) : null,
        price: price !== undefined ? Number(price) : (basePrice !== undefined ? Number(basePrice) : null),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        cohort: cohort || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        postSaleCampaignId: postSaleCampaignId || null,
        nurturingCampaignId: nurturingCampaignId || null,
      }
    });

    return NextResponse.json({ success: true, data: newProduct });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
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
    const { id, name, description, category, subType, specialty, basePrice, price, isActive, cohort, startDate, endDate, postSaleCampaignId, nurturingCampaignId } = body;

    if (!id || !name || !category || !subType) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios ausentes.' },
        { status: 400 }
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        category,
        subType,
        specialty: specialty || null,
        basePrice: basePrice !== undefined ? Number(basePrice) : null,
        price: price !== undefined ? Number(price) : (basePrice !== undefined ? Number(basePrice) : null),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        cohort: cohort || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        postSaleCampaignId: postSaleCampaignId || null,
        nurturingCampaignId: nurturingCampaignId || null,
      }
    });

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    const currentUserRole = (session?.user as any)?.role;

    if (currentUserRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem gerenciar produtos.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'id é obrigatório' }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Produto excluído com sucesso.' });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
