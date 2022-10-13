import styled from '@emotion/styled';
import React, { useCallback } from 'react';

import { buttons, GoBackButton, shadows } from '../../ui';
import Icon from '../../components/UI/Icon';

import type { MouseEvent } from 'react';
import type { AuthenticationPageProps, TranslatedProps } from '../../interface';

const StyledAuthenticationPage = styled.section`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const PageLogoIcon = styled(Icon)`
  color: #c4c6d2;
  margin-top: -300px;
`;

const LoginButton = styled.button`
  ${buttons.button};
  ${shadows.dropDeep};
  ${buttons.default};
  ${buttons.gray};

  padding: 0 30px;
  margin-top: -40px;
  display: flex;
  align-items: center;
  position: relative;

  ${Icon} {
    margin-right: 18px;
  }
`;

const AuthenticationPage = ({
  inProgress = false,
  config,
  onLogin,
  t,
}: TranslatedProps<AuthenticationPageProps>) => {
  const handleLogin = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      onLogin({ token: 'fake_token' });
    },
    [onLogin],
  );

  return (
    <StyledAuthenticationPage>
      <PageLogoIcon size="300px" type="static-cms" />
      <LoginButton disabled={inProgress} onClick={handleLogin}>
        {inProgress ? t('auth.loggingIn') : t('auth.login')}
      </LoginButton>
      {config.site_url && <GoBackButton href={config.site_url} t={t}></GoBackButton>}
    </StyledAuthenticationPage>
  );
};

export default AuthenticationPage;
