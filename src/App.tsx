/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { OrganigramProvider } from './context/OrganigramContext';
import { OrganigrammaPage } from './pages/OrganigrammaPage';

export default function App() {
  return (
    <ThemeProvider>
      <OrganigramProvider>
        <OrganigrammaPage />
      </OrganigramProvider>
    </ThemeProvider>
  );
}
