const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config();

const validPassword = (dbPassword, passwordToMatch) => {
  return bcrypt.compareSync(passwordToMatch, dbPassword);
};

const generatePassword = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

module.exports = {
  validPassword,
  generatePassword,
};
