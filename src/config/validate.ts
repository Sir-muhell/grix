import Joi from "joi";
import { ValidationError } from "./handler";

const validate = (schema: Joi.Schema, data: any) => {
  const { error } = schema.validate(data);

  if (error) {
    throw new ValidationError(
      "Invalid Entry",
      error.details.reduce(
        (acc: Record<string, string>, curr: Joi.ValidationErrorItem) => {
          if (curr.context && curr.context.key) {
            acc[curr.context.key] = curr.message.replace(/["']/g, "");
          }
          return acc;
        },
        {}
      )
    );
  }
  return data;
};

export default validate;
