import { sendRoleConfirmationEmail } from '@/lib/email-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        
        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }
    
        // Call the email service to send the role confirmation email
        await sendRoleConfirmationEmail(email);
        
        return NextResponse.json({ message: 'Role confirmation email sent successfully' });
    } catch (error: unknown) {
        return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
        );
    }
}