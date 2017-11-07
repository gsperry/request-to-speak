const SamlStrategy = require('passport-saml').Strategy;

module.exports = function (passport, config) {

  passport.serializeUser(function (user, cb) {
    cb(null, user);
  });

  passport.deserializeUser(function (user, cb) {
    cb(null, user);
  });

  passport.use(new SamlStrategy(
    {
      path: config.saml.path,
      entryPoint: config.saml.entryPoint,
      issuer: config.saml.issuer,
      cert: config.saml.cert
    },
    function (profile, cb) {
      return cb(null,
        {
          id: profile.nameID,
          email: profile.email,
          displayName: profile.displayName,
          firstName: profile.firstName,
          lastName: profile.lastName,
          groups: profile.groups
        });
    })
  );
};