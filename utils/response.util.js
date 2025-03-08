exports.success = (
  res,
  data,
  message = "Operation successful",
  statusCode = 200
) => {
  return res.status(statusCode).send({
    success: true,
    message,
    data,
  });
};

exports.error = (
  res,
  message = "Something went wrong",
  statusCode = 500,
  errors = null
) => {
  return res.status(statusCode).send({
    success: false,
    message,
    errors: errors || [message],
  });
};
