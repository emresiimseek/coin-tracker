import React, { useState } from "react";
import "./Login.css";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

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
          <TextField
            id="outlined-basic"
            label="Kullanıcı Adı"
            variant="outlined"
            value={username}
            onChange={handleUsernameChange}
            type="text"
            style={{ marginBottom: 10 }}
            size="small"
          />

          <TextField
            id="outlined-basic"
            label="Parola"
            variant="outlined"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            size="small"
          />

          <Button
            type="submit"
            variant="outlined"
            color="success"
            style={{ marginTop: 10 }}
          >
            Giriş
          </Button>
        </form>
      </div>
    </div>
  );
}

export default LoginScreen;
