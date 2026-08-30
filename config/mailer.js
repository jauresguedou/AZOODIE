const SibApiV3Sdk = require("sib-api-v3-sdk");


const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi ();

async function sendVerificationEmail(toEmail, toName, verificationLink) {
    const sendSmtpEmail = {
        sender: { email: process.env.BREVO_SENDER_EMAIL, name: "AZÔÔDIÉ" },
        to: [{email: toEmail, name: toName}],
        subject: "Confirmer votre adresse email - AZÔÔDIÉ ",
        htmlContent: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; ">
               <h2 style="color: #0F6E6E;"> Bienvenue sur  AZÔÔDIÉ, ${toName} ! </h2>
               <p> Merci de vous être inscrit. Cliquez sur le lien ci-dessous pour confirmer votre adresse email: </p>
               <a href="${verificationLink}" style="display:inline-block;  background:#E8853B; color:#fff; padding:12px 24px; border-radius:10px; text-decoration:none; font-weight:bold;"> Confirmer mon email </a>
               <p style="color:#9CA3AF; font-size:0.85 rem; margin-top:20px;">Si vous n'avez pas créé de compte,  ignorez cet email. </p>

            </div>
  
        `,
    };
    return apiInstance.sendTransacEmail(sendSmtpEmail);
}

module.exports = { sendVerificationEmail };