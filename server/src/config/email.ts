import env from "./env.js";

const emailConfig = {
  host: env.emailHost,
  port: env.emailPort,
  secure: env.emailPort === 465,
  auth: {
    user: env.emailUser,
    pass: env.emailPassword,
  },
  from: env.emailFrom,
};

export default emailConfig;
