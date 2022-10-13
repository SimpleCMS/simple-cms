import styled from '@emotion/styled';
import React from 'react';
import TopBarProgress from 'react-topbar-progress-indicator';

import { colors } from '../../ui';
import Header from './Header';

import type { ReactNode } from 'react';

TopBarProgress.config({
  barColors: {
    0: colors.active,
    '1.0': colors.active,
  },
  shadowBlur: 0,
  barThickness: 2,
});

const StyledMainContainerWrapper = styled.div`
  position: relative;
  padding: 24px;
  gap: 24px;
  box-sizing: border-box;
`;

const StyledMainContainer = styled.div`
  min-width: 1200px;
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  gap: 24px;
  position: relative;
`;

interface MainViewProps {
  children: ReactNode;
}

const MainView = ({
  children,
}: MainViewProps) => {
  return (
    <>
      <Header />
      <StyledMainContainerWrapper>
        <StyledMainContainer>{children}</StyledMainContainer>
      </StyledMainContainerWrapper>
    </>
  );
};

export default MainView;
