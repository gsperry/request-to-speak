const SamlStrategy = require("passport-saml").Strategy;
let xmlParser = require("xml2js");

module.exports = function(passport, config) {
    passport.serializeUser(function(user, cb) {
        cb(null, user);
    });

    passport.deserializeUser(function(user, cb) {
        cb(null, user);
    });

    passport.use(new SamlStrategy({
        callbackUrl: config.saml.callbackUrl,
        path: config.saml.path,
        entryPoint: config.saml.entryPoint,
        issuer: config.saml.issuer,
        // privateCert: fs.readFileSync(config.privateCertPath, "utf-8"),
        // cert: fs.readFileSync(config.certPath, "utf-8"),
        authnContext: config.authnContext,
        acceptedClockSkewMs: config.acceptedClockSkewMs,
        identifierFormat: null
        // this is configured under the Advanced tab in AD FS relying party
        // signatureAlgorithm: config.signatureAlgorithm
    }, function(profile, cb) {
        let profileObject = xmlParser.parseString(profile.getAssertionXml(), function(err, data) {
            cb(null, {
                id: data.Assertion.AttributeStatement[0].Attribute[0].AttributeValue[0],
                email: data.Assertion.AttributeStatement[0].Attribute[0].AttributeValue[0]
            });
        });
    }));
};
