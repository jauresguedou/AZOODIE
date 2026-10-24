const invitationModel = require("../models/construction-invitation-model");
const constructionProjectModel = require("../models/construction-project-model");

function parsePositiveId(value) {
    const id = Number(value);

    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function renderError(res, message, status = 400) {
    return res.status(status).send(message);
}

/**
 * Invite an existing registered user to a project.
 */
async function inviteMember(req, res) {
    const ownerId = req.session.userId;
    const projectId = parsePositiveId(req.params.projectId);

    const email = typeof req.body.email === "string"
        ? req.body.email.trim()
        : "";

    const memberRole = typeof req.body.member_role === "string"
        ? req.body.member_role.trim()
        : "";

    if (!projectId) {
        return renderError(res, "Chantier introuvable.", 404);
    }

    if (!email || email.length > 320) {
        return renderError(res, "Indiquez une adresse e-mail valide.");
    }

    if (!["site_manager", "viewer"].includes(memberRole)) {
        return renderError(res, "Sélectionnez un rôle valide.");
    }

    const invitation = await invitationModel.createInvitation(
        ownerId,
        projectId,
        email,
        memberRole
    );

    if (!invitation) {
        return renderError(
            res,
            "Invitation impossible : vérifiez le chantier et l'adresse e-mail. Cet utilisateur possède peut-être déjà un accès ou une invitation en attente.",
            409
        );
    }

    return res.redirect(`/chantiers/${projectId}?invitation=created`);
}

/**
 * Display invitations received by the logged-in user.
 */
async function listMyInvitations(req, res) {
    const invitations = await invitationModel.getPendingInvitations(
        req.session.userId
    );

    return res.render("chantiers/invitations", {
        title: "Mes invitations — AZÔÔDIÉ",
        invitations
    });
}

/**
 * Accept or decline an invitation belonging to the logged-in user.
 */
async function respondToInvitation(req, res) {
    const membershipId = parsePositiveId(req.params.membershipId);
    const decision = req.body.decision;

    if (!membershipId) {
        return renderError(res, "Invitation introuvable.", 404);
    }

    if (!["accepted", "declined"].includes(decision)) {
        return renderError(res, "Choisissez d'accepter ou de refuser l'invitation.");
    }

    const result = await invitationModel.respondToInvitation(
        membershipId,
        req.session.userId,
        decision
    );

    if (!result) {
        return renderError(
            res,
            "Cette invitation n'existe plus ou a déjà été traitée.",
            404
        );
    }

    if (decision === "accepted") {
        return res.redirect(`/chantiers/${result.project_id}`);
    }

    return res.redirect("/chantiers/invitations");
}

/**
 * Show the project members to its owner only.
 */
async function showProjectMembers(req, res) {
    const projectId = parsePositiveId(req.params.projectId);

    if (!projectId) {
        return renderError(res, "Chantier introuvable.", 404);
    }

    const project = await constructionProjectModel.getProjectForUser(
        projectId,
        req.session.userId
    );

    if (!project || project.access_role !== "owner") {
        return renderError(res, "Chantier introuvable.", 404);
    }

    const members = await invitationModel.getProjectMembers(
        req.session.userId,
        projectId
    );

    return res.render("chantiers/members", {
        title: `Membres — ${project.title} — AZÔÔDIÉ`,
        project,
        members
    });
}

/**
 * Revoke a pending invitation or an accepted member's access.
 */
async function revokeProjectMember(req, res) {
    const projectId = parsePositiveId(req.params.projectId);
    const membershipId = parsePositiveId(req.params.membershipId);

    if (!projectId || !membershipId) {
        return renderError(res, "Membre ou chantier introuvable.", 404);
    }

    const revoked = await invitationModel.revokeMember(
        req.session.userId,
        projectId,
        membershipId
    );

    if (!revoked) {
        return renderError(
            res,
            "Impossible de révoquer cet accès. Vérifiez que vous êtes le propriétaire du chantier.",
            403
        );
    }

    return res.redirect(`/chantiers/${projectId}/membres`);
}

module.exports = {
    inviteMember,
    listMyInvitations,
    respondToInvitation,
    showProjectMembers,
    revokeProjectMember
};
