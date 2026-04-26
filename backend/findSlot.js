const pkcs11js = require("pkcs11js");
require("dotenv").config();

const pkcs11 = new pkcs11js.PKCS11();
pkcs11.load(process.env.PKCS11_LIB);
pkcs11.C_Initialize();

const slots = pkcs11.C_GetSlotList(true);
console.log(`Nombre de slots détectés : ${slots.length}`);

slots.forEach((slot, index) => {
  const info = pkcs11.C_GetSlotInfo(slot);
  console.log(`Slot ${index} :`, info);
});

pkcs11.C_Finalize();