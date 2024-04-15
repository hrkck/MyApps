// gun.js
import Gun from "gun/gun";
import "gun/axe";
import "gun/sea";
import "gun/lib/radix";
import "gun/lib/radisk";
import "gun/lib/store";
import "gun/lib/rindexed";
import "gun/lib/webrtc";
import "gun/nts";
import { generateRandomPassword, generateRandomUsername } from "./utils";
import { addWindowStore } from "./storage";

export const gun = Gun({
  localStorage: false, // use indexdb
  peers: ["https://hakkisapps.labb.top/gun"],
});
export const SEA = Gun.SEA;
export const user = gun.user().recall({ sessionStorage: false });

user
  .get("windows")
  .map()
  .once((data) => {
    if (data && data.uniqueID) {
      console.log(data);
      addWindowStore(data.uniqueID, { ...data, _: "unset-for-svelte-store" });
    }
  });

export const initUser = () => {
  // initialize user
  if (!user.is) {
    console.log("trying to init user");
    // Generate new credentials and key pair
    const alias = generateRandomUsername();
    const pass = generateRandomPassword();

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
            console.log("user alias and password:, ", alias, ", ", pass);
            // location.reload(); // without refresh ...get('foo').on() function is not running.
          }
        });
      }
    });
    // }
  } else {
    console.log("User is already authenticated.");
  }
};
