// Protects every route under /employees/admin with a shared admin token.
// The token is supplied via the ADMIN_TOKEN environment variable and must be
// sent by clients in the X-Admin-Token header.
function adminAuth(req, res, next) {
  if (!req.path.startsWith("/employees/admin")) {
    return next();
  }

  const provided = req.get("x-admin-token");
  if (provided !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
}

module.exports = adminAuth;
