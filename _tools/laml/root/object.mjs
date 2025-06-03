import serial from '../tool/serial.mjs';

export const properties = {
  id: (_self) => ({
    value: serial(),
  }),
};
