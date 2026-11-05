import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET phải tồn tại và có ít nhất 32 ký tự.");
  }
  return secret;
};

export const signAccessToken = (user) => {
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";

  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      typ: "access",
    },
    getJwtSecret(),
    { expiresIn, issuer: "online-course-api", audience: "online-course-client" }
  );
};

export const verifyAccessToken = (token) => {
  const payload = jwt.verify(token, getJwtSecret(), {
    issuer: "online-course-api",
    audience: "online-course-client",
  });

  if (payload.typ !== "access") {
    throw new Error("Sai loại token.");
  }

  return payload;
};
