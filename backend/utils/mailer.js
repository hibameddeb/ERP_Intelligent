const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendStatusEmail = async (to, prenom, est_actif) => {
  const subject = est_actif
    ? "Votre compte a été activé"
    : "Votre compte a été désactivé";
  const message = est_actif
    ? `Bonjour ${prenom},\n\nNous avons le plaisir de vous informer que votre compte sur notre plateforme ERP a été activé. Vous pouvez désormais vous connecter.`
    : `Bonjour ${prenom},\n\nVotre compte sur notre plateforme ERP a été désactivé par l'administrateur. Veuillez contacter le support pour plus d'informations.`;

  const mailOptions = {
    from: '"Système ERP" <noreply@erp.tn>',
    to: to,
    subject: subject,
    text: message,
  };

  return transporter.sendMail(mailOptions);
};

const sendAdminNotification = async (to, data) => {
  if (!to) {
    console.warn(
      "⚠️ ADMIN_EMAIL not set in .env — skipping admin notification",
    );
    return;
  }

  const subject = `Nouvelle demande d'adhésion #${data.id}`;
  const message = `
Nouvelle demande d'adhésion reçue.
 
ID         : ${data.id}
Nom        : ${data.nom} ${data.prenom}
Identifiant: ${data.identifiant} (${data.type})
 
Connectez-vous à la plateforme pour traiter cette demande.
    `.trim();

  const mailOptions = {
    from: '"Système ERP" <noreply@erp.tn>',
    to,
    subject,
    text: message,
  };

  return transporter.sendMail(mailOptions);
};

const sendTransferEmail = async (
  email,
  prenom,
  ancienCommercial,
  nouveauCommercial,
) => {
  await transporter.sendMail({
    to: email,
    subject: "Changement de votre commercial attitré",
    html: `
            <p>Bonjour ${prenom},</p>
            <p>Votre commercial <strong>${ancienCommercial}</strong> n'est plus disponible.</p>
            <p>Vous avez été assigné à <strong>${nouveauCommercial}</strong>, 
               qui prend en charge votre dossier.</p>
        `,
  });
};

const sendInvitationEmail = async (to, nom, prenom, role, invitationToken) => {
  const subject = `Invitation à rejoindre la plateforme ERP en tant que ${role}`;
  const message = `
Bonjour ${prenom} ${nom},

Vous êtes invité à rejoindre notre plateforme ERP en tant que ${role}.

Pour compléter votre inscription, utilisez ce token d'invitation : ${invitationToken}

Ou cliquez sur ce lien : http://localhost:3000/activate?token=${invitationToken}

Cordialement,
L'équipe ERP
    `.trim();

  const mailOptions = {
    from: '"Système ERP" <noreply@erp.tn>',
    to: to,
    subject: subject,
    text: message,
  };

  return transporter.sendMail(mailOptions);
};

const sendActivationEmail = async (
  to,
  prenom,
  role,
  accountPassword,
  customPassword = false,
) => {
  const passwordText = customPassword
    ? "Vous pouvez désormais vous connecter avec le mot de passe que vous avez choisi."
    : `Voici votre mot de passe temporaire : ${accountPassword}`;

  const mailOptions = {
    from: '"Système ERP" <noreply@erp.tn>',
    to,
    subject: "Activation de votre accès ERP",
    text: `Bonjour ${prenom},\n\nVotre compte (Rôle: ${role}) a été activé avec succès.\n\n${passwordText}\n\nCordialement.`,
  };

  return transporter.sendMail(mailOptions);
};

const sendTwoFactorCodeEmail = async (to, code) => {
  const mailOptions = {
    from: '"Système ERP" <noreply@erp.tn>',
    to,
    subject: "Votre code de vérification 2FA",
    text: `Votre code de sécurité est : ${code}`,
  };

  return transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (to, code) => {
  const mailOptions = {
    from: '"Système ERP" <noreply@erp.tn>',
    to,
    subject: "Réinitialisation de mot de passe",
    text: `Votre code de récupération est : ${code}`,
  };

  return transporter.sendMail(mailOptions);
};

// ── Paiement fournisseur via Konnect ─────────────────────────────────────────
const sendPaymentLinkEmail = async (to, prenom, nom, numFacture, totalTtc, payUrl) => {
  const mailOptions = {
    from: '"Système ERP" <noreply@erp.tn>',
    to,
    subject: `💳 Paiement de votre facture ${numFacture}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#f5f5f5;padding:32px;border-radius:14px;">
        <div style="background:linear-gradient(135deg,#2B7574,#0E2931);border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">Paiement de facture</h1>
          <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:13px;">ERP OrderFlow Pro</p>
        </div>
        <p style="color:#333;font-size:15px;margin-bottom:6px;">
          Bonjour <strong>${prenom} ${nom}</strong>,
        </p>
        <p style="color:#666;font-size:14px;line-height:1.6;margin-bottom:20px;">
          Une demande de paiement vous a été envoyée. Cliquez sur le bouton ci-dessous pour procéder au règlement sécurisé.
        </p>
        <div style="background:#fff;border:1px solid #e8e8e8;border-radius:12px;padding:20px;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f5f5f5;">
            <span style="color:#999;font-size:13px;">N° Facture</span>
            <span style="color:#333;font-weight:700;font-size:13px;">${numFacture}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;">
            <span style="color:#999;font-size:13px;">Montant TTC</span>
            <span style="color:#2B7574;font-weight:800;font-size:18px;">${parseFloat(totalTtc).toFixed(3)} DT</span>
          </div>
        </div>
        <div style="text-align:center;margin:28px 0;">
          <a href="${payUrl}"
             style="background:linear-gradient(135deg,#2B7574,#12484C);color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 16px rgba(43,117,116,0.35);">
            💳 Payer maintenant — ${parseFloat(totalTtc).toFixed(3)} DT
          </a>
        </div>
        <p style="color:#aaa;font-size:11px;text-align:center;margin-top:20px;">
          Ce lien est valable <strong>60 minutes</strong>. Paiement sécurisé par <strong>Konnect</strong> · Certifié PCI-DSS · Agréé BCT 🇹🇳
        </p>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendStatusEmail,
  sendAdminNotification,
  sendTransferEmail,
  sendInvitationEmail,
  sendActivationEmail,
  sendTwoFactorCodeEmail,
  sendPasswordResetEmail,
  sendPaymentLinkEmail, 
};