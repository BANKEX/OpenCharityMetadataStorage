import passport from 'koa-passport';
import passLocal from 'passport-local';
import passJwt from 'passport-jwt';
import {JWT} from '../../config.js';
import { User } from '../../modules/user/models';

export default (app) => {
  const authExt = (ctx) => ((ctx.headers.authorization) ? ctx.headers.authorization : null);
  const cookieExt = (ctx) => ((ctx.header.cookie!=undefined) ? ctx.cookies.get('jwt') : null);
  const bodyExt = (ctx) => ((ctx.body.jwt!=undefined) ? ctx.body.jwt : null);
  const queryExt = (ctx) => ((ctx.query.jwt!=undefined) ? ctx.query.jwt : null);

  // ---local---
  passport.use(new passLocal.Strategy({
      usernameField: 'email',
      passwordField: 'password',
    },
    async function(email, password, done) {
      try {
        const user = await User.findOne({ email });
        if (!user) return done(null, false);
        if (!user.comparePasswords(password)) return done(null, false);
        return done(null, user);
      } catch (err) {
        console.error(err);
        return done(err);
      }
    }
  ));

  // ---jwt---
  passport.use(new passJwt.Strategy({
      secretOrKey: JWT.secret,
      timeout: JWT.exp,
      jwtFromRequest: passJwt.ExtractJwt.fromExtractors([authExt, cookieExt, bodyExt, queryExt]),
    },
    async function(payload, done) {
      try {
        const { _id } = payload;
        const user = await User.findOne({ _id });
        return done(null, (user) ? user : false);
      } catch (err) {
        console.error(err);
        return done(err);
      }
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());
};
