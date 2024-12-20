class RequestError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

class ValidationError extends RequestError {
  constructor(message: string, data: any) {
    super(message, 422, data);
  }
}

const handleError = (
  err: RequestError,
  req: any,
  res: any,
  next: any
): void => {
  let message = err.message || "Bad request";
  let data = null;

  if (err.status === 422) {
    message = "Invalid Entry";
    data = err.data;
  } else if (err.status === 404) {
    message = err.message || "Not Found";
  } else if (err.status === 401) {
    message = err.message || "Unauthorized user";
  } else if (err.status === 400) {
    message = message;
  } else {
    console.log(err.stack);
    message = "Server error";
  }

  const errData = {
    status: "failure",
    message,
    ...(data && { data: err.data }),
  };

  res.status(err.status).json(errData);
};

export { RequestError, ValidationError, handleError };
