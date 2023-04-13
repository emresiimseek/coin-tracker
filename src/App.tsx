import { useEffect, useState } from "react";
import CoinTracker from "./CointTrackerTable";
import LoginScreen from "./Login";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [isLogin, setIsLogin] = useState<boolean>(false);

  useEffect(() => {
    const data = sessionStorage.getItem("isLogin");
    setIsLogin(!!data);
  }, []);

  const AppComponent = () => (
    <>
      <ToastContainer />
      {isLogin ? (
        <CoinTracker />
      ) : (
        <LoginScreen onLogin={(value) => setIsLogin(value)} />
      )}
    </>
  );

  return <AppComponent />;
}

export default App;
