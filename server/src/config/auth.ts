import type { SignOptions } from 'jsonwebtoken';
import env from './env.js';

const authConfig: {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiresIn: SignOptions['expiresIn'];
  refreshTokenExpiresIn: SignOptions['expiresIn'];
  refreshCookieName: string;
} = {
  accessTokenSecret: env.jwtAccessSecret,
  refreshTokenSecret: env.jwtRefreshSecret,
  accessTokenExpiresIn: '15m',
  refreshTokenExpiresIn: '7d',
  refreshCookieName: 'dom_refresh_token',
};

export default authConfig;