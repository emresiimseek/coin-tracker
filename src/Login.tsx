import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { toast } from "react-toastify";

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

    if (
      username === process.env.REACT_APP_USER_NAME &&
      password === process.env.REACT_APP_PASSWORD
    ) {
      toast("Başarılı", { type: "success", position: "top-center" });
      sessionStorage.setItem("isLogin", "true");
      onLogin(true);
    } else
      toast("Kullanıcı adı veya parola yanlış.", {
        type: "error",
        position: "top-center",
      });
  };

  return (
    <div className="login-base">
      <div className="login-container">
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
            style={{ textTransform: "capitalize" }}
          >
            Giriş
          </Button>
        </form>
      </div>
    </div>
  );
}

export default LoginScreen;
