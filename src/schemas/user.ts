import Joi from "joi";

export const registerUserSchema = Joi.object({
  name: Joi.string().required().min(3).max(50).messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters long",
    "string.max": "Name must be at most 50 characters long",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Invalid email format",
  }),
  password: Joi.string().min(8).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters long",
  }),
  role: Joi.string()
    .valid("SUPER_ADMIN", "EVENT_OWNER", "BASE_USER")
    .required()
    .messages({
      "string.empty": "Role is required",
      "any.only":
        "Invalid role. Valid roles are SUPER_ADMIN, EVENT_OWNER, BASE_USER",
    }),
  company: Joi.string().when("role", {
    is: "EVENT_OWNER",
    then: Joi.string().required().min(3).max(50).messages({
      "string.empty": "Company name is required for event owners",
      "string.min": "Company name must be at least 3 characters long",
      "string.max": "Company name must be at most 50 characters long",
    }),
    otherwise: Joi.optional(),
  }),
  companyId: Joi.optional(),
});

export const loginUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Invalid email format",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
});

export const resetPasswordRequestSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  token: Joi.string().required(),
  password: Joi.string().min(8).required().messages({
    "string.min": "8 characters minimum",
  }),
});

export const changePasswordSchema = Joi.object({
  old_password: Joi.string().required(),
  new_password: Joi.string().min(8).required().messages({
    "string.min": "8 characters minimum",
  }),
});
