import React, { useState } from "react";
import "./Login.css";

function LoginScreen({ onLogin }: { onLogin: (value: boolean) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleUsernameChange = (event: any) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event: any) => {
    setPassword(event.target.value);
  };

  const handleSubmit = (event: any) => {
    event.preventDefault();
    console.log(process.env.REACT_APP_API_KEY);

    if (
      username === process.env.REACT_APP_USER_NAME &&
      password === process.env.REACT_APP_PASSWORD
    ) {
      console.log("Başarılı");
      sessionStorage.setItem("isLogin", "true");
      onLogin(true);
    } else alert("Kullanıcı adı veya şifre yanlış.");
  };

  return (
    <div className="login-base">
      <div className="login-container">
        <h2>Giriş</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="username">Kullanıcı Adı</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={handleUsernameChange}
            required
          />

          <label htmlFor="password">Parola</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={handlePasswordChange}
            required
          />

          <button className="login-button" type="submit">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginScreen;
