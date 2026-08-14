
const bcrypt = require("bcrypt");
const { createUser, findUserByEmail} = require("../models/user-model");

function showRegisterForm(req,res) {
    res.render("auth/register", { errors: []});

}


async function register(req, res) {
   const {name, email, password} = req.body;

   const existing = await findUserByEmail(email);

   if (existing) {
    return res.status(400).render("auth/register", {
       errors: [{msg: "Un compte existe déjà avec cet email."}], 
    });
   }

   await createUser({name, email, password});
   res.redirect("/login");
}

function showLoginForm(req,res) {
    res.render("auth/login", { errors: []});

}

async function login(req,res) {
     
    const { email, password } = req.body;
    const user = await findUserByEmail(email);

    if(!user) {

        return res.status(400).render("auth/login", {
            errors: [{msg: "Email ou mot de passe incorrect."}],
        });
    }   


    const match = await bcrypt.compare(password, user.password_hash);
    if(!match) {
        return res.status(400).render("auth/login", {
            errors: [{msg: "Email ou mot de passe incorrect."}],
        });
    }

    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userRole = user.role;

    res.redirect("/");

    }
   
    function logout (req,res) {
        req.session.destroy(function() {
            res.redirect("/");
        });
   




}


module.exports = { showRegisterForm, register,showLoginForm, login, logout};