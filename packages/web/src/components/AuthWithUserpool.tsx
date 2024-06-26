import { Amplify, I18n } from 'aws-amplify';
import { Authenticator, translations } from '@aws-amplify/ui-react';
import './AuthWithUserpool.css';
import App from '../App.tsx';
import { AppStateProvider } from "../state/AppProvider";

const selfSignUpEnabled: boolean =
  import.meta.env.VITE_APP_SELF_SIGN_UP_ENABLED === 'true';

const AuthWithUserpool: React.FC = () => {
  Amplify.configure({
    Auth: {
      userPoolId: import.meta.env.VITE_APP_USER_POOL_ID,
      userPoolWebClientId: import.meta.env.VITE_APP_USER_POOL_CLIENT_ID,
      identityPoolId: import.meta.env.VITE_APP_IDENTITY_POOL_ID,
      authenticationFlowType: 'USER_SRP_AUTH',
    },
  });

  I18n.putVocabularies(translations);
  I18n.setLanguage('ja');

  return (
    // <ThemeProvider theme={myTheme}>
      <>
      <Authenticator
        hideSignUp={!selfSignUpEnabled}
        components={{
          Header: () => (
            <div>
              <div className="text-aws-font-color mb-5 mt-10 flex justify-center text-3xl" style={{marginTop: '180px'}}>
              <span style={{ fontSize: '24px' }}>Generative AI on Mirait One Systems</span>
              </div>
            </div>
          ),
        }}>
        <AppStateProvider>
          <App />
        </AppStateProvider>
        
      </Authenticator>
      </>
   // </ThemeProvider>
  );
};

export default AuthWithUserpool;
