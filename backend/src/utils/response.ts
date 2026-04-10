import { Response } from 'express';

export const sendSuccess = (
  res: Response,
  data: unknown,
  message = 'Success',
  statusCode = 200
) => {
  return res.status(statusCode).json({ success: true, message, data });
};

export const sendError = (
  res: Response,
  message = 'Internal Server Error',
  statusCode = 500,
  errors?: unknown
) => {
  const payload: { success: boolean; message: string; errors?: unknown } = {
    success: false,
    message,
  };

  if (typeof errors !== 'undefined') {
    payload.errors = errors;
  }

  return res.status(statusCode).json({
    ...payload,
  });
};
