// gun.js
import Gun from "gun/gun";
import "gun/sea";
import "gun/lib/webrtc";
import "gun/lib/radix";
import "gun/lib/radisk";
import "gun/lib/store";
import "gun/lib/rindexed";
import "gun/axe";
import { cleanGunData, generateRandomPassword, generateRandomUsername } from "./utils";
import { addWindowStore } from "./storage";
import { writable } from "svelte/store";

export const gun = Gun({
  localStorage: false,
  peers: ["wss://myapps.ideasofhakki.com/gun"],
});
export const SEA = Gun.SEA;
export const user = gun.user().recall({ sessionStorage: true });
export const username = writable('');


console.log(Object.keys(gun.back('opt').peers));

user.get('alias').on(v => username.set(v))
gun.on('auth', async (event)=>{
  const alias = await user.get('alias');
  username.set(alias);
  username.subscribe((alias)=>console.log(alias))
})

export async function initGunDB() {
  user
    .get("windows")
    .map()
    .once((data) => {
      console.log(data.uniqueID, cleanGunData(data));
      if (data && data.uniqueID) {
        addWindowStore(data.uniqueID, cleanGunData(data));
      }
    });
}

export const initUser = (async () => {
  // initialize user
  if (!user.is) {
  //   const encryptedAlias = localStorage.getItem("encryptedAlias");
  //   const encryptedPass = localStorage.getItem("encryptedPass");
  //   const pairSerialized = localStorage.getItem("pair");

  //   console.log("trying to init user");
  //   if (encryptedAlias && encryptedPass && pairSerialized) {
  //     try {
  //       const pair = JSON.parse(pairSerialized); // Deserialize the pair
  //       const alias = await SEA.decrypt(encryptedAlias, pair);
  //       const pass = await SEA.decrypt(encryptedPass, pair);
  //       // Authenticate
  //       user.auth(alias, pass, (ack) => {
  //         if (ack.err) {
  //           console.error("Error re-authenticating:", ack.err);
  //         } else {
  //           console.log("Re-authenticated successfully using stored credentials");
  //           // console.log(user.is ? true : false);
  //           initGunDB();
  //         }
  //       });
  //     } catch (error) {
  //       console.error("Decryption error:", error);
  //     }
  //   } else {
      // Generate new credentials and key pair
      const alias = generateRandomUsername();
      const pass = generateRandomPassword();
      const pair = await SEA.pair();
      username.set(alias)
      
      // Encrypt credentials and store them along with the pair
      let encryptedAlias = await SEA.encrypt(alias, pair);
      let encryptedPass = await SEA.encrypt(pass, pair);
      let pairSerialized = JSON.stringify(pair); // Serialize the pair for storage

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
              // console.log("user alias and password:, ", alias, ", ", pass);
            }
          });
        }
      });
    // }
  } else {
    console.log("User is already authenticated.");
  }
})();
