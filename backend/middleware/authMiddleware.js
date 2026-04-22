const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        console.log(" No Authorization header");
        return res.status(403).json({ message: "Accès refusé." });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        console.log(" No token provided");
        return res.status(403).json({ message: "Accès refusé." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ma_cle_secrete_erp_2026');
        console.log(" USER:", decoded);
        req.user = decoded;
        next();
    } catch (err) {
        console.log(" Token invalid:", err.message);
        return res.status(401).json({ message: "Session expirée." });
    }
};

exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        return res.status(403).json({ message: "Droits insuffisants. Réservé à l'administrateur." });
    }
};

exports.isFournisseur = (req, res, next) => {
    if (req.user && req.user.role === 'FOURNISSEUR') {
        next();
    } else {
        return res.status(403).json({ message: "Accès réservé aux fournisseurs." });
    }
};

exports.isAdminOrFournisseur = (req, res, next) => {
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'FOURNISSEUR')) {
        next();
    } else {
        return res.status(403).json({ message: "Accès réservé aux administrateurs et fournisseurs." });
    }
};

exports.isCommercial = (req, res, next) => {
    if (req.user && (req.user.role === 'COMMERCIAL' || req.user.role === 'ADMIN')) {
        next();
    } else {
        return res.status(403).json({ message: "Accès réservé au staff commercial." });
    }
};

exports.isClient = (req, res, next) => {
    if (req.user && (req.user.role === 'CLIENT' || req.user.role === 'ADMIN')) {
        next();
    } else {
        return res.status(403).json({ message: "Accès réservé aux clients." });
    }
};

exports.isComptable = (req, res, next) => {
    if (req.user && (req.user.role === 'COMPTABLE' || req.user.role === 'ADMIN')) {
        next();
    } else {
        return res.status(403).json({ message: "Accès réservé aux comptables." });
    }
};

exports.isStaff = (req, res, next) => {
    const rolesStaff = ['ADMIN', 'COMMERCIAL', 'COMPTABLE'];

    if (!req.user) {
        return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    if (!rolesStaff.includes(req.user.role)) {
        console.log(" Access denied for role:", req.user.role);
        return res.status(403).json({ message: "Accès réservé au personnel interne." });
    }

    next();
};