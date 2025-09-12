import fs from 'fs';
import path from 'path';
import nodemailer, { SentMessageInfo } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const FRONT_URL = process.env.FRONT_URL ?? "http://localhost:3000";

export async function deleteFile(filePath: string): Promise<void> {
  try {
    const absolutePath = path.resolve(filePath);
    await fs.unlinkSync(absolutePath);
    console.log(`File deleted: ${absolutePath}`);
  } catch (error: any) {
    console.error(`Error deleting file: ${error?.message ?? "Unknown error"}`);
    throw error;
  }
}

export const formatToBRL = (amountInCents: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(amountInCents / 100);
};




const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({ email, subject, html }: { email: string; subject: string; html: string }): Promise<SentMessageInfo> {
  return await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject,
    html,
  });
}

export const emailsTemplates = {
  welcome: ({ email, name, temp_pass }: { name: string, email: string, temp_pass: string }) => `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Bem-vindo à Plataforma</title>
      <style>
        body {
          background-color: #f8f9fa;
          font-family: Arial, sans-serif;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          background-color: #ffffff;
          margin: 40px auto;
          padding: 30px;
          border-radius: 8px;
          border: 1px solid #ddd;
        }
        .header {
          text-align: center;
          color: #0d6efd;
        }
        .button {
          background-color: #0d6efd;
          color: #fff;
          padding: 12px 20px;
          text-decoration: none;
          border-radius: 5px;
          display: inline-block;
        }
        .info {
          background-color: #f1f1f1;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #777;
          text-align: center;
        }
        .button-container {
          text-align: center;
          margin: 40px 0;
        }
        .button-container a {
          color: #FFF;
          font-weight: bold;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2 class="header">🎉 Bem-vindo(a), ${name}!</h2>
        <p>Estamos muito felizes por ter você com a gente.</p>
        <p>Aqui estão suas credenciais de acesso para começar:</p>

        <div class="info">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Senha temporária:</strong> ${temp_pass}</p>
        </div>

        <p>Recomendamos que você altere sua senha no primeiro acesso.</p>

        <div class="button-container">
          <a class="button" href="${FRONT_URL}/login">Acessar Plataforma</a>
        </div>


        <div class="footer">
          <p>Se você tiver qualquer dúvida, fale com nosso suporte (KUMO):</p>
          <p>Whatsapp: (11) 98944-2271 </p>
          <p>Ou, se preferir, pelo email: suporte@kumotecnologia.com </p>
          <br/>
          <p>Obrigado por escolher a FUN.AI!</p>
        </div>
      </div>
    </body>
    </html>
  `,

  invoiceConfirmation: ({ name, invoiceId, amount, plan_name }: { invoiceId: string; amount: string; name: string; plan_name: string }) => `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Pagamento Confirmado</title>
      <style>
        body {
          background-color: #f8f9fa;
          font-family: Arial, sans-serif;
          color: #333;
        }
        .container {
          max-width: 600px;
          background-color: #ffffff;
          margin: 40px auto;
          padding: 30px;
          border-radius: 8px;
          border: 1px solid #ddd;
        }
        .header {
          text-align: center;
          color: #198754;
        }
        .info {
          background-color: #e9f7ef;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
        }
        .info .id{
          color: #777;
          font-size: 12px;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #777;
          text-align: center;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2 class="header">✅ Pagamento Confirmado</h2>
        <p>Olá ${name},</p>
        <p>Recebemos com sucesso o pagamento do seu plano. Aqui estão os detalhes:</p>

        <div class="info">
          <p class="id">Invoice ID: ${invoiceId}</p>
          <p><strong>Plano:</strong> ${plan_name}</p>
          <p><strong>Valor:</strong> ${amount}</p>
        </div>

        <p>Obrigado por confiar em nossa plataforma!</p>

        <div class="footer">
          <p>Se você tiver qualquer dúvida, fale com nosso suporte (KUMO):</p>
          <p>Whatsapp: (11) 98944-2271</p>
          <p>Ou, se preferir, pelo email: suporte@kumotecnologia.com </p>
          <br/>
          <p>Obrigado por escolher a FUN.AI!</p>
        </div>
      </div>
    </body>
    </html>
  `,

  invoiceFailed: ({ name }: { name: string }) => `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Problema no Pagamento</title>
      <style>
        body {background:#f8f9fa;font-family:Arial,sans-serif;color:#333;margin:0;padding:0;}
        .container {max-width:600px;background:#fff;margin:40px auto;padding:30px;border-radius:8px;border:1px solid #ddd;}
        .header {text-align:center;color:#dc3545;}
        .button {background:#dc3545;color:#fff;padding:12px 20px;text-decoration:none;border-radius:5px;display:inline-block;}
        .info {background:#f1f1f1;padding:15px;border-radius:5px;margin-top:20px;}
        .footer {margin-top:30px;font-size:12px;color:#777;text-align:center;}
        .button-container {text-align:center;margin:40px 0;}
        .button-container a {color:#FFF;font-weight:bold;}
      </style>
    </head>
    <body>
      <div class="container">
        <h2 class="header">⚠️ Problema no Pagamento</h2>
        <p>Olá, ${name},</p>
        <p>Tivemos um problema ao processar o pagamento da sua assinatura.</p>
        <p>Para evitar a interrupção do seu acesso, pedimos que atualize seus dados de pagamento.</p>
        
        <div class="button-container">
          <a class="button" href="${FRONT_URL}/billing">Atualizar Pagamento</a>
        </div>

        <div class="footer">
          <p>Se precisar de ajuda, fale com nosso suporte (KUMO):</p>
          <p>Whatsapp: (11) 98944-2271 </p>
          <p>Email: suporte@kumotecnologia.com </p>
          <br/>
          <p>Obrigado por usar a FUN.AI!</p>
        </div>
      </div>
    </body>
    </html>
  `,

  subscriptionCanceled: ({ name }: { name: string }) => `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Assinatura Cancelada</title>
      <style>
        body {background:#f8f9fa;font-family:Arial,sans-serif;color:#333;margin:0;padding:0;}
        .container {max-width:600px;background:#fff;margin:40px auto;padding:30px;border-radius:8px;border:1px solid #ddd;}
        .header {text-align:center;color:#6c757d;}
        .button {background:#0d6efd;color:#fff;padding:12px 20px;text-decoration:none;border-radius:5px;display:inline-block;}
        .footer {margin-top:30px;font-size:12px;color:#777;text-align:center;}
        .button-container {text-align:center;margin:40px 0;}
        .button-container a {color:#FFF;font-weight:bold;}
      </style>
    </head>
    <body>
      <div class="container">
        <h2 class="header">🛑 Assinatura Cancelada</h2>
        <p>Olá, ${name},</p>
        <p>Sua assinatura foi cancelada com sucesso, e seu acesso será encerrado em breve.</p>
        <p>Se isso foi um engano ou se deseja continuar usando a FUN.AI, entre em contato com nosso suporte.</p>

        <div class="footer">
          <p>Estamos à disposição para te ajudar: </p>
          <p>Whatsapp: (11) 98944-2271 </p>
          <p>Email: suporte@kumotecnologia.com </p>
          <br/>
          <p>Obrigado por ter feito parte da FUN.AI!</p>
        </div>
      </div>
    </body>
    </html>
  `,

  resetPassword: ({ name, reset_link }: { name: string, reset_link: string }) => `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Recuperação de Senha</title>
      <style>
        body {background:#f8f9fa;font-family:Arial,sans-serif;color:#333;margin:0;padding:0;}
        .container {max-width:600px;background:#fff;margin:40px auto;padding:30px;border-radius:8px;border:1px solid #ddd;}
        .header {text-align:center;color:#0d6efd;}
        .button {background:#0d6efd;color:#fff;padding:12px 20px;text-decoration:none;border-radius:5px;display:inline-block;}
        .footer {margin-top:30px;font-size:12px;color:#777;text-align:center;}
        .button-container {text-align:center;margin:40px 0;}
        .button-container a {color:#FFF;font-weight:bold;}
      </style>
    </head>
    <body>
      <div class="container">
        <h2 class="header">🔑 Recuperação de Senha</h2>
        <p>Olá, ${name},</p>
        <p>Recebemos uma solicitação para redefinir sua senha.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        
        <div class="button-container">
          <a class="button" href="${reset_link}">Redefinir Senha</a>
        </div>

        <p>Se você não fez essa solicitação, ignore este email.</p>

        <div class="footer">
          <p>Suporte FUN.AI (KUMO):</p>
          <p>Whatsapp: (11) 98944-2271 </p>
          <p>Email: suporte@kumotecnologia.com </p>
        </div>
      </div>
    </body>
    </html>
  `,

  subscriptionUpdated: ({ name, plan_name, plan_price }: { plan_name: string, plan_price: string, name: string }) => `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Plano Atualizado</title>
      <style>
        body {background:#f8f9fa;font-family:Arial,sans-serif;color:#333;margin:0;padding:0;}
        .container {max-width:600px;background:#fff;margin:40px auto;padding:30px;border-radius:8px;border:1px solid #ddd;}
        .header {text-align:center;color:#198754;}
        .button {background:#198754;color:#fff;padding:12px 20px;text-decoration:none;border-radius:5px;display:inline-block;}
        .info {background:#f1f1f1;padding:15px;border-radius:5px;margin-top:20px;}
        .footer {margin-top:30px;font-size:12px;color:#777;text-align:center;}
        .button-container {text-align:center;margin:40px 0;}
        .button-container a {color:#FFF;font-weight:bold;}
      </style>
    </head>
    <body>
      <div class="container">
        <h2 class="header">✅ Plano Atualizado</h2>
        <p>Olá, ${name},</p>
        <p>Sua assinatura foi atualizada com sucesso!</p>
        
        <div class="info">
          <p><strong>Novo Plano:</strong> ${plan_name}</p>
          <p><strong>Valor:</strong> ${plan_price}/mês</p>
        </div>

        <p>Agora você já pode aproveitar os novos recursos disponíveis no seu plano.</p>

        <div class="button-container">
          <a class="button" href="${FRONT_URL}/dashboard">Acessar Plataforma</a>
        </div>

        <div class="footer">
          <p>Qualquer dúvida, fale com nosso suporte (KUMO):</p>
          <p>Whatsapp: (11) 98944-2271 </p>
          <p>Email: suporte@kumotecnologia.com </p>
          <br/>
          <p>Obrigado por continuar com a FUN.AI!</p>
        </div>
      </div>
    </body>
    </html>
  `,


  subscriptionCanceledAtEndPeriod: ({ name, end_date }: { name: string, end_date: string }) => `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Acesso até o final do período</title>
      <style>
        body {
          background-color: #f8f9fa;
          font-family: Arial, sans-serif;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          background-color: #ffffff;
          margin: 40px auto;
          padding: 30px;
          border-radius: 8px;
          border: 1px solid #ddd;
        }
        .header {
          text-align: center;
          color: #dc3545;
        }
        .info {
          background-color: #fff3cd;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
          border: 1px solid #ffeeba;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #777;
          text-align: center;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2 class="header">⚠️ Assinatura Cancelada</h2>
        <p>Olá, ${name},</p>
        <p>Confirmamos o cancelamento da sua assinatura.</p>
        
        <div class="info">
          <p>📅 No entanto, você ainda terá acesso à FUN.AI até o final do seu período vigente: <strong>${end_date}</strong>.</p>
        </div>

        <p>Ainda dá tempo de aproveitar nossos recursos! Se quiser reativar sua assinatura antes disso, estaremos por aqui. 😊</p>
        
        <p>Se precisar de ajuda ou quiser voltar a qualquer momento, fale com a gente.</p>

        <div class="footer">
          <p>Suporte FUN.AI (KUMO):</p>
          <p>Whatsapp: (11) 98944-2271</p>
          <p>Email: suporte@kumotecnologia.com</p>
          <br/>
          <p>Obrigado por fazer parte da nossa comunidade!</p>
        </div>
      </div>
    </body>
    </html>
`
};