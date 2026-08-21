export const requireInstitutionAdmin = (req, res, next) => {
  // If user has role 'institution_admin' or global 'admin'
  if (req.user.role === 'institution_admin' || req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Institution admin access required' });
};