import { useEffect, useState } from "react";      
import { Auth} from "aws-amplify";
import { Navigate, } from "react-router-dom";      



const PrivateRoute = ({children}: any) => {
  const [authenticated, setAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  const setFlag = async() =>{
    const user = await Auth.currentUserInfo();    
    setAuthenticated(user['attributes']['custom:spare_role'] === '9'?true:false);
    setIsChecking(false)
  }

  useEffect(() => {    
    setFlag();
  }, [authenticated]);
  
  if(isChecking) return <p>Checking....</p>

  return authenticated ? children : <Navigate to="/rag" />;
};


export default PrivateRoute;