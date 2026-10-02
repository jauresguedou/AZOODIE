
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { createUser, findUserByEmail} = require("../models/user-model");
const { sendVerificationEmail } = require("../config/mailer");
const pool = require("../config/database");

function showRegisterForm(req,res) {
    res.render("auth/register", { title: "Inscription — AZÔÔDIÉ", errors: [] });

}


async function register(req, res) {
   const { name, email, password } = req.body;
   const allowedRoles = ["client", "professional"];
   const role = req.body.role || "client";

   if (!allowedRoles.includes(role)) {
      return res.status(400).render("auth/register", {
         title: "Inscription — AZÔÔDIÉ",
         errors: [{ msg: "Le type de compte sélectionné est invalide." }],
      });
   }

   const existing = await findUserByEmail(email);

   if (existing) {
    return res.status(400).render("auth/register", {
       title: "Inscription — AZÔÔDIÉ",
       errors: [{msg: "Un compte existe déjà avec cet email."}], 
    });
   }

   const verificationToken = crypto.randomBytes(32).toString("hex");
   const newUser = await createUser({name, email, password, role, verificationToken });

   const verificationLink = `${req.protocol}://${req.get("host")}/verify/${verificationToken}`;

   try{
    await sendVerificationEmail(newUser.email, newUser.name, verificationLink);
   } catch (err) {
      console.error("Email sending failed:", err);
   }

   res.render("auth/check-email", { title: "Vérifiez votre email — AZÔÔDIÉ", email: newUser.email });
}

function showLoginForm(req,res) {
    res.render("auth/login", { title: "Connexion — AZÔÔDIÉ", errors: [] });

}

async function login(req,res) {
     
    const { email, password } = req.body;
    const user = await findUserByEmail(email);

    if(!user) {

        return res.status(400).render("auth/login", {
            title: "Connexion — AZÔÔDIÉ",
            errors: [{msg: "Email ou mot de passe incorrect."}],
        });
    }   


    const match = await bcrypt.compare(password, user.password_hash);
    if(!match) {
        return res.status(400).render("auth/login", {
            title: "Connexion — AZÔÔDIÉ",
            errors: [{msg: "Email ou mot de passe incorrect."}],
        });
    }

    if (!user.email_verified) {
        return res.status(403).render("auth/login", {
            title: "Connexion — AZÔÔDIÉ",
            errors: [{msg: "Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception."}],
        });
    }

    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userRole = user.role;
    req.session.professionalId = user.professional_id;

    res.redirect("/");

    }
   
    function logout (req,res) {
        req.session.destroy(function() {
            res.redirect("/");
        });
   




}

async function verifyEmail(req, res) {
    const { token } = req.params;

    const result = await pool.query(
        
        "UPDATE users SET email_verified = TRUE, verification_token = NULL WHERE verification_token = $1 RETURNING id ",
        [token]

    );

    if (result.rows.length === 0) {
        return res.status(400).send("Lien de verification invalide ou déjà utilisé.");
    }
    res.render("auth/verified", { title: "Email confirmé — AZÔÔDIÉ" });
}



module.exports = { showRegisterForm, register,showLoginForm, login, logout, verifyEmail};