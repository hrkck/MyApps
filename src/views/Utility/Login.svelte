<!-- Login.svelte -->
<script>
  import { onMount } from "svelte";
  import { gun, user } from "../../scripts/gun";

  let alias = "";
  let pass = "";

  onMount(async () => {
    // Listen for authentication changes
    gun.on("auth", () => {
      console.log("User is authenticated");
    });
    // You might want to navigate to another route or change the UI accordingly
    console.log("user: ", user);
    console.log(user.is.alias);
    if (user.is) {
      // const encryptedAlias = localStorage.getItem("encryptedAlias");
      // const encryptedPass = localStorage.getItem("encryptedPass");
      // const pairSerialized = localStorage.getItem("pair");

      // if (encryptedAlias && encryptedPass && pairSerialized) {
      //   const pair = JSON.parse(pairSerialized); // Deserialize the pair
      //   alias = await Gun.SEA.decrypt(encryptedAlias, pair);
      // }
      console.log(alias, pass);
      pass = "********";
    }
  });

  const signUp = () => {
    user.create(alias, pass, (ack) => {
      if (ack.err) {
        console.error("Sign-up error:", ack.err);
        // Handle sign-up error (e.g., user already exists)
      } else {
        console.log("Sign-up successful:", ack);
        // Optionally, automatically log the user in after sign-up
      }
    });
  };

  const signIn = () => {
    user.auth(alias, pass, (ack) => {
      if (ack.err) {
        console.error("Sign-in error:", ack.err);
        // Handle sign-in error
      } else {
        console.log("Sign-in successful:", ack);
        // Proceed with user session initialization
      }
    });
  };

  // Prevent form submission default action
  const handleSubmit = (event) => {
    event.preventDefault();
    signIn(); // Assuming signing in is the default action
  };
</script>

<h1>Login</h1>

<div>
  <h2>Login/Register</h2>
  <div>
    <form on:submit|preventDefault={handleSubmit}>
      <input type="text" bind:value={alias} placeholder="username" />
      <input type="password" bind:value={pass} placeholder="passphrase" />
      <button type="submit">Sign In</button>
    </form>
  </div>
  <div>
    <button on:click={signUp}>Sign Up</button>

    <!-- <button on:click={login}>Login</button> -->
    <!-- <button on:click={logout}>Logout</button> -->
  </div>
  <!-- {#if message}
      <p>{message}</p>
    {/if} -->
</div>

<style>
  /* Add your CSS here */
</style>
