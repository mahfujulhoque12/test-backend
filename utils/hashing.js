const { hash, compare } = require("bcryptjs");
const { createHmac } = require("crypto");

exports.doDash = (value, saltValue) => {
  const result = hash(value, saltValue);
  return result;
};

exports.doHashValidation = async (value, hashValue) => {
  return await compare(value, hashValue);
};

exports.hmacProcess = async (value, key) => {
  const result = await createHmac("sha256", key).update(value).digest("hex");
  return result;
};
