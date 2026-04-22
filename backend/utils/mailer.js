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

module.exports = {
  sendStatusEmail,
  sendAdminNotification,
  sendTransferEmail,
  sendInvitationEmail,
  sendActivationEmail,
  sendTwoFactorCodeEmail,
  sendPasswordResetEmail,
};
