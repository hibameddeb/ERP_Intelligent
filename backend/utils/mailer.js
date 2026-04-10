const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 587, secure: false,
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    },
    tls: {
        rejectUnauthorized: false 
    }
});

const sendStatusEmail = async (to, prenom, est_actif) => {
    const subject = est_actif ? "Votre compte a été activé" : "Votre compte a été désactivé";
    const message = est_actif 
        ? `Bonjour ${prenom},\n\nNous avons le plaisir de vous informer que votre compte sur notre plateforme ERP a été activé. Vous pouvez désormais vous connecter.`
        : `Bonjour ${prenom},\n\nVotre compte sur notre plateforme ERP a été désactivé par l'administrateur. Veuillez contacter le support pour plus d'informations.`;

    const mailOptions = {
        from: '"Système ERP" <noreply@erp.tn>',
        to: to,
        subject: subject,
        text: message
    };

    return transporter.sendMail(mailOptions);
};


const sendAdminNotification = async (to, data) => {
    if (!to) {
        console.warn("⚠️ ADMIN_EMAIL not set in .env — skipping admin notification");
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
        text: message
    };
 
    return transporter.sendMail(mailOptions);
};
 

const sendTransferEmail = async (email, prenom, ancienCommercial, nouveauCommercial) => {
    await transporter.sendMail({
        to: email,
        subject: "Changement de votre commercial attitré",
        html: `
            <p>Bonjour ${prenom},</p>
            <p>Votre commercial <strong>${ancienCommercial}</strong> n'est plus disponible.</p>
            <p>Vous avez été assigné à <strong>${nouveauCommercial}</strong>, 
               qui prend en charge votre dossier.</p>
        `
    });
};

module.exports = { sendStatusEmail, sendAdminNotification, sendTransferEmail  };

