// Import gun instance

import { gun } from "./db_service";
import 'gun/sea';
import 'gun/axe';

// Utility function to generate random strings
function generateRandomString(length = 8) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Function to initialize user session
export async function initializeUserSession() {
    gun.on( 'auth', ack => console.log('Authentication was successful: ', ack))
//   gun.on("out", { get: { "#": "healthcheck" } });

//   gun.on("in", (msg) => {
//     console.log("Received a message from a peer:", msg);
//     // You might use message patterns or specific data to infer peer health
//   });

//   // Attempt to read or write a small piece of data
//   gun.get("healthcheck").put({ timestamp: Date.now() }, (ack) => {
//     if (ack.err) {
//       console.error("Peer health check failed:", ack.err);
//       // Handle the peer being down or unreachable
//     } else {
//       console.log("Peer health check succeeded");
//       // Peer is up, proceed with further operations
//     }
//   });

  const user = gun.user().recall({sessionStorage: true});
  console.log(user.is);
//   user.delete()
  // Attempt to re-authenticate the user based on existing session data
//   user.recall({ sessionStorage: false }, (ack) => {
//     // Using sessionStorage: false to ensure persistence across browser restarts
//     console.log(ack);
//     console.log(user.is);
//     if (user.is) {
//       console.log("Existing user session found. User is logged in.");
//       // User is logged in, you can proceed to load user data or application state
//     } else {
//       // No existing user session found, create a new user
//       const randomUsername = generateRandomString();
//       const randomPassword = generateRandomString();

//       user.create(randomUsername, randomPassword, (createAck) => {
//         if (createAck.err) {
//           console.error("Error creating a new user:", createAck.err);
//         } else {
//           console.log(
//             "New user created. Attempting to log in...",
//             randomUsername
//           );
//           // Log in the newly created user
//           user.auth(randomUsername, randomPassword, (authAck) => {
//             if (authAck.err) {
//               console.error("Error logging in new user:", authAck.err);
//             } else {
//               console.log("New user logged in successfully.");
//               // Here you can initialize any user-specific data or application state
//             }
//           });
//         }
//       });
//     }
//   });
}
