import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}

export class EmailService {
    private static fromEmail = process.env.EMAIL_FROM || 'ServiConnect <noreply@serviconnect.com>';

    static async send(options: EmailOptions): Promise<boolean> {
        try {
            const { data, error } = await resend.emails.send({
                from: options.from || this.fromEmail,
                to: Array.isArray(options.to) ? options.to : [options.to],
                subject: options.subject,
                html: options.html,
            });

            if (error) {
                console.error('Error sending email:', error);
                return false;
            }

            console.log('Email sent successfully:', data);
            return true;
        } catch (error) {
            console.error('Failed to send email:', error);
            return false;
        }
    }

    // Appointment Confirmation Email
    static async sendAppointmentConfirmation(data: {
        to: string;
        customerName: string;
        businessName: string;
        serviceName: string;
        date: string;
        time: string;
        address: string;
        price: number;
        appointmentId: string;
    }): Promise<boolean> {
        const html = this.getAppointmentConfirmationTemplate(data);
        return this.send({
            to: data.to,
            subject: `✅ Cita Confirmada - ${data.businessName}`,
            html,
        });
    }

    // Appointment Reminder Email (24h before)
    static async sendAppointmentReminder(data: {
        to: string;
        customerName: string;
        businessName: string;
        serviceName: string;
        date: string;
        time: string;
        address: string;
    }): Promise<boolean> {
        const html = this.getAppointmentReminderTemplate(data);
        return this.send({
            to: data.to,
            subject: `⏰ Recordatorio de Cita - ${data.businessName}`,
            html,
        });
    }

    // Appointment Cancellation Email
    static async sendAppointmentCancellation(data: {
        to: string;
        customerName: string;
        businessName: string;
        serviceName: string;
        date: string;
        time: string;
        cancelledBy: 'customer' | 'business';
    }): Promise<boolean> {
        const html = this.getAppointmentCancellationTemplate(data);
        return this.send({
            to: data.to,
            subject: `❌ Cita Cancelada - ${data.businessName}`,
            html,
        });
    }

    // Business Notification: New Appointment
    static async sendNewAppointmentNotification(data: {
        to: string;
        businessName: string;
        customerName: string;
        serviceName: string;
        date: string;
        time: string;
        phone?: string;
    }): Promise<boolean> {
        const html = this.getNewAppointmentNotificationTemplate(data);
        return this.send({
            to: data.to,
            subject: `🔔 Nueva Reserva - ${data.serviceName}`,
            html,
        });
    }

    // Templates
    private static getAppointmentConfirmationTemplate(data: any): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px 20px; }
        .info-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
        .info-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #666; }
        .value { color: #333; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Cita Confirmada</h1>
        </div>
        <div class="content">
            <p>Hola <strong>${data.customerName}</strong>,</p>
            <p>Tu cita ha sido confirmada exitosamente. Aquí están los detalles:</p>
            
            <div class="info-box">
                <div class="info-row">
                    <span class="label">Negocio:</span>
                    <span class="value">${data.businessName}</span>
                </div>
                <div class="info-row">
                    <span class="label">Servicio:</span>
                    <span class="value">${data.serviceName}</span>
                </div>
                <div class="info-row">
                    <span class="label">Fecha:</span>
                    <span class="value">${data.date}</span>
                </div>
                <div class="info-row">
                    <span class="label">Hora:</span>
                    <span class="value">${data.time}</span>
                </div>
                <div class="info-row">
                    <span class="label">Ubicación:</span>
                    <span class="value">${data.address}</span>
                </div>
                <div class="info-row">
                    <span class="label">Total:</span>
                    <span class="value"><strong>$${data.price}</strong></span>
                </div>
            </div>

            <p>Te enviaremos un recordatorio 24 horas antes de tu cita.</p>
            
            <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Ver Mis Citas</a>
            </p>

            <p style="font-size: 14px; color: #666;">
                Si necesitas cancelar o reprogramar, puedes hacerlo desde tu panel de control.
            </p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} ServiConnect. Todos los derechos reservados.</p>
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    private static getAppointmentReminderTemplate(data: any): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px 20px; }
        .reminder-box { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
        .reminder-box h2 { margin: 0 0 10px 0; color: #856404; }
        .info-box { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-row { padding: 8px 0; }
        .button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Recordatorio de Cita</h1>
        </div>
        <div class="content">
            <div class="reminder-box">
                <h2>¡Tu cita es mañana!</h2>
                <p style="margin: 0; font-size: 18px;"><strong>${data.time}</strong></p>
            </div>

            <p>Hola <strong>${data.customerName}</strong>,</p>
            <p>Este es un recordatorio amistoso de tu cita programada para mañana:</p>
            
            <div class="info-box">
                <div class="info-row">📍 <strong>${data.businessName}</strong></div>
                <div class="info-row">✂️ ${data.serviceName}</div>
                <div class="info-row">📅 ${data.date}</div>
                <div class="info-row">🕐 ${data.time}</div>
                <div class="info-row">📌 ${data.address}</div>
            </div>

            <p>Te esperamos. Si necesitas cancelar o reprogramar, hazlo lo antes posible.</p>
            
            <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Gestionar Cita</a>
            </p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} ServiConnect. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    private static getAppointmentCancellationTemplate(data: any): string {
        const message = data.cancelledBy === 'customer'
            ? 'Has cancelado tu cita exitosamente.'
            : 'Tu cita ha sido cancelada por el negocio.';

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px 20px; }
        .info-box { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❌ Cita Cancelada</h1>
        </div>
        <div class="content">
            <p>Hola <strong>${data.customerName}</strong>,</p>
            <p>${message}</p>
            
            <div class="info-box">
                <div><strong>${data.businessName}</strong></div>
                <div>${data.serviceName}</div>
                <div>${data.date} a las ${data.time}</div>
            </div>

            <p>Puedes hacer una nueva reserva cuando lo desees.</p>
            
            <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/explore" class="button">Explorar Servicios</a>
            </p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} ServiConnect. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    private static getNewAppointmentNotificationTemplate(data: any): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px 20px; }
        .highlight-box { background: #d4edda; border: 2px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .info-box { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 Nueva Reserva</h1>
        </div>
        <div class="content">
            <div class="highlight-box">
                <h2 style="margin: 0 0 10px 0;">¡Tienes una nueva cita!</h2>
                <p style="margin: 0; font-size: 18px;"><strong>${data.date} a las ${data.time}</strong></p>
            </div>

            <p>Hola <strong>${data.businessName}</strong>,</p>
            <p>Has recibido una nueva reserva:</p>
            
            <div class="info-box">
                <div><strong>Cliente:</strong> ${data.customerName}</div>
                ${data.phone ? `<div><strong>Teléfono:</strong> ${data.phone}</div>` : ''}
                <div><strong>Servicio:</strong> ${data.serviceName}</div>
                <div><strong>Fecha:</strong> ${data.date}</div>
                <div><strong>Hora:</strong> ${data.time}</div>
            </div>

            <p>Puedes gestionar esta cita desde tu panel de administración.</p>
            
            <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/admin/appointments" class="button">Ver en Dashboard</a>
            </p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} ServiConnect. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
        `;
    }
}
