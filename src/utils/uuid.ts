import crypto from 'crypto';

export const uuid = () => {
  const UUID_SIZE = 8;
  return crypto.randomBytes(UUID_SIZE).toString('hex');
};
