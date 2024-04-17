// gun.js
import Gun from "gun/gun";
import "gun/axe";
import "gun/sea";
import "gun/lib/radix";
import "gun/lib/radisk";
import "gun/lib/store";
import "gun/lib/rindexed";
import "gun/lib/webrtc";
import { generateRandomPassword, generateRandomUsername } from "./utils";
import { addWindowStore } from "./storage";

export const gun = Gun({
  localStorage: false, // use indexdb
  peers: ["https://hakkisapps.labb.top/gun"],
});
export const SEA = Gun.SEA;
export const user = gun.user()//.recall({ sessionStorage: false });

function initGunDB(){
  user
  .get("windows")
  .map()
  .once((data) => {
    if (data && data.uniqueID) {
      // console.log(data);
      addWindowStore(data.uniqueID, { ...data, _: "unset-for-svelte-store" });
    }
  });
}

  export const initUser = async () => {
    // initialize user
    if (!user.is) {
      const encryptedAlias = localStorage.getItem("encryptedAlias");
      const encryptedPass = localStorage.getItem("encryptedPass");
      const pairSerialized = localStorage.getItem("pair");
  
      console.log('trying to init user');
      if (encryptedAlias && encryptedPass && pairSerialized) {
        try {
          const pair = JSON.parse(pairSerialized); // Deserialize the pair
          const alias = await SEA.decrypt(encryptedAlias, pair);
          const pass = await SEA.decrypt(encryptedPass, pair);
  
          // console.log(alias, pass);
          // Authenticate
          user.auth(alias, pass, (ack) => {
            if (ack.err) {
              console.error("Error re-authenticating:", ack.err);
            } else {
              console.log(
                "Re-authenticated successfully using stored credentials"
              );
              // console.log(user.is ? true : false);
              initGunDB()
            }
          });
        } catch (error) {
          console.error("Decryption error:", error);
        }
      } else {
        // Generate new credentials and key pair
        const alias = generateRandomUsername();
        const pass = generateRandomPassword();
        const pair = await SEA.pair();
  
        // Encrypt credentials and store them along with the pair
        const encryptedAlias = await SEA.encrypt(alias, pair);
        const encryptedPass = await SEA.encrypt(pass, pair);
        const pairSerialized = JSON.stringify(pair); // Serialize the pair for storage
  
        localStorage.setItem("encryptedAlias", encryptedAlias);
        localStorage.setItem("encryptedPass", encryptedPass);
        localStorage.setItem("pair", pairSerialized); // Store the serialized pair
  
        // Create and authenticate the new user
        user.create(alias, pass, (ack) => {
          if (ack.err) {
            console.error("Error creating user:", ack.err);
          } else {
            user.auth(alias, pass, (ack) => {
              if (ack.err) {
                console.error("Authentication error:", ack.err);
              } else {
                console.log("User created and authenticated successfully");
                console.log('user alias and password:, ', alias, ', ', pass);
              }
            });
          }
        });
      }
    } else {
      console.log("User is already authenticated.");
      // console.log(await SEA.decrypt(gun.user().is.alias, gun.user().pair));
    }
  };
