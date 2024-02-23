<!-- Login.svelte -->
<script>
  import { onMount } from "svelte";
  import { gun } from './../../js/db_service';

  let username = "";
  let password = "";

  let message = ""; // To display messages to the user

  onMount(() => {
    // Initialize any required setup for the login component
    console.log(gun.user().is);
    if(gun.user().is){
      username = gun.user().is.alias
      password = '********'
    }
  });
  
  async function login() {
    gun.user().auth(username, password, (ack) => {
      if (ack.err) {
        // If there's an error, it could mean the user doesn't exist
        console.error("Login failed:", ack.err);
        message = "Login failed. Try to register...";
        
        // Attempt to create the user since they don't exist
        // register();
      } else {
        // Login successful
        console.log("Login successful:", ack);
        message = "Login successful!";
        // Proceed with user session initialization
      }
    });
  }

  async function register() {
    gun.user().create(username, password, (ack) => {
      if (ack.err) {
        // Handle error in user creation
        console.error("Registration failed:", ack.err);
        message = "Registration failed: " + ack.err;
      } else {
        console.log("User created successfully:", ack);
        message = "User created successfully. Please log in.";
        // Now log the user in after successful registration
        login(); // Optionally call login directly or prompt the user to log in manually
      }
    });
  }

  async function logout() {
    gun.user().leave(); // Log out the current user
    message = "Logged out successfully.";
    console.log("User logged out.");
  }
</script>

<div>
  <h2>Login/Register</h2>
  <div>
    <input type="text" placeholder="Username" bind:value={username} />
    <input type="password" placeholder="Password" bind:value={password} />
  </div>
  <div>
    <button on:click={register}>Register</button>
    <button on:click={login}>Login</button>
    <button on:click={logout}>Logout</button>
  </div>
  {#if message}
    <p>{message}</p>
  {/if}
</div>

<style>
  /* Add your CSS here */
</style>
