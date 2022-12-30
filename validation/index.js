const Joi = require("joi");

const userSchema = Joi.object().keys({
  name: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email({
    minDomainSegments: 2,
    tlds: { allow: ["com", "net"] },
  }).required(),
});

const countrySchema = Joi.object().keys({
  name: Joi.string().alphanum().min(3).max(30).required(),
});


const emailSchema = Joi.object().keys({
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    })
    .required(),
});


module.exports = { userSchema, countrySchema, emailSchema };